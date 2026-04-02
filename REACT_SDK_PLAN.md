# AgentFlow SDK — Full-Stack Plan (v2)

> **Goal:** Two packages — `@10xscale/agentflow-client` (existing API client, untouched) and `@10xscale/agentflow-ui` (React provider + hooks + state + pre-built UI). The end-user experience: wrap with `<AgentFlow>`, drop a `<AgentFlowSidebar />`, add a trigger button — done. Zero API calls from the user. Everything works.

---

## 1. Current State — What We Have

| Layer | Status | Details |
|-------|--------|---------|
| **API Client** | ✅ Done | `AgentFlowClient` class — invoke, stream, threads, memory, tools, state schema, graph |
| **TypeScript Types** | ✅ Done | Full type definitions for all requests/responses |
| **Message Model** | ✅ Done | Rich `Message` class — text, image, audio, video, document, tool calls, reasoning blocks |
| **Tool Executor** | ✅ Done | Client-side tool registration + execution loop |
| **Streaming** | ✅ Done | `stream()` async generator for SSE-based streaming |
| **Tests** | ✅ Done | Comprehensive test suite for all endpoints |

### What's Missing

| Layer | What Users Must Build Themselves Today |
|-------|---------------------------------------|
| **React Provider** | No `<AgentFlow>` — users manually instantiate and pass client around |
| **React Hooks** | No `useChat`, `useThreads`, `useMemory` — users manually call APIs |
| **State Management** | No built-in store — users must wire up Redux/Zustand themselves |
| **UI Components** | No sidebar, no chat, no thread list — build from scratch |
| **Streaming State** | No reactive streaming state (loading, partial message) — manual async iterator tracking |
| **Sidebar** | No collapsible sidebar — users build from scratch |
| **Fullscreen Chat** | No Claude-like details page — users build from scratch |

> **Today:** The playground had to build a 502-line Redux chat slice + custom hooks + all UI components just to make the client work. That's what every new user would also have to do.

---

## 2. Competitive Landscape

### CopilotKit

| What They Do | How |
|---|---|
| Provider wraps app | `<CopilotKit runtimeUrl="...">` |
| Chat hooks | `useCopilotChat()` — messages, send, loading, stop |
| Frontend tools | `useCopilotAction()` — declarative registration |
| Shared state | `useCoAgent()` — bidirectional app↔agent state |
| Pre-built UI | `<CopilotSidebar>`, `<CopilotChat>`, `<CopilotPopup>` |
| Headless | `useCopilotChatHeadless()` — no UI, full control |
| Generative UI | `useCoAgentStateRender()` — custom components in chat |

### Vercel AI SDK

| What They Do | How |
|---|---|
| One hook does everything | `useChat()` — messages, input, loading, streaming, error |
| Streaming built-in | SSE parsing, data stream protocol |
| Framework agnostic | React, Vue, Svelte, Angular, Solid |
| No UI components | Hooks only — bring your own UI |
| Tool rendering | `addToolResult()` — client-side tool results |

### assistant-ui

| What They Do | How |
|---|---|
| Runtime layer | `useLocalRuntime()` or `useExternalStoreRuntime()` |
| shadcn components | `<Thread>`, `<AssistantSidebar>`, `<ThreadList>` |
| State internal | Runtime manages all state, efficient subscriptions |
| Thread management | Built-in multi-thread + cloud persistence |
| Generative UI | `makeAssistantToolUI()` — custom tool rendering |
| Full features | Edit, branch, regenerate, copy, attachments |

---

## 3. Package Strategy

```
@10xscale/agentflow-client    ← EXISTING (API client, types, Message, ToolExecutor — no React dep)
@10xscale/agentflow-ui        ← NEW (everything React: Provider, hooks, Zustand store, UI components)
```

**Why one UI package (not two)?**
- Simpler for users — one `npm install`, one import path
- Tree-shaking handles unused code — users who only want hooks don't pay for UI
- No cross-package versioning headaches
- Follows Vercel AI SDK pattern (`@ai-sdk/react` is one package with hooks + UI utilities)

**Framework compatibility:**
- Built on React but works with any React-based framework
- Next.js (App Router + Pages Router), Remix, Vite, Gatsby, Expo (web)
- No Next.js-specific APIs — pure React; `"use client"` directives where needed
- Could be wrapped for Vue/Svelte later via thin adapters

---

