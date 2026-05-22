import { Message } from '../message.js';
import { ToolExecutor } from '../tools.js';
import { buildHeaders, RequestContext } from '../request.js';
import { StreamChunk, StreamEventType, StreamRequest, serializeMessage } from './stream.js';

// ─────────────────────────────────────────────────────────────────────────────
// Public types
// ─────────────────────────────────────────────────────────────────────────────

export interface WsStreamContext extends RequestContext {
    toolExecutor?: ToolExecutor;
}

// ─────────────────────────────────────────────────────────────────────────────
// Internal types  (mirror the server's WsGraphInputSchema)
// ─────────────────────────────────────────────────────────────────────────────

interface WsGraphInput {
    invoke_type: 'fresh' | 'resume';
    messages?: any[];
    tool_result?: any[];
    initial_state?: Record<string, any>;
    config?: Record<string, any>;
    recursion_limit?: number;
    response_granularity?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const REMOTE_TOOL_CALL_REASON = 'Remote tool call - graph interrupted';

/** True when a chunk signals that the graph paused for a remote tool call. */
function isRemoteToolCallChunk(chunk: StreamChunk): boolean {
    return (
        chunk.event === StreamEventType.UPDATES &&
        (chunk.data as any)?.reason === REMOTE_TOOL_CALL_REASON
    );
}

/** True when any collected message contains a remote_tool_call block. */
function hasRemoteToolCalls(messages: Message[]): boolean {
    return messages.some(
        (msg) =>
            msg.content &&
            msg.content.some((block: any) => block.type === 'remote_tool_call')
    );
}

/**
 * Convert the HTTP base URL to a WebSocket URL and append the graph WS path.
 *
 * Auth strategy
 * ─────────────
 * Browser WebSocket API cannot set custom headers, so the bearer token is
 * appended as a ``?token=`` query parameter.  The server's RequirePermission
 * dependency falls back to this parameter when no Authorization header is
 * present (added in the companion server PR).
 *
 * In non-browser environments (Node.js + ws / undici) that DO support custom
 * WS headers the caller can additionally pass the Authorization header via
 * the options object — but the query param path always works as a fallback.
 */
function buildWsUrl(context: WsStreamContext): string {
    const base =
        context.baseUrl
            .replace(/^https:/, 'wss:')
            .replace(/^http:/, 'ws:')
            .replace(/\/$/, '') + '/v1/graph/ws';

    // Resolve the bearer token from the context (same priority as buildHeaders)
    let token: string | null = null;
    if (context.authToken) {
        token = context.authToken;
    } else if (context.auth?.type === 'bearer') {
        token = context.auth.token;
    }

    if (token) {
        return `${base}?token=${encodeURIComponent(token)}`;
    }
    return base;
}

/**
 * Open a WebSocket to the given URL.
 *
 * On Node.js runtimes that accept additional options in the `WebSocket`
 * constructor (e.g. `ws`, `undici`) we also attempt to pass the Authorization
 * header directly so the token is not exposed in the URL.  If the constructor
 * does not accept options the plain URL is used.
 */
function openWebSocket(url: string, context: WsStreamContext): WebSocket {
    const allHeaders = buildHeaders(context) as Record<string, string>;
    const authHeader = allHeaders['Authorization'] || allHeaders['authorization'];

    if (authHeader) {
        try {
            // Node.js WebSocket implementations (ws, undici) accept a third
            // `options` argument.  This cast is intentional — the browser's
            // WebSocket constructor ignores unknown arguments silently.
            // @ts-ignore
            return new WebSocket(url, undefined, { headers: { Authorization: authHeader } });
        } catch {
            // Fall through to plain constructor
        }
    }

    return new WebSocket(url);
}

// ─────────────────────────────────────────────────────────────────────────────
// Core implementation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Stream invoke via a persistent WebSocket connection.
 *
 * The protocol is:
 *
 *   1. Connect to ``/v1/graph/ws`` (auth via ``?token=`` or Authorization header).
 *   2. Send ``{ invoke_type:"fresh", messages:[…], config:{…}, … }``.
 *   3. Receive ``StreamChunk`` JSON messages; yield each to the caller.
 *   4. Server sends ``{ event:"updates", data:{ status:"done" } }`` after each run.
 *   5. If the run contained remote tool calls, execute them and send:
 *      ``{ invoke_type:"resume", tool_result:[…], config:{ thread_id } }``.
 *   6. Repeat from step 3 until no more tool calls.
 *   7. Close the WebSocket.
 *
 * This replaces the HTTP loop in ``streamInvoke`` — the round-trip cost of
 * re-opening a new HTTP connection for each tool call is eliminated.
 *
 * @example
 * ```ts
 * const stream = wsStreamInvoke(context, request);
 * for await (const chunk of stream) {
 *   if (chunk.event === 'message') console.log(chunk.message);
 * }
 * ```
 */
export async function* wsStreamInvoke(
    context: WsStreamContext,
    request: StreamRequest
): AsyncGenerator<StreamChunk, void, unknown> {
    const url = buildWsUrl(context);

    if (context.debug) {
        console.debug('AgentFlowClient [WS]: connecting to', url.replace(/[?&]token=[^&]*/g, '?token=***'));
    }

    const ws = openWebSocket(url, context);

    // ── Queue bridge ──────────────────────────────────────────────────────────
    // WebSocket is event-based; async generators are pull-based.
    // We buffer incoming items in a queue and wake up the generator each time.
    const queue: Array<StreamChunk | Error | 'close'> = [];
    let wakeUp: (() => void) | null = null;

    const enqueue = (item: StreamChunk | Error | 'close'): void => {
        queue.push(item);
        if (wakeUp) {
            const fn = wakeUp;
            wakeUp = null;
            fn();
        }
    };

    const waitForItem = (): Promise<void> =>
        new Promise((resolve) => {
            if (queue.length > 0) {
                resolve();
            } else {
                wakeUp = resolve;
            }
        });

    ws.addEventListener('message', (event: MessageEvent) => {
        try {
            const chunk = JSON.parse(event.data as string) as StreamChunk;
            enqueue(chunk);
        } catch (e) {
            if (context.debug) {
                console.warn('AgentFlowClient [WS]: failed to parse chunk:', e);
            }
        }
    });

    ws.addEventListener('error', () => {
        enqueue(new Error('WebSocket error'));
    });

    ws.addEventListener('close', (event: CloseEvent) => {
        if (context.debug) {
            console.debug('AgentFlowClient [WS]: connection closed, code=', event.code);
        }
        enqueue('close');
    });

    // Wait for the connection to open (or fail)
    await new Promise<void>((resolve, reject) => {
        if (ws.readyState === WebSocket.OPEN) {
            resolve();
            return;
        }
        ws.addEventListener('open', () => resolve(), { once: true });
        ws.addEventListener('error', () => reject(new Error('WebSocket connection failed')), { once: true });
    });

    if (context.debug) {
        console.debug('AgentFlowClient [WS]: connected');
    }

    // ── Main loop ─────────────────────────────────────────────────────────────
    let threadId: string | undefined = (request.config as Record<string, any>)?.thread_id;

    let nextPayload: WsGraphInput = {
        invoke_type: 'fresh',
        messages: request.messages,
        initial_state: request.initial_state,
        config: request.config,
        recursion_limit: request.recursion_limit ?? 25,
        response_granularity: request.response_granularity,
    };

    try {
        outerLoop: while (true) {
            if (context.debug) {
                console.debug(
                    `AgentFlowClient [WS]: sending ${nextPayload.invoke_type} request, thread_id=${threadId ?? 'new'}`
                );
            }

            ws.send(JSON.stringify(nextPayload));

            // ── Inner loop: receive chunks until the server sends "done" ──────
            const runMessages: Message[] = [];

            innerLoop: while (true) {
                await waitForItem();
                const item = queue.shift()!;

                if (item === 'close') {
                    // Server closed the connection unexpectedly
                    break outerLoop;
                }

                if (item instanceof Error) {
                    throw item;
                }

                const chunk = item as StreamChunk;

                // Track thread_id for resume requests
                if (chunk.thread_id) {
                    threadId = chunk.thread_id;
                }
                if ((chunk.metadata as Record<string, any>)?.thread_id) {
                    threadId = (chunk.metadata as Record<string, any>).thread_id as string;
                }

                // "done" signal: current run is complete
                if (
                    chunk.event === StreamEventType.UPDATES &&
                    (chunk.data as any)?.status === 'done'
                ) {
                    break innerLoop;
                }

                // Accumulate messages for tool-call detection
                if (chunk.message) {
                    runMessages.push(chunk.message);
                }

                // Yield every chunk to the caller (same as HTTP stream)
                yield chunk;
            }

            if (context.debug) {
                console.debug(
                    `AgentFlowClient [WS]: run complete, ${runMessages.length} messages collected`
                );
            }

            // ── Tool-call detection & resume ──────────────────────────────────
            if (hasRemoteToolCalls(runMessages) && context.toolExecutor) {
                if (context.debug) {
                    console.debug('AgentFlowClient [WS]: remote tool calls detected, executing…');
                }

                const toolResults = await context.toolExecutor.executeToolCalls(runMessages);

                if (context.debug) {
                    console.debug(`AgentFlowClient [WS]: ${toolResults.length} tool result(s) ready, resuming`);
                }

                nextPayload = {
                    invoke_type: 'resume',
                    tool_result: toolResults.map(serializeMessage),
                    config: { ...(request.config ?? {}), thread_id: threadId },
                    recursion_limit: request.recursion_limit ?? 25,
                    response_granularity: request.response_granularity,
                };
                // continue outerLoop → send resume request
            } else {
                // No tool calls — the full run is done
                break outerLoop;
            }
        }
    } finally {
        if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
            ws.close(1000);
        }

        if (context.debug) {
            console.debug('AgentFlowClient [WS]: stream finished');
        }
    }
}
