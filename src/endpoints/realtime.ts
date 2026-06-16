import { RequestContext } from '../request.js';
import { buildWsUrl, openWebSocket, WsAuthContext } from '../ws.js';

// ── Output audio sample rate (PCM16 mono @ 24 kHz), mirrors core OUTPUT_SAMPLE_RATE ──
export const REALTIME_OUTPUT_SAMPLE_RATE = 24000;
export const REALTIME_INPUT_SAMPLE_RATE = 16000;

// ─────────────────────────────────────────────────────────────────────────────
// Wire types (mirror agentflow.core.realtime; init keys verified against the
// server's GraphService._realtime_overrides mapping)
// ─────────────────────────────────────────────────────────────────────────────

export type ResponseModality = 'AUDIO' | 'TEXT';

export interface RealtimeVADConfig {
  enabled?: boolean;
  start_sensitivity?: string | null;
  end_sensitivity?: string | null;
  prefix_padding_ms?: number | null;
  silence_duration_ms?: number | null;
}

export interface RealtimeInit {
  /** Required, e.g. "gemini-2.5-flash-live". */
  model: string;
  /** Omit to let the session generate one (used for resume). */
  thread_id?: string;
  voice?: string;
  modalities?: ResponseModality | ResponseModality[];
  vad?: RealtimeVADConfig;
  system_prompt?: string;
  tools_tags?: string[];
  /** Forward-compatible passthrough; unknown keys are ignored by the server. */
  [k: string]: unknown;
}

/** Downstream JSON events. Audio arrives separately as binary via the `audio` channel. */
export type RealtimeEvent =
  | { type: 'input_transcript'; text: string; finished: boolean }
  | { type: 'output_transcript'; text: string; finished: boolean }
  | { type: 'tool_call'; id: string; name: string; args: Record<string, unknown> }
  | { type: 'tool_result'; id: string; result: unknown }
  | { type: 'turn_complete' }
  | { type: 'interrupted' }
  | { type: 'session_update'; resumption_handle?: string | null }
  | { type: 'go_away'; time_left?: string | null }
  | { type: 'agent_changed'; author: string }
  | { type: 'error'; code?: string | null; message: string; fatal: boolean };

export type RealtimeEventType = RealtimeEvent['type'];

export interface RealtimeReconnectOptions {
  enabled?: boolean;
  baseDelay?: number;
  maxDelay?: number;
  maxAttempts?: number;
}

export interface RealtimeOptions {
  reconnect?: RealtimeReconnectOptions;
  // Convenience handlers (sugar over `.on(...)`).
  onAudio?: (pcm16: Uint8Array, sampleRate: number) => void;
  onEvent?: (e: RealtimeEvent) => void;
  onError?: (e: Extract<RealtimeEvent, { type: 'error' }>) => void;
}

export type RealtimeContext = RequestContext & WsAuthContext;

// ── Lifecycle/event channels the emitter understands ─────────────────────────
type ChannelMap = {
  audio: (pcm16: Uint8Array, sampleRate: number) => void;
  event: (e: RealtimeEvent) => void;
  open: () => void;
  close: (code: number) => void;
  reconnecting: (attempt: number) => void;
  reconnected: () => void;
} & {
  [K in RealtimeEventType]: (e: Extract<RealtimeEvent, { type: K }>) => void;
};

type ChannelName = keyof ChannelMap;

function genThreadId(): string {
  const c = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto;
  if (c?.randomUUID) {
    return c.randomUUID();
  }
  // Fallback: timestamp-free, index-free pseudo-id is not required here because a
  // dropped session reuses this same id; uniqueness across sessions is enough.
  return 'rt-' + Math.abs(hashString(String(Date.now()))).toString(36);
}

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return h;
}