## 4. Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                           User's App                                │
│                                                                     │
│  ┌──────────┐    ┌────────────────┐    ┌───────────────────────┐   │
│  │ <AgentFlow│    │<AgentFlowSidebar│    │<AgentFlowTrigger />  │   │
│  │  config={}│    │  position="right"│    │  (button to open)    │   │
│  │  children │    │  />              │    │                      │   │
│  │ />        │    │                  │    │                      │   │
│  └──────────┘    └────────────────┘    └───────────────────────┘   │
├─────────────────────────────────────────────────────────────────────┤
│  @10xscale/agentflow-ui                                             │
│                                                                     │
│  PREBUILT LAYER (zero config)                                       │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ <AgentFlow />           ← Provider (wraps app)               │   │
│  │ <AgentFlowSidebar />    ← Complete sidebar w/ chat           │   │
│  │ <AgentFlowTrigger />    ← Button to open/close sidebar       │   │
│  │ <AgentFlowFullscreen /> ← Claude-like full-page chat         │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  HOOKS LAYER (headless, full control)                               │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ useChat()      useThreads()     useMemory()    useAgent()    │   │
│  │ useStream()    useTools()       useAgentFlow()               │   │
│  │ useSidebar()   useConnection()                               │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  STATE LAYER (Zustand)                                              │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ chatStore │ threadStore │ sidebarStore │ connectionStore      │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  COMPONENT LAYER (composable building blocks)                       │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ <Thread /> <ChatBubble /> <ChatInput /> <StreamingText />    │   │
│  │ <ToolCallCard /> <ReasoningBlock /> <MarkdownRenderer />     │   │
│  │ <MessageActions /> <Suggestions /> <ConnectionStatus />      │   │
│  └──────────────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────────┤
│  @10xscale/agentflow-client  (existing — untouched)                 │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ AgentFlowClient • Message • ToolExecutor • All Endpoints     │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 5. The "Prebuilt" Experience — Zero Config

This is the #1 priority. A user should be able to add a fully working AI chat sidebar to their app in under 2 minutes with zero knowledge of the AgentFlow API.

### What the User Writes

```tsx
// app.tsx (or layout.tsx, _app.tsx — whatever their framework uses)
import { AgentFlow, AgentFlowSidebar, AgentFlowTrigger } from '@10xscale/agentflow-ui';

function App() {
  return (
    <AgentFlow
      config={{
        baseUrl: 'http://localhost:8000',
        authToken: 'optional',  // optional
      }}
    >
      {/* Their existing app — completely untouched */}
      <Navbar />
      <main>
        <Dashboard />
      </main>

      {/* Drop sidebar wherever — it renders as a fixed/absolute panel */}
      <AgentFlowSidebar position="right" />

      {/* One button to open/close. Put it anywhere — navbar, FAB, wherever */}
      <AgentFlowTrigger />
    </AgentFlow>
  );
}
```

**That's it.** No `useChat`, no `sendMessage`, no `client.stream()`, no state management. Everything works:
- Sidebar opens when user clicks the trigger
- New thread auto-created on first message
- Messages stream in real-time
- Thread history persisted in localStorage
- "New Thread" button at top of sidebar
- "Go Fullscreen" button at top of sidebar (navigates to details page)
- User can close sidebar via trigger or ESC key

### Disabling / Conditional Rendering

```tsx
// User can disable entirely with a boolean
<AgentFlow config={config} enabled={isPremiumUser}>
  ...
  <AgentFlowSidebar position="right" />
  <AgentFlowTrigger />
</AgentFlow>

// Or just don't render the sidebar/trigger
<AgentFlow config={config}>
  <main>
    <Dashboard />
  </main>
  {showChat && <AgentFlowSidebar />}
  {showChat && <AgentFlowTrigger />}
</AgentFlow>
```

### Fullscreen / Details Page (Claude-like)

When user clicks "Go Fullscreen" in the sidebar, or navigates directly:

```tsx
// pages/chat.tsx (or any route)
import { AgentFlowFullscreen } from '@10xscale/agentflow-ui';

function ChatPage() {
  return <AgentFlowFullscreen />;
}
```

This renders a **Claude-like** full-page chat experience:
- Thread list in a left panel (collapsible)
- Main chat area in the center (wide, clean)
- Message input at the bottom
- Same thread state shared with sidebar (via Zustand — same store)

---

## 6. State Management — Sidebar Open/Close via Dispatch

The sidebar open/close state is managed by Zustand and exposed via a hook. This means any component anywhere in the tree can open/close the sidebar — not just the trigger button.

### `useSidebar()` — Sidebar State Hook

```tsx
const {
  isOpen,        // boolean
  open,          // () => void
  close,         // () => void
  toggle,        // () => void
  position,      // 'left' | 'right'
  setPosition,   // (pos: 'left' | 'right') => void
  isEnabled,     // boolean — whether sidebar is active
} = useSidebar();
```

### Usage: Open from Anywhere

```tsx
// In your navbar component
import { useSidebar } from '@10xscale/agentflow-ui';

function Navbar() {
  const { toggle } = useSidebar();

  return (
    <nav>
      <Logo />
      <button onClick={toggle}>💬 Chat</button>
    </nav>
  );
}
```

```tsx
// In a dashboard widget
function QuickAction() {
  const { open } = useSidebar();

  return (
    <button onClick={open}>Ask AI about this data</button>
  );
}
```

```tsx
// Programmatic — after some action
function handleFormSubmit(data) {
  saveData(data);
  const { open } = useSidebar.getState(); // Zustand allows this outside React
  open();
}
```

### Sidebar Store Shape

```ts
interface SidebarStore {
  isOpen: boolean;
  position: 'left' | 'right';
  isEnabled: boolean;
  width: number; // px, default 420
  isFullscreen: boolean;

  // Actions
  open: () => void;
  close: () => void;
  toggle: () => void;
  setPosition: (position: 'left' | 'right') => void;
  setEnabled: (enabled: boolean) => void;
  setWidth: (width: number) => void;
  goFullscreen: () => void;
  exitFullscreen: () => void;
}
```

