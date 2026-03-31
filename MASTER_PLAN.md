# AgentFlow — Master Build Plan
> Combines `REACT_SDK_PLAN.md` + `A2UI_INTEGRATION_PLAN.md` into a single trackable checklist.
> Two deliverables: **`@10xscale/agentflow-ui`** (React SDK) + **A2UI integration** across client, CLI, and PyAgenity.
> Status: `[ ]` not started · `[~]` in progress · `[x]` done
> **Last updated:** Phase 0–4 complete (headless layer + utilities + tests + build)

---

## Package Overview

| Package | What | Repo |
|---------|------|------|
| `@10xscale/agentflow-client` | Existing API client — **untouched** | `agentflow-react/` |
| `@10xscale/agentflow-ui` | NEW — React provider, hooks, Zustand store, UI components | `agentflow-react/` (new pkg) |
| A2UI client layer | NEW — types, processor, surface manager, React renderer | `agentflow-react/src/a2ui/` |
| A2UI backend | NEW — Python helpers + new endpoints | `PyAgenity/` + `pyagenity-api/` |

---

## Phase 0 — Project Setup

- [x] 0.1 Initialize `agentflow-ui` package inside `agentflow-ui/` directory
  - `package.json` (`@10xscale/agentflow-ui`, peer deps: react, react-dom, agentflow-client)
  - `tsconfig.json` (ES2020, bundler resolution, react-jsx)
  - `vite.config.ts` — ESM + CJS dual output, tree-shakeable, dts generation
  - `vitest.config.ts` — jsdom, v8 coverage
- [x] 0.2 Add `agentflow-client` as peer dependency + dev dependency (file link)
- [x] 0.3 `npm install` — 314 packages, build verified
- [x] 0.4 Create root `src/index.ts` re-export barrel

---

## Phase 1 — Zustand Store Layer

### 1.1 Store Factory
- [x] Create `src/store/index.ts` — `createAgentFlowStore()` factory function
- [x] Define root `AgentFlowStore` interface (client, config, all slices)

### 1.2 Individual Store Slices
- [x] `src/store/connection.store.ts` — `connectionStatus`, `ping()`
- [x] `src/store/sidebar.store.ts` — `isOpen`, `open/close/toggle`, `position`, `width`, `goFullscreen()`
- [x] `src/store/chat.store.ts` — `messages`, `isLoading`, `isStreaming`, `streamingContent`, `streamingMessage`, `error`
- [x] `src/store/thread.store.ts` — `threads`, `activeThreadId`, CRUD actions
- [x] `src/store/agent.store.ts` — `agentGraph`, `stateSchema`, `threadState`, stop/fix
- [x] `src/store/memory.store.ts` — memory CRUD actions

### 1.3 Persistence
- [x] Wire Zustand `persist` middleware (localStorage by default, configurable)
- [x] Ensure threads, messages, sidebar state survive page refresh

### 1.4 Store Tests
- [x] `tests/store.test.ts` — 26 tests covering all 6 slices

---

## Phase 2 — Provider

- [x] `src/provider/types.ts` — `AgentFlowConfig`, `AgentFlowProviderProps`
- [x] `src/provider/context.ts` — React context (store + client)
- [x] `src/provider/AgentFlow.tsx` — `<AgentFlow>` provider component
  - Creates `AgentFlowClient` from `config`
  - Creates Zustand store
  - Wraps children in context
  - Starts background health check (`ping()`)
  - Rehydrates persisted state on mount
  - Supports `enabled` prop (kills everything when `false`)

---

## Phase 3 — Hooks (Headless Layer)

- [x] `src/hooks/useAgentFlow.ts` — raw `{ client, store }` access
- [x] `src/hooks/useConnection.ts` — `connectionStatus`, `ping`, `isConnected`
- [x] `src/hooks/useSidebar.ts` — open/close/toggle/position/width/fullscreen
- [x] `src/hooks/useChat.ts`
  - `messages`, `sendMessage`, `isLoading`, `isStreaming`, `streamingContent`
  - `stop`, `reload`, `error`
  - Controlled input: `input`, `setInput`, `handleSubmit`
  - Options: `threadId`, `initialMessages`, `onError`, `onFinish`, `onStream`, `mode`
