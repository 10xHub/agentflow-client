import { AgentFlowAuth, buildHeaders } from './request.js';

/**
 * Sec-WebSocket-Protocol token the server recognizes for browser-safe bearer auth.
 * The client opens the socket with `[WS_BEARER_SUBPROTOCOL, "<jwt>"]`; the server
 * extracts the second protocol entry as the token. This works in browsers (which
 * cannot set request headers on a WebSocket) and avoids leaking the token in the URL.
 */
export const WS_BEARER_SUBPROTOCOL = 'agentflow-bearer';

/** Minimal constructor shape shared by the browser `WebSocket` and the Node `ws` package. */
export type WebSocketImpl = new (
  url: string,
  protocols?: string | string[],
  options?: unknown
) => WebSocket;

/** The auth/transport fields the WS helpers read from a request context. */
export interface WsAuthContext {
  baseUrl: string;
  authToken?: string | null;
  auth?: AgentFlowAuth | null;
  headers?: HeadersInit;
  credentials?: RequestCredentials;
  debug?: boolean;
  /** Optional WebSocket implementation for runtimes without a global (Node < 21). */
  webSocketImpl?: WebSocketImpl;
}

/** Resolve the bearer token with the same priority as `buildHeaders`. */
export function resolveBearerToken(
  context: Pick<WsAuthContext, 'authToken' | 'auth'>
): string | null {
  if (context.authToken) {
    return context.authToken;
  }
  if (context.auth?.type === 'bearer') {
    return context.auth.token;
  }
  return null;
}

/**
 * Convert the HTTP base URL to a WebSocket URL and append `path`.
 * The token is never placed in the URL — it travels via the `agentflow-bearer`
 * subprotocol (browser-safe) and, in Node, the Authorization header.
 */
export function buildWsUrl(
  context: Pick<WsAuthContext, 'baseUrl'>,
  path: string
): string {
  return (
    context.baseUrl
      .replace(/^https:/, 'wss:')
      .replace(/^http:/, 'ws:')
      .replace(/\/$/, '') + path
  );
}

/**
 * Open a WebSocket with bearer auth.
 *
 * - If a token is present it is sent as the `agentflow-bearer` subprotocol (works
 *   in browsers and Node `ws`).
 * - In Node-style implementations that accept a third `options` argument, the
 *   Authorization header is also passed (ignored by browsers).
 * - The implementation is taken from `context.webSocketImpl`, falling back to the
 *   global `WebSocket`. If neither exists a descriptive error is thrown.
 */
export function openWebSocket(url: string, context: WsAuthContext): WebSocket {
  const Impl: WebSocketImpl | undefined =
    context.webSocketImpl ??
    (globalThis as { WebSocket?: WebSocketImpl }).WebSocket;

  if (!Impl) {
    throw new Error(
      'No WebSocket implementation available. In Node < 21 pass `webSocketImpl` ' +
        "in the client config (e.g. the `ws` package: `new AgentFlowClient({ ..., webSocketImpl: WebSocket })`)."
    );
  }

  const token = resolveBearerToken(context);
  const protocols = token ? [WS_BEARER_SUBPROTOCOL, token] : undefined;

  const headers = buildHeaders(context);
  const authHeader = headers['Authorization'] ?? headers['authorization'];

  if (authHeader) {
    try {
      return new Impl(url, protocols, { headers: { Authorization: authHeader } });
    } catch {
      // Fall through: browser constructors reject the 3rd arg shape — retry plain.
    }
  }

  return new Impl(url, protocols);
}
