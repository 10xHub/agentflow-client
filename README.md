# AgentFlow Client

[![npm version](https://img.shields.io/npm/v/@10xscale/agentflow-client.svg)](https://www.npmjs.com/package/@10xscale/agentflow-client)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A TypeScript client library for the **AgentFlow** multi-agent system API. Build conversational AI applications with streaming responses, realtime audio, tool execution, and dynamic state management.

## ✨ Features

- 🚀 **Simple API** - Clean, intuitive client for AgentFlow
- 💬 **Streaming Support** - Real-time streaming responses for chat UIs
- 🔧 **Tool Execution** - Automatic local tool execution with recursion handling
- 📊 **State Management** - Dynamic state schema with validation
- 🎙️ **Realtime Audio** - WebSocket audio-to-audio via `/v1/graph/live`
- 📘 **TypeScript First** - Full TypeScript support with comprehensive types
- 🎯 **Zero Config** - Works out of the box with sensible defaults

## 📦 Installation

```bash
npm install @10xscale/agentflow-client
# or
yarn add @10xscale/agentflow-client
# or
pnpm add @10xscale/agentflow-client
```

### Version compatibility

This package versions independently of the Python packages, so the numbers do not line up. Pick
versions by the table below rather than by matching version numbers:

| `@10xscale/agentflow-client` (npm) | `10xscale-agentflow-cli` (API server) | `10xscale-agentflow` (core) |
| ---------------------------------- | ------------------------------------- | --------------------------- |
| 0.4.x                              | >= 0.5.0                              | >= 0.9.0                    |
| 0.3.x                              | >= 0.5.0                              | >= 0.9.0                    |

The client version tracks the **API server** (`10xscale-agentflow-cli`), which is what it talks to;
the core version follows from whatever the server requires (the CLI pins
`10xscale-agentflow>=0.9.0`). Client 0.3.x and later need server >= 0.5.0 specifically for
`graphTools()` and `observability()`; the invoke, stream, thread, memory, and file endpoints work
against older servers too. Client releases before 0.3.0 are not supported - upgrade rather than
pinning them.

## 🚀 Quick Start

### Basic Usage

```typescript
import { AgentFlowClient, Message } from '@10xscale/agentflow-client';

// Initialize client
const client = new AgentFlowClient({
  baseUrl: 'http://localhost:8000',
  authToken: 'your-token', // optional legacy Bearer auth
  debug: true, // optional
});

// Send a message and get response
const result = await client.invoke([Message.text_message('Hello, how can you help me?', 'user')]);

console.log(result.messages); // Array of response messages
```

### Authentication Options

```typescript
import { AgentFlowClient, basicAuth, headerAuth } from '@10xscale/agentflow-client';

const bearerClient = new AgentFlowClient({
  baseUrl: 'https://api.example.com',
  authToken: process.env.AGENTFLOW_TOKEN,
});

const basicClient = new AgentFlowClient({
  baseUrl: 'https://api.example.com',
  auth: basicAuth('service-user', 'service-password'),
});

const apiKeyClient = new AgentFlowClient({
  baseUrl: 'https://api.example.com',
  auth: headerAuth('X-API-Key', process.env.AGENTFLOW_API_KEY!),
});

const sessionClient = new AgentFlowClient({
  baseUrl: 'https://api.example.com',
  credentials: 'include',
});
```

### Streaming Chat

```typescript
// Stream responses in real-time
const stream = client.stream([Message.text_message('Tell me a story', 'user')]);

for await (const chunk of stream) {
  if (chunk.event === 'message') {
    console.log(chunk.message?.content);
  }
}
```

## Realtime audio (`/v1/graph/live`)

Transport-only: you stream PCM16 in and get PCM16 out. Mic capture and playback are yours to wire.

```ts
import { AgentFlowClient } from '@10xscale/agentflow-client';

const client = new AgentFlowClient({ baseUrl: 'http://localhost:8000', authToken });

const session = client.realtime(
  { model: 'gemini-2.5-flash-live', modalities: 'AUDIO' },
  { reconnect: { maxAttempts: 5 } }
);

session.on('audio', (pcm16, sampleRate) => playback(pcm16, sampleRate)); // PCM16 @ 24 kHz
session.on('output_transcript', (e) => console.log(e.text));
session.on('tool_call', (e) => console.log('tool', e.name, e.args));
session.on('error', (e) => console.error(e.message));

await session.ready; // socket open + init sent
session.sendAudio(micChunk); // PCM16 @ 16 kHz (Uint8Array | ArrayBuffer)
// push-to-talk: session.activityStart() / session.activityEnd()
session.close(); // graceful end; disables reconnect
```

Auth uses the browser-safe `agentflow-bearer` subprotocol automatically. In Node < 21 (no global
`WebSocket`), pass an implementation:

```ts
import WebSocket from 'ws';
const client = new AgentFlowClient({ baseUrl, authToken, webSocketImpl: WebSocket });
```

### File Uploads And Access URLs

```typescript
const upload = await client.uploadFile(file);

// Best URL for rendering/downloading in the UI.
// Cloud-backed deployments typically return a signed URL here.
const accessUrl = upload.data.direct_url ?? upload.data.url;

const fileInfo = await client.getFileInfo(upload.data.file_id);
const fileUrl = await client.getFileAccessUrl(upload.data.file_id);

const msg = Message.withFile('Summarize this document', upload.data.file_id, upload.data.mime_type);
```

### Tool Registration

**⚠️ Important:** Remote tools (registered client-side) should **only** be used for browser-level APIs like `localStorage`, `navigator.geolocation`, etc. For most operations (database queries, external API calls, calculations), define your tools in the Python backend instead. See [How to register remote tools](https://agentflow.10xscale.ai/docs/how-to/client/register-remote-tools) for details.

```typescript
// Matching trusted schema must be declared in the server's agentflow.json.
client.registerToolHandler('get_weather', async ({ location }) => {
  return { temperature: 72, conditions: 'sunny' };
});

// Tools execute automatically during invoke
const result = await client.invoke([Message.text_message('What is the weather in NYC?', 'user')]);
```

Declare model-facing metadata on the server, never from an untrusted client:

```json
{
  "remote_tools": [{
    "node": "assistant",
    "name": "get_weather",
    "description": "Get current weather for a location",
    "parameters": {
      "type": "object",
      "properties": {"location": {"type": "string"}},
      "required": ["location"]
    }
  }]
}
```

No client setup call is required or available.

## 📚 Documentation

Full documentation lives at **[agentflow.10xscale.ai](https://agentflow.10xscale.ai/docs/get-started)**.

### Getting Started

- **[Connect a client](https://agentflow.10xscale.ai/docs/get-started/connect-client)** - Setup and first request
- **[`AgentFlowClient` reference](https://agentflow.10xscale.ai/docs/reference/client/agentflow-client)** - Constructor config and every method
- **[`Message` and content blocks](https://agentflow.10xscale.ai/docs/reference/client/message)** - The message and content-block types

### Core Concepts

- **[Invoke API](https://agentflow.10xscale.ai/docs/reference/client/invoke)** - Request/response pattern with tool execution
- **[Stream API](https://agentflow.10xscale.ai/docs/reference/client/stream)** - Real-time streaming responses
- **[Graph and state schema](https://agentflow.10xscale.ai/docs/reference/client/graph)** - `graphStateSchema()` and graph lifecycle
- **[Tools reference](https://agentflow.10xscale.ai/docs/reference/client/tools)** - Tool registration and execution ⚠️ **Important: Remote vs Backend tools**

### Reference

- **[Reference overview](https://agentflow.10xscale.ai/docs/reference)** - Python library, REST/WebSocket API, CLI, and TypeScript client
- **[Troubleshooting](https://agentflow.10xscale.ai/docs/troubleshooting/client)** - Common issues and solutions

## 🎯 Key APIs

### `invoke()` - Batch Processing

Execute agent with automatic tool execution loop:

```typescript
const result = await client.invoke(messages, {
  recursion_limit: 25,
  response_granularity: 'full',
});
```

### `stream()` - Real-time Streaming

Stream responses as they're generated:

```typescript
const stream = client.stream(messages);
for await (const chunk of stream) {
  // Process chunks in real-time
}
```

### `graphStateSchema()` - Dynamic Schema

Get agent state schema for form generation and validation:

```typescript
const schema = await client.graphStateSchema();
// Build forms, validate data, generate types
```

### `graphTools()` - Tool Inventory

List the tools the graph's tool nodes expose, grouped by node. Each tool is tagged with its
source (`local`, `mcp`, or `remote`):

```typescript
const { data } = await client.graphTools();
// data.nodes[].tools[] -> { name, description, source, parameters }
```

### `observability(threadId, runId?)` - Run Traces

Fetch the reconstructed trace for a run - spans, events, and cost. Defaults to the thread's
latest run:

```typescript
const trace = await client.observability(threadId);
const specific = await client.observability(threadId, runId);
```

### Tool Registration

Register local tools that agents can execute:

```typescript
client.registerToolHandler('tool_name', async (args) => {
  /* ... */
});
```

## 💡 Examples

Check out the [`examples/`](examples/) directory for complete working examples:

- **[invoke-example.ts](examples/invoke-example.ts)** - Basic invoke with tool execution
- **[stream-example.ts](examples/stream-example.ts)** - Streaming responses
- **[state-schema-examples.ts](examples/state-schema-examples.ts)** - Form generation and validation

## 🏗️ Architecture

```
┌─────────────────────┐
│   Your Application  │
└──────────┬──────────┘
           │
           │ AgentFlowClient
           ▼
┌─────────────────────┐
│  @10xscale/agentflow-client    │  ← This library
│  - Client           │
│  - Tools            │
│  - Messages         │
└──────────┬──────────┘
           │
           │ HTTP/HTTPS + WebSocket
           ▼
┌─────────────────────┐
│  AgentFlow Server   │  ← Your backend
│  (Multi-agent API)  │
└─────────────────────┘
```

## 🔧 Configuration

```typescript
const client = new AgentFlowClient({
  baseUrl: string,           // Required: API base URL
  authToken?: string,        // Optional: legacy Bearer token
  auth?: AgentFlowAuth,      // Optional: basic/custom header auth
  headers?: HeadersInit,     // Optional: extra headers for every request
  credentials?: RequestCredentials, // Optional: cookie/session auth
  timeout?: number,          // Optional: Request timeout (default: 5min)
  debug?: boolean,           // Optional: Enable debug logging
  webSocketImpl?: typeof WebSocket  // Node < 21 (pass the 'ws' package)
});
```

## Module formats

Ships dual ESM + CJS with types. `import` resolves `dist/index.js` (ESM); `require` resolves
`dist/index.cjs`. Tree-shakeable (`"sideEffects": false`).

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests once
npm run test:run

# Build the library
npm run build
```

## 📝 TypeScript Support

Full TypeScript support with comprehensive type definitions:

```typescript
import type {
  AgentFlowClient,
  Message,
  ToolRegistration,
  InvokeResult,
  StreamChunk,
  AgentState,
  AgentStateSchema,
} from '@10xscale/agentflow-client';
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

Agentflow is [MIT licensed](https://github.com/10xHub/agentflow-client/blob/master/LICENSE) and
made by [10xScale](https://10xscale.ai). Contributions are accepted under the same license.

## 🆘 Support

- 📚 [Documentation](https://agentflow.10xscale.ai/docs/get-started)
- 🐛 [Issue Tracker](https://github.com/10xHub/agentflow-client/issues)

## 🙏 Acknowledgments

Built for the **AgentFlow** multi-agent system framework.

---

**Made with ❤️ for the AgentFlow community**