- [x] `src/hooks/useStream.ts` — low-level streaming iterator wrapper
- [x] `src/hooks/useThreads.ts`
  - `threads`, `activeThread`, `activeThreadId`
  - `createThread`, `switchThread`, `deleteThread`, `renameThread`
  - `fetchThreads`, `fetchThreadMessages`
- [x] `src/hooks/useMemory.ts` — `store`, `search`, `get`, `update`, `remove`, `list`, `forget`
- [x] `src/hooks/useAgent.ts`
  - `graph`, `stateSchema`, `threadState`
  - `updateThreadState`, `clearThreadState`
  - `isRunning`, `stopExecution`, `fixGraph`, `ping`, `isConnected`
- [x] `src/hooks/useTools.ts` — declarative registration, auto-cleanup on unmount

### Hook Tests
- [x] `tests/hooks.test.tsx` — 17 tests covering all hooks
- [x] `tests/utils.test.ts` — 38 tests covering cn, message-helpers, stream-accumulator

> **Milestone A:** Headless SDK complete — all hooks work, state persists. ✅ DONE

---

## Phase 4 — Utilities

- [x] `src/utils/cn.ts` — `clsx` + `tailwind-merge` helper
- [x] `src/utils/message-helpers.ts` — `textContent()`, message parsing helpers
- [x] `src/utils/stream-accumulator.ts` — `StreamChunk[]` → accumulated `Message`

---

## Phase 5 — Building Block Components

### 5.1 Setup
- [ ] Install and configure Tailwind + shadcn primitives in package
- [ ] `src/styles/agentflow.css` — default theme (CSS vars: colors, radius, fonts)
- [ ] Dark mode support via `data-theme` / `class` attribute

### 5.2 Chat Components (`src/components/chat/`)
- [ ] `Thread.tsx` — scrollable message list, auto-scroll to bottom, virtual scroll for long lists
- [ ] `ChatBubble.tsx` — user / assistant / tool roles, markdown inside
- [ ] `ChatInput.tsx` — Enter to send, Shift+Enter newline, disabled during streaming
- [ ] `StreamingText.tsx` — character-by-character animation during streaming

### 5.3 Block Components (`src/components/blocks/`)
- [ ] `MarkdownRenderer.tsx` — code blocks, syntax highlighting, GFM, LaTeX, copy button
- [ ] `ToolCallCard.tsx` — tool name, arguments, result/error display
- [ ] `ReasoningBlock.tsx` — collapsible thinking/CoT section
- [ ] `Suggestions.tsx` — clickable follow-up suggestion chips
- [ ] `MessageActions.tsx` — copy, regenerate buttons on hover

### 5.4 Thread Components (`src/components/thread/`)
- [ ] `ThreadList.tsx` — list with search, delete, active indicator
- [ ] `ThreadItem.tsx` — title, timestamp, active state, delete action
- [ ] `ThreadSearch.tsx` — filter threads by title (debounced)

### 5.5 Shared Components (`src/components/shared/`)
- [ ] `ConnectionStatus.tsx` — connected / disconnected badge
- [ ] `ErrorDisplay.tsx` — error message + retry button

---

## Phase 6 — Prebuilt Composites (Zero-Config Layer)

### 6.1 `AgentFlowSidebar` (`src/prebuilt/AgentFlowSidebar.tsx`)
- [ ] Fixed panel that slides from right/left via CSS transition
- [ ] Header: New Thread + Fullscreen + Close buttons
- [ ] Messages area: `<Thread>` with auto-scroll
- [ ] Input bar: `<ChatInput>`
- [ ] Keyboard shortcuts: ESC to close, Ctrl+Shift+L toggle
- [ ] Mobile: full-width sheet on small screens
- [ ] Customization: `renderMessage`, `renderInput`, `renderHeader`, `renderToolCall`, `renderReasoning`
- [ ] Full props: `position`, `width`, `defaultOpen`, `closeOnEsc`, `closeOnClickOutside`, `showNewThreadButton`, `showFullscreenButton`, `suggestions`, `className`

