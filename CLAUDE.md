# agentflow-client (TypeScript SDK) — Engineering Guide

This file documents the **TypeScript/JS client SDK** only (`@10xscale/agentflow-client`). For the
API server it talks to, see `agentflow-api/CLAUDE.md`; for the core framework see
`agentflow/CLAUDE.md`; for the monorepo overview see the workspace-root `CLAUDE.md`.

- Package name (npm): `@10xscale/agentflow-client`
- Version: `0.2.0` · License: MIT · `"type": "module"` (ESM-first)
- Runtime: Node >= 18 (uses global `fetch`); also browser-targetable
- Language: TypeScript 5+, built with `tsc` + Vite, tested with Vitest

## What this package is

A typed client for the agentflow-api HTTP + WebSocket surface. One class, `AgentFlowClient`,
exposes a method per server endpoint (invoke, stream, threads, checkpointer state, memory store,
files) plus **client-side tool execution** (the server asks the client to run a registered tool,
the client runs it locally and returns the result, with recursion handling).

## Package layout

Entry point: `src/index.ts` -> `dist/index.js`. Source map:

| Path | What lives there |
|---|---|
| `src/client.ts` | `AgentFlowClient` (the main class) and `AgentFlowConfig` |
| `src/agent.ts` | `AgentState` (dynamic state container + `ExecutionMeta`). Note: this is NOT a high-level "Agent" wrapper class |
| `src/tools.ts` | Client-side tool execution: `ToolExecutor`, `ToolRegistration`, `ToolHandler`, `Tool`, `ToolDefinition` |
| `src/message.ts` | Message + content-block model mirroring the Python core (`TextBlock`, `ImageBlock`, `AudioBlock`, `VideoBlock`, `DocumentBlock`, `DataBlock`, `ToolCallBlock`, `RemoteToolCallBlock`, `MediaRef`, `AnnotationRef`, ...) |
| `src/request.ts` | Low-level request/auth helpers; `AgentFlowAuth` (Bearer / Basic / Header), `RequestContext` |
| `src/errors.ts` | Error types |
| `src/endpoints/` | One file per endpoint (request/response types + call impl): invoke, stream, wsStream, graph, setupGraph, stopGraph, fixGraph, stateSchema, threads, threadDetails, threadState, updateThreadState, clearThreadState, threadMessages, addThreadMessages, threadMessage, deleteThreadMessage, deleteThread, storeMemory, searchMemory, getMemory, updateMemory, deleteMemory, listMemories, forgetMemories, files, metadata, ping, realtime |
| `src/ws.ts` | Shared WebSocket plumbing: subprotocol auth, URL building, injectable impl |

## `AgentFlowClient`

```typescript
import { AgentFlowClient, Message } from '@10xscale/agentflow-client';

const client = new AgentFlowClient({
  baseUrl: 'http://localhost:8000',  // required
  // authToken?: string | null
  // auth?: AgentFlowAuth | null      // Bearer | Basic | Header
  // headers?: HeadersInit
  // credentials?: RequestCredentials
  // timeout?: number                 // default 5 min
  // debug?: boolean
  // webSocketImpl?: typeof WebSocket   // Node < 21 (pass the 'ws' package)
});
```

Methods map 1:1 onto the server (`agentflow-api`) endpoints:

- **Graph lifecycle:** `setup()`, `ping()`, `graph()`, `stopGraph(threadId, config?)`,
  `fixGraph(threadId, config?)`, `graphStateSchema()`.
- **Run:** `invoke(...)`, `stream(...)` (HTTP streaming), `wsStream(...)` (WebSocket),
  `realtime(init, options?)` (WebSocket audio-to-audio, transport-only; returns a `RealtimeSession`).
- **Threads / checkpointer:** `threads()` / `threads(request)`, `threadDetails(id)`,
  `threadState(id)`, `updateThreadState(...)`, `clearThreadState(id)`, `threadMessages(...)`,
  `addThreadMessages(...)`, `singleMessage(...)`, `deleteMessage(...)`, `deleteThread(...)`.
- **Memory store:** `storeMemory`, `searchMemory`, `getMemory`, `updateMemory`, `deleteMemory`,
  `listMemories`.
- **Files / multimodal:** `uploadFile(...)`, `getFile(id) -> Blob`, `getFileAccessUrl(id)`,
  `getMultimodalConfig()`.
- **Tools:** `registerTool(registration)` for client-side execution; remote tools are pushed to
  the server during setup.

## Client-side tool execution

`tools.ts` lets the browser/Node client own a tool's implementation. Register a `ToolHandler`
(name, description, parameters, and an `execute` fn) via `client.registerTool(...)`; the
`ToolExecutor` runs it when the server requests that tool during a run, then feeds the result
back. Good for browser-only capabilities (geolocation, clipboard, DOM, local state).

## Auth

`AgentFlowAuth` is a union: `AgentFlowBearerAuth | AgentFlowBasicAuth | AgentFlowHeaderAuth`.
Pass via `auth` in the config, or use the simpler `authToken` for bearer tokens.

## Development workflow

```bash
# from this folder (agentflow-client/)
npm install
npm run build        # tsc + vite build + copy dist-types
npm test             # vitest (watch)
npm run test:run     # vitest run (CI)
npm run test:coverage
```

- Tests live in `tests/` (~33 vitest files, one per endpoint/feature). `prepublishOnly` runs
  build + tests.
- `examples/` shows usage; `check.ts` is a large local scratch/integration script (not part of the
  build).

## Known doc drift (do not trust without checking)

- **There is no `Agent` class.** The workspace-root `CLAUDE.md` says "`Agent` class (TS) lives in
  `agentflow-client/src/agent.ts` (high-level client wrapper)". `agent.ts` actually defines
  `AgentState`. The high-level entry point is `AgentFlowClient` in `src/client.ts`.
- **0.2.0 changes:** a2a, a2ui, and the React surface were removed. The realtime audio client
  (`client.realtime(...)` returning `RealtimeSession`) and dual ESM/CJS exports were added.