---

## 7. Zustand Store Design — Full Store

**Why Zustand (not Redux):**
- 1KB vs 7KB+ for Redux Toolkit
- Zero boilerplate — no action creators, no reducers, no dispatch wrapper
- `getState()` works outside React (e.g., in event handlers, callbacks)
- Built-in `persist`, `devtools`, `immer` middleware
- TypeScript-first
- CopilotKit and assistant-ui both use lightweight internal state

### Complete Store Structure

```ts
// The store is created once inside <AgentFlow /> provider and shared via React Context.

interface AgentFlowStore {
  // ─── Client ───
  client: AgentFlowClient | null;
  config: AgentFlowConfig;

  // ─── Connection ───
  connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'error';
  ping: () => Promise<boolean>;

  // ─── Sidebar ───
  sidebar: SidebarStore;

  // ─── Chat ───
  activeThreadId: string | null;
  threads: Record<string, ThreadState>;

  // ─── Agent ───
  agentGraph: GraphResponse | null;
  stateSchema: StateSchemaResponse | null;
}

interface ThreadState {
  id: string;
  title: string;
  messages: Message[];
  isLoading: boolean;
  isStreaming: boolean;
  streamingContent: string;       // Accumulated text during stream
  streamingMessage: Message | null; // Full partial message during stream
  error: AgentFlowError | null;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}
```

**Persistence:** Zustand `persist` middleware → `localStorage` by default. Thread messages, sidebar state, active thread — all survives page refresh. Configurable: `persist: false` or `persist: 'sessionStorage'`.

---

## 8. Hooks — Full API

All hooks read from the same Zustand store created by `<AgentFlow>`. No prop drilling.

### `useChat()` — The Primary Hook

```tsx
const {
  // Messages
  messages,              // Message[] — current thread messages
  setMessages,           // (msgs: Message[]) => void
  appendMessage,         // (msg: Message) => void

  // Sending
  sendMessage,           // (text: string, options?) => Promise<void>

  // Streaming State
  isLoading,             // boolean — waiting for first token
  isStreaming,           // boolean — actively receiving tokens
  streamingContent,      // string — accumulated text so far

  // Control
  stop,                  // () => void — abort streaming
  reload,                // () => void — regenerate last response
  error,                 // AgentFlowError | null

  // Input (controlled input helper)
  input,                 // string
  setInput,              // (text: string) => void
  handleSubmit,          // (e?: FormEvent) => void — submit input as message
} = useChat({
  threadId?: string,
  initialMessages?: Message[],
  onError?: (error: AgentFlowError) => void,
  onFinish?: (message: Message) => void,
  onStream?: (chunk: StreamChunk) => void,
  mode?: 'invoke' | 'stream', // default: 'stream'
});
```

### `useThreads()` — Thread Management

```tsx
const {
  threads,               // ThreadSummary[]
  activeThread,          // ThreadState | null
  activeThreadId,        // string | null

  createThread,          // (title?: string) => string (returns new ID)
  switchThread,          // (threadId: string) => void
  deleteThread,          // (threadId: string) => Promise<void>
  renameThread,          // (threadId: string, title: string) => void

  fetchThreads,          // () => Promise<void>
  fetchThreadMessages,   // (threadId: string) => Promise<void>

  isLoading,
  error,
} = useThreads();
```

### `useStream()` — Low-Level Streaming

```tsx
const {
  stream,                // (messages: Message[], options?) => void
  chunks,                // StreamChunk[]
  isStreaming,           // boolean
  stop,                  // () => void
  error,                 // AgentFlowError | null
} = useStream({
  onChunk?: (chunk: StreamChunk) => void,
  onToolCall?: (toolCall: ToolCallBlock) => void,
  onComplete?: (result: Message[]) => void,
});
```

### `useMemory()` — Memory CRUD

```tsx
const {
  memories,
  store,   search,   get,   update,   remove,   list,   forget,
  isLoading,  error,
} = useMemory();
```

### `useAgent()` — Agent State & Control

```tsx
const {
  graph,  stateSchema,  threadState,
  updateThreadState,  clearThreadState,
  isRunning,  stopExecution,  fixGraph,
  ping,  isConnected,
  fetchGraph,  fetchStateSchema,
} = useAgent({ threadId?: string });
```

### `useTools()` — Declarative Tool Registration

```tsx
useTools([
  {
    node: 'assistant',
    name: 'get_location',
    description: 'Get browser geolocation',
    parameters: { type: 'object', properties: { ... } },
    handler: async (args) => {
      const pos = await new Promise((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject)
      );
      return { lat: pos.coords.latitude, lng: pos.coords.longitude };
    }
  }
]);
// Auto-registers on mount, auto-cleans up on unmount
```

### `useSidebar()` — Sidebar Open/Close (described in §6)

### `useAgentFlow()` — Raw Access

```tsx
const { client, store } = useAgentFlow();
```

---

## 9. UI Components

### 9.1 Prebuilt Composites (what most users use)