### 6.2 `AgentFlowTrigger` (`src/prebuilt/AgentFlowTrigger.tsx`)
- [ ] Default: chat icon button
- [ ] `asChild` pattern (Radix slot) — merge props into user's element
- [ ] `showBadge` — unread indicator
- [ ] `className`, `style`, `children` props

### 6.3 `AgentFlowFullscreen` (`src/prebuilt/AgentFlowFullscreen.tsx`)
- [ ] Left panel: `<ThreadList>` with search + new thread
- [ ] Right panel: full chat for active thread
- [ ] Collapsible thread panel (hamburger)
- [ ] Shared same Zustand store as sidebar (zero data loss when switching)
- [ ] Same message customization props as sidebar
- [ ] Props: `showThreadPanel`, `threadPanelWidth`, `threadPanelCollapsible`

### Prebuilt Tests
- [ ] `tests/components/AgentFlowSidebar.test.tsx`
- [ ] `tests/components/AgentFlowTrigger.test.tsx`
- [ ] `tests/components/AgentFlowFullscreen.test.tsx`

> **Milestone B:** Drop-in UI complete — 4 lines for a full chat sidebar with streaming, threads, and persistence.

---

## Phase 7 — Advanced Features (Post-MVP)

- [ ] `useToolUI(toolName, Component)` — generative UI: custom React component for tool call results
- [ ] `useInterrupt()` — human-in-the-loop: pause agent, render approval dialog, resume
- [ ] `useSharedState(schema)` — bidirectional app ↔ agent state sync
- [ ] Message branching — edit a message and fork the conversation thread
- [ ] Optimistic updates — immediate UI + rollback on error
- [ ] Copilot-style suggestions — auto-generate contextual follow-ups from agent
- [ ] Storybook for all components

---

## Phase 8 — A2UI Types & Core (Client)

> A2UI = Google's Agent-to-User Interface protocol. Agents generate declarative JSONL describing UI; the client renders it natively.

### 8.1 Type Definitions (`src/a2ui/types.ts`)
- [ ] `A2UIMessage` interface (union: surfaceUpdate | dataModelUpdate | beginRendering | deleteSurface)
- [ ] `SurfaceUpdate`, `DataModelUpdate`, `BeginRendering`, `DeleteSurface` interfaces
- [ ] `Component` type (discriminated union for all catalog components)
- [ ] `BoundValue` type — `literalString`, `path` (JSON Pointer), shorthand init
- [ ] `DataEntry` type — key/value pairs for data model
- [ ] `UserAction` event type — client → server action payload

### 8.2 Standard Catalog Types (`src/a2ui/catalog.ts`)
- [ ] Layout: `Row`, `Column`, `List`
- [ ] Display: `Text` (with `usageHint`: h1/h2/body/caption), `Image`, `Icon`, `Divider`
- [ ] Interactive: `Button`, `TextField`, `Checkbox`, `DateTimeInput`, `Slider`
- [ ] Container: `Card`, `Tabs`, `Modal`

### 8.3 Custom Component Registry Interface (`src/a2ui/registry-interface.ts`)
- [ ] Define `ComponentRegistry` interface for registering custom component type → React component mappings
- [ ] Support inline catalog definitions (user-supplied catalog in addition to standard)

---

## Phase 9 — A2UI Message Processor (Client)

### 9.1 Message Processor (`src/a2ui/processor.ts`)
- [ ] Parse JSONL stream line by line
- [ ] Dispatch each message type to the appropriate handler
- [ ] Maintain component buffer `Map<string, Component>` per surface
- [ ] Maintain data model store `Map<string, DataEntry[]>` per surface
- [ ] Emit `beginRendering` event to trigger render flush

### 9.2 Surface Manager (`src/a2ui/surface.ts`)
- [ ] `SurfaceState` type — `{ id, components, dataModel, isReady, rootId }`
- [ ] `SurfaceManager` class — create, update, delete surfaces
- [ ] Handle surface lifecycle: create on first `surfaceUpdate`, delete on `deleteSurface`

