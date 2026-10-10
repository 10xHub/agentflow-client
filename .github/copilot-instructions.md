# Copilot Instructions for 10xgraph-client

## Project Overview

- **10xgraph-client** is the TypeScript client for the 10xGraph API server (`10xgraph-api`),
  usable in browsers and Node >= 18.
- The main class is `TenxGraphClient` (`src/client.ts`), configured with `TenxGraphConfig`
  (`baseUrl`, optional `authToken` / `auth`, `headers`, `credentials`, `timeout`, `debug`,
  `webSocketImpl`).
- Each server endpoint has its own module in `src/endpoints/` (for example `ping.ts` calls
  `GET /ping`); `TenxGraphClient` methods build a context and delegate to them.
- Client-side tool execution lives in `src/tools.ts` (`ToolExecutor`, `ToolRegistration`).
- Shared WebSocket plumbing (the `10xgraph-bearer` subprotocol) lives in `src/ws.ts`.
- `src/compat.ts` holds the deprecated `AgentFlow*` aliases; they are removed in 2.0.

## Example

```ts
import { TenxGraphClient, Message } from '10xgraph-client';

const client = new TenxGraphClient({
  baseUrl: 'http://localhost:8000',
  authToken: 'token',
  debug: true,
});

const result = await client.invoke([Message.text_message('Hello', 'user')]);
```

## Developer Workflows

- `npm run build`: clean, emit declarations with `tsc`, bundle ESM + CJS with Vite.
- `npm run check`: eslint, `tsc --noEmit`, and the Vitest suite in `tests/`.
- Add a test in `tests/` for every new endpoint or behavior change.

## Project Conventions

- TypeScript, ES modules, strict mode. Relative imports use the `.js` extension.
- No runtime dependencies; HTTP uses the global `fetch`.
- Do not reference the `NodeJS` namespace in `src/`; the package also targets browsers.
- API errors are thrown as `TenxGraphError` subclasses created by `createErrorFromResponse`.
- New endpoints: add a module under `src/endpoints/`, export it from `src/index.ts`, and expose
  it as a `TenxGraphClient` method. Endpoint URLs are versioned (`/v1/...`).