| Component | What It Is |
|-----------|-----------|
| `<AgentFlow>` | Provider. Wraps app. Creates client + store. Pass `config`. |
| `<AgentFlowSidebar>` | Complete sidebar panel — chat messages, new thread button, fullscreen button. Fixed panel, slides in/out. |
| `<AgentFlowTrigger>` | Button that opens/closes sidebar. Drop anywhere. |
| `<AgentFlowFullscreen>` | Full-page Claude-like chat — thread list panel + main chat area. |

### 9.2 Sidebar Anatomy

```
┌─ AgentFlowSidebar ───────────────────────┐
│ ┌──────────────────────────────────────┐  │
│ │  [+ New Thread]         [⛶ Fullscreen] │ ← Header bar
│ │                          [✕ Close]    │  │
│ └──────────────────────────────────────┘  │
│                                           │
│  ┌────────────────────────────────────┐   │
│  │                                    │   │
│  │       Chat Messages                │   │
│  │       (scrollable)                 │   │
│  │                                    │   │
│  │  ┌──────────────────────────┐      │   │
│  │  │ User: How do I deploy?   │      │   │
│  │  └──────────────────────────┘      │   │
│  │                                    │   │
│  │  ┌──────────────────────────┐      │   │
│  │  │ Assistant: Here's how... │      │   │
│  │  │ (streaming text...)      │      │   │
│  │  └──────────────────────────┘      │   │
│  │                                    │   │
│  └────────────────────────────────────┘   │
│                                           │
│  ┌────────────────────────────────────┐   │
│  │ [Type your message...]     [Send]  │   │ ← Input bar
│  └────────────────────────────────────┘   │
└───────────────────────────────────────────┘
```

**Key behaviors:**
- Slides from `right` or `left` (configurable via `position` prop)
- Controlled by `useSidebar()` state — open/close from anywhere via hook
- Only chat messages in the panel — no thread list (thread list lives in fullscreen)
- "New Thread" at the top starts a fresh conversation
- "Fullscreen" at the top navigates to/opens the Claude-like details view
- Close via ✕ button, ESC key, or clicking outside (configurable)
- Keyboard shortcut: `Ctrl+Shift+L` toggles (configurable)
- Responsive: on mobile, sidebar goes full-width as a sheet

### 9.3 Fullscreen Details Page (Claude-like)

```
┌─ AgentFlowFullscreen ─────────────────────────────────────────────────┐
│                                                                        │
│  ┌── Thread List Panel ──┐  ┌── Main Chat Area ────────────────────┐  │
│  │                        │  │                                      │  │
│  │  [+ New Thread]        │  │  Thread Title: "Deploy question"     │  │
│  │  [🔍 Search...]       │  │  ────────────────────────────────     │  │
│  │                        │  │                                      │  │
│  │  ● Deploy question     │  │  User:                               │  │
│  │    2 min ago           │  │  How do I deploy to production?      │  │
│  │                        │  │                                      │  │
│  │  ○ API integration     │  │  Assistant:                          │  │
│  │    1 hour ago          │  │  Here's a step-by-step guide...      │  │
│  │                        │  │  ```bash                             │  │
│  │  ○ Bug fix help        │  │  npm run build                      │  │
│  │    Yesterday           │  │  ```                                 │  │
│  │                        │  │                                      │  │
│  │  ○ Feature planning    │  │  [Reasoning: I looked at the docs]   │  │
│  │    2 days ago          │  │                                      │  │
│  │                        │  │  [Tool: deploy_check → ✓ passed]     │  │
│  │                        │  │                                      │  │
│  │                        │  │                                      │  │
│  │                        │  ├──────────────────────────────────────┤  │
│  │                        │  │ [Type your message...]        [Send] │  │
│  └────────────────────────┘  └──────────────────────────────────────┘  │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

**Key behaviors:**
- Left panel: thread list with search, create, delete, switch
- Right panel: full chat for the active thread — same messages, shared state with sidebar
- Claude-like clean aesthetic — wide messages, no bubbles, assistant-style layout
- Markdown rendering, code blocks with syntax highlighting, copy button
- Tool call cards, reasoning blocks, suggestions
- Message actions: copy, regenerate
- Thread list panel is collapsible (hamburger menu)
- Shares the same Zustand store → switching threads in fullscreen reflects in sidebar and vice versa

### 9.4 Building Block Components

These are the lower-level components used internally but also exported for users who want to compose their own layouts:

| Component | Description |
|-----------|-------------|
| `<Thread />` | Scrollable message list with auto-scroll + virtual scrolling |
| `<ChatBubble />` | Single message — handles user, assistant, tool roles. Markdown inside. |
| `<ChatInput />` | Text input + send button + keyboard shortcuts (Enter to send, Shift+Enter newline) |
| `<StreamingText />` | Text that renders character-by-character during streaming |
| `<MarkdownRenderer />` | Markdown → HTML with code blocks, syntax highlighting, LaTeX, GFM |
| `<ToolCallCard />` | Shows tool name, arguments, result/error |
| `<ReasoningBlock />` | Collapsible "thinking" section |
| `<MessageActions />` | Copy, regenerate buttons on hover |
| `<Suggestions />` | Clickable follow-up suggestion chips below last message |
| `<ConnectionStatus />` | Small badge showing connected/disconnected |
| `<ThreadList />` | List of threads with search, delete, switch |
| `<ThreadItem />` | Single thread row — title, timestamp, active indicator |
| `<ErrorDisplay />` | Error message with retry button |

---

## 10. Props API — Full Reference

### `<AgentFlow>`

```tsx
interface AgentFlowProps {
  config: {
    baseUrl: string;              // Required — API server URL
    authToken?: string;           // Optional — auth token
    timeout?: number;             // Optional — request timeout (default: 300000ms)
    debug?: boolean;              // Optional — console logging (default: false)
  };
  enabled?: boolean;              // Default: true. Set false to disable entirely.
  persist?: boolean | 'localStorage' | 'sessionStorage';  // Default: 'localStorage'
  children: React.ReactNode;
}
```

### `<AgentFlowSidebar>`

```tsx
interface AgentFlowSidebarProps {
  position?: 'left' | 'right';           // Default: 'right'
  width?: number | string;                // Default: 420 (px)
  defaultOpen?: boolean;                  // Default: false
  closeOnEsc?: boolean;                   // Default: true
  closeOnClickOutside?: boolean;          // Default: false
  showNewThreadButton?: boolean;          // Default: true
  showFullscreenButton?: boolean;         // Default: true
  showCloseButton?: boolean;              // Default: true
  placeholder?: string;                   // Input placeholder text
  title?: string;                         // Header title (optional)
  suggestions?: string[];                 // Initial suggestion chips
  className?: string;                     // Additional CSS classes
  style?: React.CSSProperties;           // Inline styles
  onOpen?: () => void;                    // Callback on open
  onClose?: () => void;                   // Callback on close
  onFullscreen?: () => void;              // Callback on "go fullscreen"