### 9.3 Data Binding Resolver (`src/a2ui/binding.ts`)
- [ ] Resolve `BoundValue.literalString` → static string
- [ ] Resolve `BoundValue.path` → JSON Pointer lookup in data model
- [ ] Handle initialization shorthand (`path` + `literal` combined)
- [ ] Memoize resolved bindings to avoid redundant lookups

---

## Phase 10 — A2UI React Renderer

### 10.1 A2UI Context (`src/a2ui/react/context.tsx`)
- [ ] `A2UIProvider` component — wraps app with A2UI awareness
- [ ] `useSurface(surfaceId)` — get surface state
- [ ] `useA2UIMessage()` — subscribe to incoming A2UI messages
- [ ] `useDataModel(surfaceId)` — access data model for a surface

### 10.2 Surface Component (`src/a2ui/react/Surface.tsx`)
- [ ] `<Surface surfaceId="..." />` — renders a complete A2UI surface
- [ ] Progressive rendering — renders components as they arrive, not waiting for all
- [ ] Subscribes to `dataModelUpdate` for reactive re-renders
- [ ] Falls back to skeleton/placeholder while `isReady = false`

### 10.3 Standard Component Library (`src/a2ui/react/components/`)
#### Layout
- [ ] `layout/Column.tsx` — vertical flex
- [ ] `layout/Row.tsx` — horizontal flex
- [ ] `layout/List.tsx` — ordered/unordered list

#### Display
- [ ] `display/Text.tsx` — respects `usageHint` (h1–h4, body, caption, label)
- [ ] `display/Image.tsx` — `src`, `alt`, `fit` props
- [ ] `display/Icon.tsx` — maps icon name to lucide-react icons
- [ ] `display/Divider.tsx` — horizontal rule

#### Interactive
- [ ] `interactive/Button.tsx` — primary/secondary/text variants, fires `UserAction`
- [ ] `interactive/TextField.tsx` — controlled input, fires `UserAction` on change/blur
- [ ] `interactive/Checkbox.tsx` — controlled, fires `UserAction`
- [ ] `interactive/Slider.tsx` — range, fires `UserAction` on change
- [ ] `interactive/DateTimeInput.tsx` — date/time picker

#### Container
- [ ] `container/Card.tsx` — surface-styled container with optional title
- [ ] `container/Tabs.tsx` — tab list + panels
- [ ] `container/Modal.tsx` — accessible modal overlay

### 10.4 Widget Registry (`src/a2ui/react/registry.ts`)
- [ ] `createWidgetRegistry(customComponents?)` — factory
- [ ] Default map: all standard catalog component names → React components
- [ ] `register(typeName, Component)` — add custom component
- [ ] `resolve(typeName)` → React component (falls back to unknown-component warning)

### A2UI React Tests
- [ ] `tests/a2ui/processor.test.ts`
- [ ] `tests/a2ui/surface-manager.test.ts`
- [ ] `tests/a2ui/binding-resolver.test.ts`
- [ ] `tests/a2ui/react/Surface.test.tsx`
- [ ] `tests/a2ui/react/components/` — one test per component

> **Milestone C:** A2UI renderer works — agents can stream JSONL and the React client renders rich, interactive UI.

---

## Phase 11 — A2UI Event Handling & Client Integration

### 11.1 Action Handler (`src/a2ui/actions.ts`)
- [ ] `buildUserAction(actionId, context, dataBindings)` — constructs `UserAction` payload
- [ ] Resolve action context data bindings before sending
- [ ] Export `sendUserAction()` function that posts to the server

### 11.2 `AgentFlowClient` Extensions (`src/client.ts`)
- [ ] Add `a2uiStream(messages, options?)` — like `stream()` but parses A2UI JSONL
- [ ] Add `sendUserAction(threadId, action: UserAction)` — POST to `/v1/actions`
- [ ] Keep `stream()` untouched — full backward compatibility

