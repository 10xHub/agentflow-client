# Release Notes

Human-facing notes for the current release. For the full history see
[CHANGELOG.md](CHANGELOG.md).

---

## 0.6.0: `@10xscale/agentflow-client` is now `10xgraph-client`

Same client, new name. Agentflow is now **10xGraph**, and the npm package follows:

```bash
npm uninstall @10xscale/agentflow-client
npm install 10xgraph-client
```

```typescript
// before
import { AgentFlowClient } from '@10xscale/agentflow-client';
// after
import { TenxGraphClient } from '10xgraph-client';
```

Changing the import is enough. `AgentFlowClient`, `AgentFlowError`, `AgentFlowConfig` and the
`AgentFlowAuth` types are still exported as deprecated aliases of the new `TenxGraph*` names,
so `instanceof AgentFlowError` keeps working. They are removed in 2.0.

### Upgrade the server for WebSockets

WebSocket bearer auth (`wsStream()`, `realtime()`) now offers the `10xgraph-bearer`
subprotocol. `10xgraph-api` 0.7.0 accepts it; older `10xscale-agentflow-cli` servers do not.
HTTP endpoints work against both.

### Smaller changes

- `error.name` is `'TenxGraphError'` for the base error class. Prefer `instanceof`.
- Debug logs are prefixed `TenxGraphClient:`.
- Docs moved to [10xgraph.com/docs](https://10xgraph.com/docs/client); the repository is
  [10xGraph/10xgraph-client](https://github.com/10xGraph/10xgraph-client).

---

## 0.5.0: the final release of `@10xscale/agentflow-client`

Agentflow is now **10xGraph**. The project continues under a new name because
"Agentflow" is shared by several unrelated projects, which made it hard to find.
Nothing about the client, its license or its maintainers changes.

No further versions of `@10xscale/agentflow-client` will be published to npm. Existing
installs keep working; pin `@10xscale/agentflow-client@0.5.0` if you need to stay on it.

|                   | Before                       | After                                              |
| ----------------- | ---------------------------- | -------------------------------------------------- |
| Core framework    | `10xscale-agentflow`         | `10xgraph` (import `tenxgraph`)                    |
| API server + CLI  | `10xscale-agentflow-cli`     | `10xgraph-api`                                     |
| TypeScript client | `@10xscale/agentflow-client` | announced in the 10xGraph repositories             |
| Website           | agentflow.10xscale.ai        | [10xgraph.com](https://10xgraph.com)               |
| GitHub            | github.com/10xHub            | [github.com/10xGraph](https://github.com/10xGraph) |

This release works with `10xscale-agentflow-cli` >= 0.6.0 and with `10xgraph-api`, which
still accepts the `agentflow-bearer` WebSocket subprotocol this client sends.

### Breaking: `client.setup()` is gone

The server removed `POST /v1/graph/setup` in `10xscale-agentflow-cli` 0.6.0, so a client
can no longer tell the model what a tool is. Tool schemas are declared on the server under
`remote_tools` in `agentflow.json`, and the client registers only the implementation:

```typescript
// before
client.registerTool({ node: 'assistant', name: 'get_weather', parameters, handler });
await client.setup();

// after: the schema lives in agentflow.json
client.registerToolHandler('get_weather', handler);
```

`registerTool()` still works, and `node` is now optional, but its `description` and
`parameters` are no longer sent anywhere.

### Smaller changes

- `RealtimeInit.model` is optional. The server uses it only when it is listed in
  `websocket.realtime_models`.
- `MultimodalConfigResponse` no longer declares `media_storage_path`, which the server does
  not return.
- The npm page now links to the client's own repository and to
  [10xgraph.com](https://10xgraph.com).

---

## 0.3.0

A production-readiness pass that fixes packaging, security, and tooling defects which made
the previous release unsafe to publish or depend on, plus two new read-only endpoints.

### Two new endpoints

`client.graphTools()` returns the tools your graph's tool nodes expose, grouped by node and
tagged with their source (`local`, `mcp`, or `remote`) - useful for showing users what an
agent can actually do without inspecting the server config.

`client.observability(threadId, runId?)` returns the reconstructed trace for a run: spans,
events, and cost. It defaults to the thread's latest run; pass `runId` for a specific one.

Both are additive. Their request and response types are exported from the package root.

### `npm publish` would have failed outright

`@10xscale/agentflow-client` is a scoped package, and npm defaults scoped packages to
`restricted` access. Without `publishConfig.access: "public"` in `package.json`, the
publish is rejected by the registry. That field was missing, so the package could not have
been published to the public registry at all. Added, together with `provenance: true`.

### The build did not work on Windows

`npm run build` ended with:

```
tsc && vite build && cp -r dist-types/* dist/
```

`cp` is not a Windows command, so any contributor on Windows could not build the package.
The build now emits declarations straight into `dist/` through a dedicated
`tsconfig.build.json`, and the copy step is gone entirely. There is also a subtle hazard
this removes: `vite build` empties its `outDir` by default, so with the steps in the other
order it would have deleted the declarations `tsc` had just written.

### Shipped sourcemaps pointed at nothing

The published tarball contained 41 `.map` files but no sources, so every sourcemap
referenced files the consumer never received. Debugging into the library gave you nothing
useful. `src/` is now included in the package, so the maps resolve.

### The types forced `@types/node` on browser consumers

`forgetMemories` annotated its timeout handle as `NodeJS.Timeout`. That namespace comes
from `@types/node`, so consumers building for the browser had to install Node typings to
compile against this package. Changed to `ReturnType<typeof setTimeout>`, which is
portable. `Error.captureStackTrace` is now accessed structurally for the same reason.

**Upgrade note:** if you added `@types/node` solely to satisfy this package, you can
probably drop it.

### 11 vulnerabilities cleared

vitest 1.x and vite 5.x carried 11 advisories between them, 3 critical and 5 high.
Upgraded to vitest 3 and vite 7. `npm audit` now reports zero vulnerabilities.

### Dead code removed

Three unexported, unreferenced things were being bundled into every published build:
`makeSingleStreamCall` in `endpoints/stream.ts`, and `isRemoteToolCallChunk` plus
`REMOTE_TOOL_CALL_REASON` in `endpoints/wsStream.ts`. Also removed `check.ts` (a scratch
script importing from a path that does not exist) and `.npmignore` (dead configuration -
`files` in `package.json` takes precedence, so it had no effect).

None of these were exported, so nothing in your code can break.

### Tests are now type-checked

`tsconfig.json` covered only `src/`, so the test suite was never type-checked. Turning it
on surfaced six genuine type errors, all fixed. Separately, converting the codebase's
twelve `@ts-ignore` comments to `@ts-expect-error` proved that every one of them was
suppressing nothing at all; all twelve are gone.

### Tooling added

- ESLint 9 and Prettier, with the 93 pre-existing errors fixed rather than suppressed.
- CI on Node 18, 20, and 22, which verifies every declared entry point exists in the real
  tarball and smoke-tests both the CJS and ESM entry points from a clean install.
- Release workflow gated on CI with a tag-vs-version check, CodeQL, and Dependabot.
- `CONTRIBUTING.md`, `SECURITY.md`, `CODE_OF_CONDUCT.md`, `CHANGELOG.md`, issue forms, and
  a pull request template.

### Coverage numbers moved

Thresholds are now 72% lines/statements, 82% branches, 76% functions, pinned just under
the measured values as a ratchet. These read lower than the previous config's 75/60/75/75
claim, but nothing about the tests changed - vitest 3 remaps v8 coverage more accurately
than vitest 1 did, so the older figure was simply optimistic.

### Upgrading

```bash
npm install @10xscale/agentflow-client@latest
```

No code changes required.