  // Customization — override any sub-component
  renderMessage?: (message: Message) => React.ReactNode;
  renderInput?: (props: ChatInputProps) => React.ReactNode;
  renderHeader?: (props: SidebarHeaderProps) => React.ReactNode;
  renderToolCall?: (toolCall: ToolCallBlock) => React.ReactNode;
  renderReasoning?: (reasoning: ReasoningBlock) => React.ReactNode;
}
```

### `<AgentFlowTrigger>`

```tsx
interface AgentFlowTriggerProps {
  children?: React.ReactNode;             // Custom trigger content
  className?: string;
  style?: React.CSSProperties;
  asChild?: boolean;                      // Merge props with child element (Radix pattern)
  showBadge?: boolean;                    // Show unread indicator (default: false)
}

// Default: renders a chat icon button
// With asChild: merges onClick into your element
<AgentFlowTrigger />
<AgentFlowTrigger asChild><button className="my-btn">Chat</button></AgentFlowTrigger>
```

### `<AgentFlowFullscreen>`

```tsx
interface AgentFlowFullscreenProps {
  showThreadPanel?: boolean;              // Default: true — left panel with thread list
  threadPanelWidth?: number | string;     // Default: 280 (px)
  threadPanelCollapsible?: boolean;       // Default: true
  className?: string;
  style?: React.CSSProperties;

  // Same customization as sidebar
  renderMessage?: (message: Message) => React.ReactNode;
  renderInput?: (props: ChatInputProps) => React.ReactNode;
  renderToolCall?: (toolCall: ToolCallBlock) => React.ReactNode;
  renderReasoning?: (reasoning: ReasoningBlock) => React.ReactNode;
}
```

---

## 11. How It Works Under the Hood

When the user writes this:

```tsx
<AgentFlow config={{ baseUrl: 'http://localhost:8000' }}>
  <App />
  <AgentFlowSidebar position="right" />
  <AgentFlowTrigger />