### 11.3 `useA2UI` React Hook (`src/a2ui/react/useA2UI.ts`)
- [ ] `useA2UI(surfaceId)` — combines `useSurface` + action sender
  - Returns `{ surface, sendAction, isReady }`
- [ ] Auto-connects to `A2UIProvider` context

---

## Phase 12 — A2UI Backend Integration (PyAgenity)

### 12.1 A2UI Response Builder (`PyAgenity/agentflow/a2ui/builder.py`)
- [ ] `surface_update(surface_id, components)` → dict
- [ ] `data_model_update(surface_id, contents)` → dict
- [ ] `begin_rendering(surface_id, root_id, catalog_id?)` → dict
- [ ] `delete_surface(surface_id)` → dict
- [ ] Component factory functions: `text()`, `button()`, `card()`, `column()`, `row()`, `text_field()`, etc.
- [ ] Type stubs for all component parameter shapes

### 12.2 A2UI Streaming Support in PyAgenity
- [ ] Ensure agent graph can yield A2UI dict messages as stream events
- [ ] Update `StreamChunk` event types to include `a2ui` event type
- [ ] Document usage: how to return A2UI output from agent nodes

### 12.3 A2UI Tool Type (`PyAgenity/agentflow/a2ui/tools.py`)
- [ ] `A2UITool` base class — tools that return A2UI component definitions
- [ ] Auto-wrap tool output in proper `surfaceUpdate` message format
- [ ] Register `A2UITool` in the existing tool executor

---

## Phase 13 — A2UI Backend Integration (AgentFlow CLI)

### 13.1 New A2UI Streaming Endpoint (`pyagenity-api/`)
- [ ] `POST /v1/graph/a2ui/stream` — SSE endpoint returning A2UI JSONL
- [ ] Accept same request shape as `/v1/graph/stream`
- [ ] Pass-through to PyAgenity graph, collect A2UI output, stream as NDJSON
- [ ] CORS + auth identical to existing endpoints

### 13.2 User Action Endpoint
- [ ] `POST /v1/actions` — receives `UserAction` from client
- [ ] Routes action to correct thread/graph node
- [ ] Returns updated A2UI surface via SSE or JSON response

### 13.3 Backward Compatibility
- [ ] Existing `/v1/graph/stream` and `/v1/graph/invoke` — no changes
- [ ] New endpoints are additive — `a2ui` feature flag optional

---

## Phase 14 — CopilotKit-Inspired Advanced A2UI Features

- [ ] **Generative UI** — agent can dynamically push new A2UI surfaces mid-conversation
- [ ] **Human-in-the-Loop A2UI** — approval dialogs renders via `surfaceUpdate` (tied to `useInterrupt()` from Phase 7)
- [ ] **Two-way form binding** — `TextField` / `Checkbox` values sync back to agent state via `dataModelUpdate`
- [ ] **Frontend Actions** — `registerFrontendAction(name, handler)` — agents can invoke browser-side code (localStorage, geolocation, DOM) safely
- [ ] **Real-time state visualization** — `useSharedState()` syncs agent internal state to A2UI `dataModelUpdate`

---

## Phase 15 — Documentation & Release

### 15.1 Docs for `@10xscale/agentflow-ui`
- [ ] `README.md` — quickstart (4-line example), hooks reference, component props
- [ ] `docs/quick_start.md` — 2-minute integration guide
- [ ] `docs/hooks.md` — full hook API reference
- [ ] `docs/components.md` — component props API reference
- [ ] `docs/theming.md` — CSS variables, dark mode, custom themes
- [ ] `docs/a2ui.md` — A2UI integration guide
- [ ] Example apps: Next.js App Router, Vite, Remix

### 15.2 Docs for A2UI Backend (Python)
- [ ] `PyAgenity/docs/a2ui.md` — how to use `A2UIBuilder` from agent nodes
- [ ] Add A2UI examples to `PyAgenity/examples/`
- [ ] CLI endpoint docs in `pyagenity-api/docs/`