/** Normalize an incoming binary frame (ArrayBuffer / typed array / Buffer) to Uint8Array. */
function toUint8(data: unknown): Uint8Array | null {
  if (data instanceof ArrayBuffer) {
    return new Uint8Array(data);
  }
  if (ArrayBuffer.isView(data)) {
    const view = data as ArrayBufferView;
    return new Uint8Array(view.buffer, view.byteOffset, view.byteLength);
  }
  return null;
}

/**
 * A transport-only realtime audio session over `/v1/graph/live`.
 *
 * Send PCM16 input via `sendAudio`; receive PCM16 output via `.on('audio', ...)`.
 * All non-audio events arrive via `.on('event', ...)` and per-type channels.
 * Mic capture and audio playback are the caller's responsibility.
 */
export class RealtimeSession {
  readonly threadId: string;
  resumptionHandle: string | null = null;
  ready: Promise<void>;

  private ctx: RealtimeContext;
  private init: RealtimeInit;
  private ws: WebSocket | null = null;
  private listeners: Partial<Record<ChannelName, Function[]>> = {};
  private resolveReady!: () => void;
  private rejectReady!: (err: Error) => void;
  private readyResolved = false;
  private closedByUser = false;
  private fatal = false;
  private reconnectAttempts = 0;
  private readonly reconnectCfg: Required<RealtimeReconnectOptions>;

  constructor(ctx: RealtimeContext, init: RealtimeInit, options?: RealtimeOptions) {
    this.ctx = ctx;
    this.threadId = init.thread_id ?? genThreadId();
    this.init = { ...init, thread_id: this.threadId };

    this.reconnectCfg = {
      enabled: options?.reconnect?.enabled ?? true,
      baseDelay: options?.reconnect?.baseDelay ?? 0.5,
      maxDelay: options?.reconnect?.maxDelay ?? 10,
      maxAttempts: options?.reconnect?.maxAttempts ?? 5,
    };

    if (options?.onAudio) this.on('audio', options.onAudio);
    if (options?.onEvent) this.on('event', options.onEvent);
    if (options?.onError) this.on('error', options.onError as ChannelMap['error']);

    this.ready = new Promise<void>((resolve, reject) => {
      this.resolveReady = resolve;
      this.rejectReady = reject;
    });

    this.connect();
  }

  // ── Public send API ─────────────────────────────────────────────────────────
  sendAudio(pcm16: Uint8Array | ArrayBuffer): void {
    this.ws?.send(pcm16 as ArrayBuffer);
  }
  sendText(text: string): void {
    this.sendControl({ type: 'text', text });
  }
  activityStart(): void {
    this.sendControl({ type: 'activity_start' });
  }
  activityEnd(): void {
    this.sendControl({ type: 'activity_end' });
  }
  close(): void {
    this.closedByUser = true;
    this.sendControl({ type: 'close' });
    const ws = this.ws;
    if (ws && (ws.readyState === 0 || ws.readyState === 1)) {
      ws.close(1000);
    }
  }

  // ── Subscription API ─────────────────────────────────────────────────────────
  on<K extends ChannelName>(event: K, listener: ChannelMap[K]): this {
    if (!this.listeners[event]) this.listeners[event] = [];
    (this.listeners[event] as Function[]).push(listener as Function);
    return this;
  }
  off<K extends ChannelName>(event: K, listener: ChannelMap[K]): this {
    this.listeners[event] = (this.listeners[event] ?? []).filter((f) => f !== listener);
    return this;
  }

  // ── Internals ────────────────────────────────────────────────────────────────
  private emit<K extends ChannelName>(event: K, ...args: Parameters<ChannelMap[K]>): void {
    (this.listeners[event] ?? []).forEach((f) => {
      try {
        (f as (...a: unknown[]) => void)(...args);
      } catch (err) {
        if (this.ctx.debug) console.warn('AgentFlowClient [realtime]: listener threw', err);
      }
    });
  }

  private sendControl(frame: Record<string, unknown>): void {
    this.ws?.send(JSON.stringify(frame));
  }