</AgentFlow>
```

Here's what happens:

### On Mount (`<AgentFlow>`)

1. Creates `AgentFlowClient` instance from `config`
2. Creates Zustand store with all slices (chat, thread, sidebar, connection)
3. Wraps children in `AgentFlowContext.Provider` (exposes store + client)
4. Starts background health check (`client.ping()`) → sets `connectionStatus`
5. Loads persisted state from `localStorage` (threads, messages, active thread, sidebar position)

### On Trigger Click (`<AgentFlowTrigger>`)

1. Calls `store.sidebar.toggle()`
2. Sidebar component reads `isOpen` from store → slides in/out via CSS transition

### On First Message (auto-thread creation)

1. User types + hits Enter in `<AgentFlowSidebar>`
2. `useChat().handleSubmit()` fires
3. If no `activeThreadId` → creates new thread (locally + calls `client.threads()` if server supports it)
4. Creates `Message.text_message(input, 'user')` → appends to store
5. Calls `client.stream([...messages])` with AbortController
6. Chunks arrive → accumulated into `streamingContent` → re-renders `<StreamingText>`
7. On complete → creates assistant `Message` from accumulated content
8. Thread title auto-set from first user message
9. Store persisted to localStorage

### On "New Thread" Click

1. Calls `useThreads().createThread()`
2. Creates new `ThreadState` in store
3. Sets `activeThreadId` to new thread
4. Chat clears — fresh conversation

### On "Go Fullscreen"

1. Two options (user configures):
   - **Route mode:** Navigates to `/chat` (or custom route). `<AgentFlowFullscreen>` reads same store.
   - **Inline mode:** Replaces sidebar with full-width panel (no navigation needed). Toggle via `sidebar.goFullscreen()`.
2. Same Zustand store → same thread, same messages, zero data loss.

### On Close / Unmount

1. Store persists to localStorage
2. AbortController fires → streaming stops cleanly
3. Next mount → state rehydrates → sidebar remembers position, threads are back

---

## 12. Tech Stack

| Choice | Why |
|--------|-----|
| **Zustand** | 1KB, zero boilerplate, `getState()` outside React, persist middleware, TypeScript-first |
| **shadcn/ui + Tailwind** | Same as playground, tree-shakeable, customizable via CSS variables |
| **Radix Primitives** | Accessible, unstyled: `@radix-ui/react-slot` for `asChild`, `@radix-ui/react-visually-hidden` |
| **react-markdown + rehype** | Markdown rendering, code syntax highlighting, GFM, LaTeX |
| **@tanstack/react-virtual** | Virtual scroll for long message lists |
| **lucide-react** | Icons — lightweight, consistent, already in playground |
| **Vite** | Existing bundler, ESM output, tree-shaking |
| **tailwindcss-animate** | CSS-only slide/fade animations for sidebar |
| **clsx + tailwind-merge** | Class name utilities for component composition |
| **class-variance-authority** | Variant-based component styling (shadcn pattern) |

### Dependency Graph

```
@10xscale/agentflow-ui
├── @10xscale/agentflow-client  (peer dependency)
├── zustand
├── react (peer)
├── react-dom (peer)
├── @radix-ui/react-slot
├── @tanstack/react-virtual
├── class-variance-authority
├── clsx
├── tailwind-merge
├── lucide-react
├── react-markdown
├── remark-gfm
├── remark-math
├── rehype-highlight
├── rehype-katex
└── tailwindcss-animate
    (tailwindcss is peer dep)