### 15.3 Release
- [ ] Version bump — `@10xscale/agentflow-ui` v1.0.0
- [ ] NPM publish pipeline (`npm publish --access public`)
- [ ] GitHub Release with changelog
- [ ] Migration guide: playground → agentflow-ui (replacing Redux slice + custom hooks)

---

## Phase 16 — Playground Migration (Optional)

> Replace the hand-rolled Redux store + custom components in `agentflow-playground/` with the new SDK.

- [ ] Replace `chat.slice.js` (502 lines) with `useChat()` + `useThreads()`
- [ ] Replace `useAgentCommunication.js` with `useChat()` + `useStream()`
- [ ] Replace custom sidebar/chat UI with `<AgentFlowSidebar>` or headless hooks
- [ ] Replace Redux `threadSettings.slice.js` with `useAgent()` + `useMemory()`
- [ ] Verify all playground features still work post-migration
- [ ] Remove Redux dependencies from playground `package.json`

---

## Sprint Schedule

| Sprint | Weeks | Phases | Milestone |
|--------|-------|--------|-----------|
| **Sprint 1** | 1–2 | 0, 1, 2, 3, 4 | Milestone A: Headless SDK — all hooks + store + persist |
| **Sprint 2** | 3–4 | 5 | Building block components complete |
| **Sprint 3** | 5–6 | 6 | Milestone B: Zero-config sidebar + trigger + fullscreen |
| **Sprint 4** | 7–8 | 7, 8, 9 | A2UI types + processor + surface manager |
| **Sprint 5** | 9–10 | 10, 11 | Milestone C: A2UI React renderer + client integration |
| **Sprint 6** | 11–12 | 12, 13 | A2UI backend (Python + CLI endpoints) |
| **Sprint 7** | 13–14 | 14, 15, 16 | Advanced features + docs + release + playground migration |

---

## Key Design Principles

1. **Prebuilt First** — default path is zero-config. 4 lines = complete chat. Power users peel back layers.
2. **Headless Under the Hood** — every prebuilt is built on exported hooks. Swap any piece.
3. **State-Driven** — sidebar open/close and all state via Zustand. Any component can dispatch.
4. **Shared Store** — sidebar and fullscreen read the same store. No data loss switching views.
5. **Persistence** — localStorage by default. Page refresh = everything comes back.
6. **Disable-Friendly** — `enabled={false}` kills everything cleanly. No zombie listeners.
7. **A2UI as Extension** — A2UI is additive. Existing `stream()` and all endpoints unchanged.
8. **Security via Declaration** — A2UI surfaces are declarative data, not executable code.
9. **Framework Portable** — pure React, no Next.js-specific APIs, works in Vite/Remix/Gatsby.

---

## Current Status

| Phase | Status | Notes |
|-------|--------|-------|
| `@10xscale/agentflow-client` (existing) | ✅ Done | API client, types, Message, ToolExecutor, stream, tests |
| Phase 0 — Package setup | ⬜ Not started | |
| Phase 1 — Store | ⬜ Not started | |
| Phase 2 — Provider | ⬜ Not started | |
| Phase 3 — Hooks | ⬜ Not started | |
| Phase 4 — Utilities | ⬜ Not started | |
| Phase 5 — Building blocks | ⬜ Not started | |
| Phase 6 — Prebuilt composites | ⬜ Not started | |
| Phase 7 — Advanced features | ⬜ Not started | Post-MVP |
| Phase 8 — A2UI types | ⬜ Not started | |
| Phase 9 — A2UI processor | ⬜ Not started | |
| Phase 10 — A2UI renderer | ⬜ Not started | |
| Phase 11 — A2UI client integration | ⬜ Not started | |
| Phase 12 — A2UI PyAgenity backend | ⬜ Not started | |
| Phase 13 — A2UI CLI backend | ⬜ Not started | |
| Phase 14 — Advanced A2UI | ⬜ Not started | Post-MVP |
| Phase 15 — Docs & release | ⬜ Not started | |
| Phase 16 — Playground migration | ⬜ Not started | Optional |

---

*Last updated: Feb 28, 2026 — merged from REACT_SDK_PLAN.md + A2UI_INTEGRATION_PLAN.md*