  private connect(): void {
    const url = buildWsUrl(this.ctx, '/v1/graph/live');
    if (this.ctx.debug) console.debug('AgentFlowClient [realtime]: connecting to', url);

    const ws = openWebSocket(url, this.ctx);
    try {
      // Receive audio as ArrayBuffer rather than Blob (browser default is "blob").
      (ws as { binaryType?: string }).binaryType = 'arraybuffer';
    } catch {
      /* some impls disallow setting before open; ignore */
    }
    this.ws = ws;

    ws.addEventListener('open', () => {
      if (this.ws !== ws) return; // stale socket from a previous connection; ignore
      this.sendControl(this.init);
      if (!this.readyResolved) {
        this.readyResolved = true;
        this.resolveReady();
      }
      this.emit('open');
    });

    ws.addEventListener('message', (event: MessageEvent) => {
      if (this.ws !== ws) return; // stale socket from a previous connection; ignore
      this.handleMessage(event.data);
    });

    ws.addEventListener('close', (event: CloseEvent) => {
      if (this.ws !== ws) return; // stale socket from a previous connection; ignore
      const code = event?.code ?? 1000;
      this.emit('close', code);
      this.maybeReconnect();
    });

    ws.addEventListener('error', () => {
      if (this.ws !== ws) return; // stale socket from a previous connection; ignore
      if (!this.readyResolved) {
        this.readyResolved = true;
        this.rejectReady(new Error('Realtime WebSocket connection failed'));
      }
    });
  }

  private handleMessage(data: unknown): void {
    const audio = toUint8(data);
    if (audio) {
      this.emit('audio', audio, REALTIME_OUTPUT_SAMPLE_RATE);
      return;
    }
    if (typeof data !== 'string') return;
    let parsed: RealtimeEvent;
    try {
      parsed = JSON.parse(data) as RealtimeEvent;
    } catch {
      if (this.ctx.debug) console.warn('AgentFlowClient [realtime]: bad JSON frame', data);
      return;
    }
    if (parsed.type === 'session_update') {
      this.resumptionHandle = parsed.resumption_handle ?? this.resumptionHandle;
    }
    if (parsed.type === 'error' && parsed.fatal) {
      this.fatal = true;
    }
    this.emit('event', parsed);
    // Per-type channel. Cast is safe: the discriminant matches the channel name.
    this.emit(parsed.type as ChannelName, parsed as never);
  }

  private maybeReconnect(): void {
    if (this.closedByUser || this.fatal || !this.reconnectCfg.enabled) {
      return;
    }
    if (this.reconnectAttempts >= this.reconnectCfg.maxAttempts) {
      // Latch fatal so a duplicate close on the final socket can't re-emit the failure.
      this.fatal = true;
      const failure = {
        type: 'error' as const,
        code: 'reconnect_failed',
        message: `Realtime reconnect gave up after ${this.reconnectCfg.maxAttempts} attempt(s)`,
        fatal: true,
      };
      this.emit('error', failure);
      this.emit('event', failure);
      return;
    }
    this.reconnectAttempts += 1;
    const attempt = this.reconnectAttempts;
    const delayMs =
      Math.min(
        this.reconnectCfg.baseDelay * 2 ** (attempt - 1),
        this.reconnectCfg.maxDelay
      ) * 1000;
    this.emit('reconnecting', attempt);
    setTimeout(() => this.reconnect(), delayMs);
  }

  private reconnect(): void {
    // Forward the latest resumption handle so the provider can resume server-side.
    this.init = {
      ...this.init,
      thread_id: this.threadId,
      ...(this.resumptionHandle ? { resumption_handle: this.resumptionHandle } : {}),
    };
    const onceOpen = () => {
      this.reconnectAttempts = 0;
      this.emit('reconnected');
    };
    this.connect();
    this.ws?.addEventListener('open', onceOpen, { once: true } as AddEventListenerOptions);
  }
}