```

---

## 13. File Structure

```
agentflow-ui/                              ← NEW PACKAGE
├── package.json
├── tsconfig.json
├── vite.config.ts                         ← Builds ESM + CJS, tree-shakeable
├── tailwind.config.ts
├── postcss.config.js
│
├── src/
│   ├── index.ts                           ← Main entry — re-exports everything
│   │
│   ├── provider/
│   │   ├── AgentFlow.tsx                  ← <AgentFlow> provider component
│   │   ├── context.ts                     ← React context for store + client
│   │   └── types.ts                       ← AgentFlowConfig, etc.
│   │
│   ├── store/
│   │   ├── index.ts                       ← createAgentFlowStore() factory
│   │   ├── chat.store.ts                  ← Messages, streaming, send/stop
│   │   ├── thread.store.ts                ← Thread CRUD, active thread
│   │   ├── sidebar.store.ts               ← Open/close, position, width
│   │   ├── agent.store.ts                 ← Graph, schema, thread state
│   │   ├── memory.store.ts                ← Memory CRUD
│   │   └── connection.store.ts            ← Ping, health, status
│   │
│   ├── hooks/
│   │   ├── useChat.ts
│   │   ├── useStream.ts
│   │   ├── useThreads.ts
│   │   ├── useMemory.ts
│   │   ├── useAgent.ts
│   │   ├── useTools.ts
│   │   ├── useSidebar.ts
│   │   ├── useConnection.ts
│   │   └── useAgentFlow.ts                ← Raw client/store access
│   │
│   ├── utils/
│   │   ├── message-helpers.ts             ← Message parsing, text extraction
│   │   ├── stream-accumulator.ts          ← Stream chunks → Message
│   │   └── cn.ts                          ← clsx + tailwind-merge utility
│   │
│   ├── prebuilt/                          ← Zero-config composites
│   │   ├── AgentFlowSidebar.tsx           ← Complete sidebar
│   │   ├── AgentFlowTrigger.tsx           ← Open/close button
│   │   └── AgentFlowFullscreen.tsx        ← Claude-like full-page chat
│   │
│   ├── components/                        ← Building block components
│   │   ├── chat/
│   │   │   ├── Thread.tsx                 ← Scrollable message list
│   │   │   ├── ChatBubble.tsx             ← Single message
│   │   │   ├── ChatInput.tsx              ← Input + send
│   │   │   └── StreamingText.tsx          ← Streaming animation
│   │   ├── blocks/
│   │   │   ├── MarkdownRenderer.tsx       ← Rich markdown
│   │   │   ├── ToolCallCard.tsx           ← Tool call display
│   │   │   ├── ReasoningBlock.tsx         ← Thinking/CoT
│   │   │   ├── Suggestions.tsx            ← Follow-up chips
│   │   │   └── MessageActions.tsx         ← Copy, regenerate
│   │   ├── thread/
│   │   │   ├── ThreadList.tsx             ← Thread list (for fullscreen)
│   │   │   ├── ThreadItem.tsx             ← Single thread row
│   │   │   └── ThreadSearch.tsx           ← Thread search
│   │   └── shared/
│   │       ├── ConnectionStatus.tsx       ← Online/offline
│   │       └── ErrorDisplay.tsx           ← Error + retry
│   │
│   └── styles/
│       └── agentflow.css                  ← Default theme (Tailwind + CSS vars)
│
├── tests/
│   ├── store/
│   │   ├── chat.store.test.ts
│   │   ├── thread.store.test.ts
│   │   └── sidebar.store.test.ts
│   ├── hooks/
│   │   ├── useChat.test.tsx
│   │   ├── useThreads.test.tsx
│   │   └── useSidebar.test.tsx
│   └── components/
│       ├── AgentFlowSidebar.test.tsx
│       ├── AgentFlowTrigger.test.tsx
│       └── AgentFlowFullscreen.test.tsx
│
└── README.md
```

---

## 14. Implementation Roadmap

### Sprint 1 (Week 1-2): Core Store + Provider + useChat

```
- [ ] Initialize agentflow-ui package (package.json, tsconfig, vite.config)
- [ ] Set up Zustand store factory with chat, thread, sidebar, connection slices
- [ ] Build <AgentFlow> provider — creates client + store, wraps in context
- [ ] Implement useAgentFlow() hook — raw access
- [ ] Implement useChat() hook — send, stream, stop, reload, input management
- [ ] Implement useConnection() — ping, health check
- [ ] Build stream-accumulator utility (chunks → Message)
- [ ] Build message-helpers utility
- [ ] Unit tests for all store slices + hooks
```

**Milestone:** `useChat()` works — users can send/receive messages with 5 lines of code.

### Sprint 2 (Week 3-4): Threads + Memory + Sidebar State

```
- [ ] Implement useSidebar() hook — open, close, toggle, position
- [ ] Implement sidebar.store.ts — open/close state, position, width, fullscreen
- [ ] Implement useThreads() hook — create, switch, delete, rename, fetch
- [ ] Implement useMemory() hook — full CRUD
- [ ] Implement useAgent() hook — graph, schema, state, stop, fix
- [ ] Implement useTools() hook — declarative registration, cleanup on unmount
- [ ] Implement useStream() low-level hook
- [ ] Zustand persist middleware (localStorage, configurable)
- [ ] Unit tests for all new hooks
```

**Milestone:** Complete headless SDK — all hooks working, state persisted.

### Sprint 3 (Week 5-6): Sidebar UI + Building Blocks

```
- [ ] Set up Tailwind + shadcn primitives in package
- [ ] Build <ChatBubble /> — user/assistant/tool variants, markdown inside
- [ ] Build <ChatInput /> — Enter to send, Shift+Enter newline, disabled during stream
- [ ] Build <Thread /> — scrollable message list, auto-scroll, virtual scroll
- [ ] Build <StreamingText /> — character-by-character streaming animation
- [ ] Build <MarkdownRenderer /> — code blocks, syntax highlight, LaTeX, GFM
- [ ] Build <MessageActions /> — copy, regenerate on hover
- [ ] Build <AgentFlowSidebar /> prebuilt — header, messages, input, slide animation
- [ ] Build <AgentFlowTrigger /> — icon button, asChild support, badge
- [ ] Default theme CSS (agentflow.css)
- [ ] Unit + visual tests
```

**Milestone:** Drop-in sidebar works — `<AgentFlowSidebar />` + `<AgentFlowTrigger />` = complete chat.

### Sprint 4 (Week 7-8): Fullscreen + Thread List + Polish

```
- [ ] Build <ThreadList /> — list, search, active indicator
- [ ] Build <ThreadItem /> — title, timestamp, delete, switch
- [ ] Build <ThreadSearch /> — filter threads by title
- [ ] Build <AgentFlowFullscreen /> — thread panel + main chat (Claude-like)
- [ ] Build <ToolCallCard /> — tool name, args, result/error
- [ ] Build <ReasoningBlock /> — collapsible "thinking" section
- [ ] Build <Suggestions /> — follow-up chips
- [ ] Build <ConnectionStatus /> — badge
- [ ] Build <ErrorDisplay /> — error + retry
- [ ] Mobile responsive (sidebar as sheet on small screens)
- [ ] Keyboard shortcuts (Ctrl+Shift+L toggle, ESC close)
- [ ] Dark mode support (CSS variables)
```

**Milestone:** Full product — sidebar + fullscreen + all components working.

### Sprint 5 (Week 9-10): Advanced + Docs + Release

```
- [ ] Generative UI: useToolUI() — register custom React components for tool calls
- [ ] Human in the Loop: useInterrupt() — pause agent, show approval, resume
- [ ] Theming system (CSS variables, presets: default, minimal, dark)
- [ ] Storybook for all components
- [ ] Documentation (README, examples, API reference)
- [ ] Migration guide for playground
- [ ] NPM publish pipeline
- [ ] Example apps (Next.js, Vite, Remix)
```

**Milestone:** v1.0 release.

---

## 15. User Experience — Before & After

### Before (Raw Client, Today)

```tsx
// 😰 ~80+ lines: manual client, state, streaming, UI — for every app

import { useState, useRef } from 'react';
import { AgentFlowClient, Message } from '@10xscale/agentflow-client';

function Chat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const clientRef = useRef(new AgentFlowClient({ baseUrl: '...' }));
  // ... 60+ more lines of state management, streaming, error handling, JSX ...
}
```

### After — Prebuilt (Zero Config)

```tsx
// 😎 8 lines — complete chat sidebar with threading, streaming, persistence

import { AgentFlow, AgentFlowSidebar, AgentFlowTrigger } from '@10xscale/agentflow-ui';
import '@10xscale/agentflow-ui/styles.css';

function App() {
  return (
    <AgentFlow config={{ baseUrl: 'http://localhost:8000' }}>
      <MyApp />
      <AgentFlowSidebar position="right" />
      <AgentFlowTrigger />
    </AgentFlow>
  );
}
```

### After — Headless (Full Control)

```tsx
// 🛠️ ~25 lines — custom UI, but all state management handled for you

import { AgentFlow, useChat, useThreads, useSidebar } from '@10xscale/agentflow-ui';

function MyCustomChat() {
  const { messages, sendMessage, isStreaming, stop, streamingContent } = useChat();
  const { threads, createThread, switchThread } = useThreads();
  const { isOpen, toggle } = useSidebar();

  return (
    <div>
      <button onClick={toggle}>Chat</button>
      {isOpen && (
        <aside>
          {messages.map(m => <p key={m.id}>{m.textContent}</p>)}
          {isStreaming && <p>{streamingContent}</p>}
          <input onKeyDown={e => e.key === 'Enter' && sendMessage(e.target.value)} />
        </aside>
      )}
    </div>
  );
}
```

---

## 16. Key Design Principles

1. **Prebuilt First** — The default path is zero-config. Wrap, drop, done. Power users peel back layers.

2. **State-Driven Sidebar** — Sidebar open/close via Zustand dispatch. Any component can open it. Not just a button — programmatic control.

3. **Headless Under the Hood** — Every prebuilt component is built on exported hooks. Users can swap any piece.

4. **Disable-Friendly** — `<AgentFlow enabled={false}>` kills everything. Conditional `{show && <Sidebar/>}` also works. No zombie listeners.

5. **Shared State** — Sidebar and fullscreen page read the same Zustand store. Switch thread in one → reflected in the other instantly.

6. **No Modal** — Sidebar only. Clean, predictable. One surface for chat.

7. **Framework Portable** — Pure React. Works in Next.js, Remix, Vite, Gatsby. `"use client"` where needed. No server-only APIs.

8. **Persistence Out of the Box** — Threads, messages, sidebar position all persist to localStorage. Page refresh → everything comes back.

---

## 17. Advanced Features (Post-MVP)

| Feature | Description | Priority |
|---------|-------------|----------|
| **Generative UI** | `useToolUI(toolName, Component)` — render custom React components for tool calls | High |
| **Human in the Loop** | `useInterrupt()` — pause agent execution, show approval UI, resume | High |
| **Shared State** | `useSharedState(schema)` — sync app state ↔ agent state bidirectionally | Medium |
| **Optimistic Updates** | Immediate UI update + rollback on error | Medium |
| **Message Branching** | Edit a message and fork the conversation | Medium |
| **Copilot Suggestions** | Auto-generate contextual follow-up suggestions | Medium |
| **Persistence Options** | `usePersistence()` — save/restore threads to cloud instead of localStorage | Medium |
| **Voice Input** | `useDictation()` — speech-to-text for chat input | Low |
| **Text-to-Speech** | `useSpeech()` — read agent responses aloud | Low |
| **Multi-Agent** | `useMultiAgent()` — manage multiple agents in one UI | Low |

---

## 18. Migration Path for Playground

The `agentflow-playground` currently maintains:
- Redux store: `chat.slice.js` (502 lines), `threadSettings.slice.js`, `settings.slice.js`
- Custom hook: `useAgentCommunication.js`
- Full shadcn UI: sidebar, thread list, chat bubble, input — all custom

**After `@10xscale/agentflow-ui` ships:**

```diff
- // 502-line Redux chat slice
- // Custom communication hook
- // Manual shadcn sidebar + chat components
- // Thread management logic
- // Streaming accumulation logic

+ import { AgentFlow, AgentFlowSidebar, AgentFlowTrigger } from '@10xscale/agentflow-ui';
+ // Or use individual hooks for the playground's custom dashboard layout
```

The playground can either:
1. **Use prebuilt** — replace everything with `<AgentFlowSidebar />` (if layout allows)
2. **Use hooks** — keep custom layout but replace Redux with `useChat()` + `useThreads()` (drop ~500 lines)

---

## 19. Summary

| | What | Size Target |
|-|------|-------------|
| **Package 1** | `@10xscale/agentflow-client` — API client, types (existing, untouched) | ~15KB |
| **Package 2** | `@10xscale/agentflow-ui` — Provider + 9 hooks + Zustand store + sidebar + fullscreen + 13 components + theme | ~30KB |

**The user's minimum viable integration:**

```tsx
<AgentFlow config={{ baseUrl }}>
  <App />
  <AgentFlowSidebar />
  <AgentFlowTrigger />
</AgentFlow>
```

**4 lines for a complete AI chat experience** — streaming, threading, persistence, sidebar, fullscreen — all handled. User calls zero APIs.

---

*Last updated: Feb 27, 2026*
