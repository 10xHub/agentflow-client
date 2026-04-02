# AgentFlow API Reference

Complete API reference for all endpoints in the @10xscale/agentflow-client library.

## Table of Contents

- [Client Configuration](#client-configuration)
- [Health & Metadata](#health--metadata)
  - [ping()](#ping)
  - [graph()](#graph)
  - [graphStateSchema()](#graphstateschema)
- [Thread Management](#thread-management)
  - [threads()](#threads)
  - [threadDetails()](#threaddetails)
  - [threadState()](#threadstate)
  - [updateThreadState()](#updatethreadstate)
  - [clearThreadState()](#clearthreadstate)
  - [deleteThread()](#deletethread)
- [Message Management](#message-management)
  - [threadMessages()](#threadmessages)
  - [threadMessage()](#threadmessage)
  - [addThreadMessages()](#addthreadmessages)
  - [deleteThreadMessage()](#deletethreadmessage)
- [Execution](#execution)
  - [invoke()](#invoke)
  - [stream()](#stream)
- [Files](#files)
  - [uploadFile()](#uploadfile)
  - [getFileInfo()](#getfileinfo)
  - [getFileAccessUrl()](#getfileaccessurl)
  - [getFile()](#getfile)
- [Memory Management](#memory-management)
  - [storeMemory()](#storememory)
  - [searchMemory()](#searchmemory)
  - [getMemory()](#getmemory)
  - [updateMemory()](#updatememory)
  - [deleteMemory()](#deletememory)
  - [listMemories()](#listmemories)
  - [forgetMemories()](#forgetmemories)

---

## Client Configuration

### AgentFlowClient

Initialize the AgentFlow client with configuration.

```typescript
import { AgentFlowClient } from '@10xscale/agentflow-client';

const client = new AgentFlowClient({
  baseUrl: string,      // Required: API base URL
  authToken?: string,   // Optional: Authentication token
  timeout?: number,     // Optional: Request timeout in ms (default: 300000 = 5min)
  debug?: boolean       // Optional: Enable debug logging (default: false)
});
```

**Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| baseUrl | string | Yes | - | Base URL of the AgentFlow API |
| authToken | string | No | null | Bearer token for authentication |
| timeout | number | No | 300000 | Request timeout in milliseconds |
| debug | boolean | No | false | Enable debug logging to console |

**Example:**

```typescript
const client = new AgentFlowClient({
  baseUrl: 'https://api.agentflow.example.com',
  authToken: 'your-secret-token',
  timeout: 60000,  // 1 minute
  debug: true
});
```

---

## Health & Metadata

### ping()

Health check endpoint to verify API connectivity.

**Endpoint:** `GET /v1/ping`

**Signature:**
```typescript
ping(): Promise<PingResponse>
```

**Returns:**
```typescript
interface PingResponse {
  data: string;  // "pong"
  metadata: ResponseMetadata;
}
```

**Example:**
```typescript
const response = await client.ping();
console.log(response.data);  // "pong"
console.log(response.metadata.request_id);
```

**Throws:**
- `AuthenticationError` (401) - Invalid or missing auth token
- `ServerError` (500+) - Server issues

---

### graph()

Get the graph structure and metadata for the agent workflow.

**Endpoint:** `GET /v1/graph`

**Signature:**
```typescript
graph(): Promise<GraphResponse>
```

**Returns:**
```typescript
interface GraphResponse {
  data: {
    graph: any;  // Graph structure definition
    [key: string]: any;
  };
  metadata: ResponseMetadata;
}
```

**Example:**
```typescript
const response = await client.graph();
console.log(response.data.graph);
```

**Throws:**
- `AuthenticationError` (401) - Invalid authentication
- `NotFoundError` (404) - Graph not found
- `ServerError` (500+) - Server issues

---

### graphStateSchema()

Retrieve the state schema definition with field types and descriptions.

**Endpoint:** `GET /v1/graph:StateSchema`

**Signature:**
```typescript
graphStateSchema(): Promise<StateSchemaResponse>
```

**Returns:**
```typescript
interface StateSchemaResponse {
  data: {
    fields: {
      [fieldName: string]: FieldSchema;
    };
  };
  metadata: ResponseMetadata;
}

interface FieldSchema {
  type: string;           // Field type: "string", "number", "boolean", etc.
  description?: string;   // Human-readable description
  default?: any;          // Default value
  required?: boolean;     // Whether field is required
}
```

**Example:**
```typescript
const response = await client.stateSchema();
const fields = response.data.fields;

// Display all fields
for (const [name, schema] of Object.entries(fields)) {
  console.log(`${name}: ${schema.type} - ${schema.description}`);
}
```

**Use Cases:**
- Build dynamic forms
- Validate state data
- Generate documentation
- Create TypeScript types

**See Also:**
- [State Schema Guide](./state-schema-guide.md)
- [State Schema Examples](../examples/state-schema-examples.ts)

**Throws:**
- `AuthenticationError` (401) - Invalid authentication
- `ServerError` (500+) - Server issues

---

## Thread Management

### threads()

List all threads with optional search and pagination.

**Endpoint:** `GET /v1/threads`

**Signature:**
```typescript
threads(
  search?: string,
  offset?: number,
  limit?: number
): Promise<ThreadsResponse>
```

**Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| search | string | No | undefined | Search query to filter threads |
| offset | number | No | 0 | Pagination offset |
| limit | number | No | undefined | Number of results to return |

**Returns:**
```typescript
interface ThreadsResponse {
  data: {
    threads: ThreadItem[];
  };
  metadata: ResponseMetadata;
}

interface ThreadItem {
  thread_id: string;
  thread_name: string | null;
  user_id: string | null;
  metadata: Record<string, any> | null;
  updated_at: string | null;
  run_id: string | null;
}
```

**Example:**
```typescript
// Get all threads
const response = await client.threads();

// Search and paginate
const filtered = await client.threads('customer support', 0, 10);

for (const thread of filtered.data.threads) {
  console.log(`${thread.thread_id}: ${thread.thread_name}`);
}
```

**Throws:**
- `AuthenticationError` (401) - Invalid authentication
- `ValidationError` (422) - Invalid pagination parameters
- `ServerError` (500+) - Server issues

---

### threadDetails()

Get detailed information about a specific thread.

**Endpoint:** `GET /v1/threads/{thread_id}`

**Signature:**
```typescript
threadDetails(threadId: string): Promise<ThreadDetailsResponse>
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| threadId | string | Yes | Unique thread identifier |

**Returns:**
```typescript
interface ThreadDetailsResponse {
  data: {
    thread_id: string;
    thread_name: string | null;
    user_id: string | null;
    metadata: Record<string, any> | null;
    created_at: string | null;
    updated_at: string | null;
    [key: string]: any;
  };
  metadata: ResponseMetadata;
}
```

**Example:**
```typescript
const details = await client.threadDetails('thread_123');
console.log(details.data.thread_name);
console.log(details.data.created_at);
```

**Throws:**
- `AuthenticationError` (401) - Invalid authentication
- `NotFoundError` (404) - Thread not found
- `ServerError` (500+) - Server issues

---

### threadState()

Get the current state of a thread.

**Endpoint:** `GET /v1/threads/{thread_id}/state`

**Signature:**
```typescript
threadState(threadId: number): Promise<ThreadStateResponse>
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| threadId | number | Yes | Unique thread identifier |

**Returns:**
```typescript
interface ThreadStateResponse {
  data: {
    state: Record<string, any>;
    [key: string]: any;
  };
  metadata: ResponseMetadata;
}
```

**Example:**
```typescript
const state = await client.threadState('thread_123');
console.log(state.data.state);

// Access specific state fields
const userPreferences = state.data.state.preferences;
```

**Throws:**
- `AuthenticationError` (401) - Invalid authentication
- `NotFoundError` (404) - Thread not found
- `ServerError` (500+) - Server issues

---

### updateThreadState()

Update the state of a thread.

**Endpoint:** `POST /v1/threads/{thread_id}/state`

**Signature:**
```typescript
updateThreadState(
  threadId: number,
  config: Record<string, any>,
  state: any
): Promise<UpdateThreadStateResponse>
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| threadId | number | Yes | Unique thread identifier |
| config | Record<string, any> | Yes | Configuration map for the thread |
| state | any | Yes | New AgentState for the thread |

**Returns:**
```typescript
interface UpdateThreadStateResponse {
  data: {
    state: Record<string, any>;
    [key: string]: any;
  };
  metadata: ResponseMetadata;
}
```

**Example:**
```typescript
const response = await client.updateThreadState(
  123,
  { validate: true },
  {
    step: 'completed',
    progress: 100,
    result: { success: true }
  }
);

console.log(response.data.state);
```

**Throws:**
- `BadRequestError` (400) - Invalid state data
- `AuthenticationError` (401) - Invalid authentication
- `NotFoundError` (404) - Thread not found
- `ValidationError` (422) - State validation failed
- `ServerError` (500+) - Server issues

---

### clearThreadState()

Clear all state data from a thread.

**Endpoint:** `DELETE /v1/threads/{thread_id}/state`

**Signature:**
```typescript
clearThreadState(threadId: number): Promise<ClearThreadStateResponse>
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| threadId | number | Yes | Unique thread identifier |

**Returns:**
```typescript
interface ClearThreadStateResponse {
  data: {
    success: boolean;
    [key: string]: any;
  };
  metadata: ResponseMetadata;
}
```

**Example:**
```typescript
const response = await client.clearThreadState('thread_123');
console.log(response.data.success);  // true
```

**Throws:**
- `AuthenticationError` (401) - Invalid authentication
- `NotFoundError` (404) - Thread not found
- `ServerError` (500+) - Server issues

---

### deleteThread()

Permanently delete a thread and all its associated data.

**Endpoint:** `DELETE /v1/threads/{thread_id}`

**Signature:**
```typescript
deleteThread(
  threadId: string | number,
  config?: Record<string, any>
): Promise<DeleteThreadResponse>
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| threadId | string \| number | Yes | Unique thread identifier |
| config | Record<string, any> | No | Optional configuration map |

**Returns:**
```typescript
interface DeleteThreadResponse {
  data: {
    success: boolean;
    [key: string]: any;
  };
  metadata: ResponseMetadata;
}
```

**Example:**
```typescript
const response = await client.deleteThread('thread_123');
console.log(response.data.success);  // true
```

**Warning:** This operation is permanent and cannot be undone.

**Throws:**
- `AuthenticationError` (401) - Invalid authentication
- `PermissionError` (403) - No permission to delete thread
- `NotFoundError` (404) - Thread not found
- `ServerError` (500+) - Server issues

---

## Message Management

### threadMessages()

Get all messages from a thread with pagination.

**Endpoint:** `GET /v1/threads/{thread_id}/messages`

**Signature:**
```typescript
threadMessages(
  threadId: string | number,
  search?: string,
  offset?: number,
  limit?: number
): Promise<ThreadMessagesResponse>
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| threadId | string \| number | Yes | Unique thread identifier |
| search | string | No | Optional search term to filter messages |
| offset | number | No | Pagination offset (default: 0) |
| limit | number | No | Number of results to return |

**Returns:**
```typescript
interface ThreadMessagesResponse {
  data: {
    messages: Message[];
    [key: string]: any;
  };
  metadata: ResponseMetadata;
}
```

**Example:**
```typescript
// Get all messages
const response = await client.threadMessages('thread_123');

// Paginate
const recent = await client.threadMessages('thread_123', undefined, 0, 10);

for (const message of recent.data.messages) {
  console.log(message.role, message.content);
}
```

**Throws:**
- `AuthenticationError` (401) - Invalid authentication
- `NotFoundError` (404) - Thread not found
- `ValidationError` (422) - Invalid pagination parameters
- `ServerError` (500+) - Server issues

---

### threadMessage()

Get a specific message from a thread by ID.

**Endpoint:** `GET /v1/threads/{thread_id}/messages/{message_id}`

**Signature:**
```typescript
singleMessage(
  threadId: string | number,
  messageId: string
): Promise<ThreadMessageResponse>
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| threadId | string | Yes | Unique thread identifier |
| messageId | string | Yes | Unique message identifier |

**Returns:**
```typescript
interface ThreadMessageResponse {
  data: {
    message: Message;
    [key: string]: any;
  };
  metadata: ResponseMetadata;
}
```

**Example:**
```typescript
const response = await client.singleMessage('thread_123', 'msg_456');
const message = response.data.message;
console.log(message.role, message.content);
```

**Throws:**
- `AuthenticationError` (401) - Invalid authentication
- `NotFoundError` (404) - Thread or message not found
- `ServerError` (500+) - Server issues

---

### addThreadMessages()

Add new messages to a thread.

**Endpoint:** `POST /v1/threads/{thread_id}/messages`

**Signature:**
```typescript
addThreadMessages(
  threadId: string | number,
  messages: Message[],
  config?: Record<string, any>,
  metadata?: Record<string, any>
): Promise<AddThreadMessagesResponse>
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| threadId | string \| number | Yes | Unique thread identifier |
| messages | Message[] | Yes | Array of messages to add |
| config | Record<string, any> | No | Configuration map (default: {}) |
| metadata | Record<string, any> | No | Optional metadata for the checkpoint |

**Returns:**
```typescript
interface AddThreadMessagesResponse {
  data: {
    messages: Message[];
    [key: string]: any;
  };
  metadata: ResponseMetadata;
}
```

**Example:**
```typescript
import { Message } from '@10xscale/agentflow-client';

const response = await client.addThreadMessages(
  'thread_123',
  [
    Message.text_message('Hello, I need help', 'user'),
    Message.text_message('How can I assist you today?', 'assistant')
  ],
  {}, // config
  { source: 'import' } // optional metadata
);

console.log(`Added ${response.data.messages.length} messages`);
```

**Throws:**
- `BadRequestError` (400) - Invalid message format
- `AuthenticationError` (401) - Invalid authentication
- `NotFoundError` (404) - Thread not found
- `ValidationError` (422) - Message validation failed
- `ServerError` (500+) - Server issues

---

### deleteThreadMessage()

Delete a specific message from a thread.

**Endpoint:** `DELETE /v1/threads/{thread_id}/messages/{message_id}`

**Signature:**
```typescript
deleteMessage(
  threadId: string | number,
  messageId: string,
  config?: Record<string, any>
): Promise<DeleteThreadMessageResponse>
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| threadId | string \| number | Yes | Unique thread identifier |
| messageId | string | Yes | Unique message identifier |
| config | Record<string, any> | No | Optional configuration map |

**Returns:**
```typescript
interface DeleteThreadMessageResponse {
  data: {
    success: boolean;
    [key: string]: any;
  };
  metadata: ResponseMetadata;
}
```

**Example:**
```typescript
const response = await client.deleteMessage('thread_123', 'msg_456');
console.log(response.data.success);  // true
```

**Throws:**
- `AuthenticationError` (401) - Invalid authentication
- `PermissionError` (403) - No permission to delete message
- `NotFoundError` (404) - Thread or message not found
- `ServerError` (500+) - Server issues

---

## Execution

### invoke()

Execute the agent workflow synchronously with automatic tool execution loop.

**Endpoint:** `POST /v1/graph/invoke`

**Signature:**
```typescript
invoke(
  messages: Message[],
  options?: {
    initial_state?: Record<string, any>;
    config?: Record<string, any>;
    recursion_limit?: number;
    response_granularity?: 'full' | 'partial' | 'low';
    onPartialResult?: InvokeCallback;
  }
): Promise<InvokeResult>
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| messages | Message[] | Yes | Array of input messages |
| options.initial_state | Record<string, any> | No | Initial state for the agent |
| options.config | Record<string, any> | No | Optional configuration |
| options.recursion_limit | number | No | Max tool execution iterations (default: 25) |
| options.response_granularity | string | No | Response detail level: 'low', 'partial', or 'full' |
| options.onPartialResult | InvokeCallback | No | Progress callback function |

```typescript
type InvokeCallback = (result: InvokePartialResult) => void;
```

**Returns:**
```typescript
interface InvokeResult {
  messages: Message[];              // Final response messages
  all_messages: Message[];          // All messages including tool calls
  state?: Record<string, any>;      // Final state (if granularity >= 'partial')
  context?: any;                    // Context data (if granularity >= 'partial')
  summary?: string;                 // Summary (if granularity == 'full')
  iterations: number;               // Number of iterations performed
  recursion_limit_reached: boolean; // Whether limit was hit
  metadata: ResponseMetadata;       // Response metadata
}
```

**Tool Execution Loop:**

The invoke endpoint automatically:
1. Sends messages to the API
2. Checks response for `remote_tool_call` blocks
3. Executes tools locally using registered handlers
4. Sends tool results back to API
5. Repeats until no more tool calls or recursion limit reached

**Example:**
```typescript
import { Message } from '@10xscale/agentflow-client';

// Register tools first
// ⚠️ IMPORTANT: Only use remote tools for browser-level APIs
// For most operations, define tools in your Python backend instead
// See: docs/tools-guide.md#remote-tools-vs-backend-tools
client.registerTool({
  node: 'weather_node',
  name: 'get_weather',
  description: 'Get weather for a location',
  parameters: {
    type: 'object',
    properties: {
      location: { type: 'string' }
    },
    required: ['location']
  },
  handler: async (args) => {
    return { temp: 72, condition: 'sunny' };
  }
});

// Invoke with automatic tool execution
const result = await client.invoke(
  [Message.text_message("What's the weather in San Francisco?", 'user')],
  {
    response_granularity: 'full',
    recursion_limit: 10,
    onPartialResult: (partial) => {
      console.log(`Iteration ${partial.iterations}`);
    }
  }
);

console.log(result.messages);        // Final response
console.log(result.all_messages);    // All messages including tool calls
console.log(result.iterations);      // Number of iterations
```

**Granularity Levels:**

| Level | Returns |
|-------|---------|
| `low` | messages, metadata only |
| `partial` | + state, context |
| `full` | + summary |

**See Also:**
- [Invoke Usage Guide](./invoke-usage.md)
- [Invoke Example](../examples/invoke-example.ts)

**Throws:**
- `BadRequestError` (400) - Invalid request data
- `AuthenticationError` (401) - Invalid authentication
- `NotFoundError` (404) - Graph not found
- `ValidationError` (422) - Message validation failed
- `ServerError` (500+) - Server issues

---

### stream()

Execute the agent workflow with streaming responses.

**Endpoint:** `POST /v1/graph/stream` (SSE)

**Signature:**
```typescript
stream(
  messages: Message[],
  options?: {
    initial_state?: Record<string, any>;
    config?: Record<string, any>;
    recursion_limit?: number;
    response_granularity?: 'full' | 'partial' | 'low';
  }
): AsyncGenerator<StreamChunk, void, unknown>
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| messages | Message[] | Yes | Array of input messages |
| options.initial_state | Record<string, any> | No | Initial state for the agent |
| options.config | Record<string, any> | No | Optional configuration |
| options.recursion_limit | number | No | Max iterations (default: 25) |
| options.response_granularity | string | No | Response detail level (default: 'low') |

**Returns:** AsyncIterableIterator yielding:
```typescript
interface StreamChunk {
  event: StreamEventType;
  data: any;
}

type StreamEventType = 
  | 'metadata'           // Response metadata
  | 'on_chain_start'     // Chain execution started
  | 'on_chain_stream'    // Chain streaming data
  | 'on_chain_end'       // Chain execution ended
  | 'messages_chunk'     // Message chunk received
  | 'state_chunk'        // State update chunk
  | 'context_chunk'      // Context update chunk
  | 'summary_chunk'      // Summary chunk (full granularity only)
  | 'error';             // Error occurred
```

**Example:**
```typescript
import { Message } from '@10xscale/agentflow-client';

try {
  const stream = client.stream(
    [Message.text_message("Tell me a story", 'user')],
    { response_granularity: 'full' }
  );
  
  for await (const chunk of stream) {
    switch (chunk.event) {
      case 'metadata':
        console.log('Request ID:', chunk.data.request_id);
        break;
      
      case 'on_chain_start':
        console.log('Chain started');
        break;
      
      case 'messages_chunk':
        // Incremental message content
        process.stdout.write(chunk.data);
        break;
      
      case 'state_chunk':
        // State updates
        console.log('State:', chunk.data);
        break;
      
      case 'on_chain_end':
        console.log('Chain completed');
        break;
      
      case 'error':
        console.error('Error:', chunk.data);
        break;
    }
  }
} catch (error) {
  console.error('Stream failed:', error);
}
```

**Progressive Content:**

Stream provides progressive updates as the agent processes:
- Real-time message generation
- State updates during execution
- Context changes
- Summary generation (full granularity)

**See Also:**
- [Stream Usage Guide](./stream-usage.md)
- [Stream Example](../examples/stream-example.ts)
- [Stream Quick Reference](./stream-quick-ref.md)

**Throws:**
- `BadRequestError` (400) - Invalid request data
- `AuthenticationError` (401) - Invalid authentication
- `NotFoundError` (404) - Graph not found
- `ValidationError` (422) - Message validation failed
- `ServerError` (500+) - Server issues

---

## Files

### uploadFile()

Upload a file for multimodal use.

**Endpoint:** `POST /v1/files/upload`

**Signature:**
```typescript
uploadFile(file: File | Blob | { data: Blob; filename: string }): Promise<FileUploadResponse>
```

**Returns:**
```typescript
interface FileUploadResponse {
  data: {
    file_id: string;
    mime_type: string;
    size_bytes: number;
    filename: string;
    extracted_text: string | null;
    url: string;
    direct_url?: string | null;
    direct_url_expires_at?: number | null;
  };
}
```

### getFileInfo()

Fetch file metadata without downloading the blob.

**Endpoint:** `GET /v1/files/{file_id}/info`

### getFileAccessUrl()

Fetch the best access URL for a file.

**Endpoint:** `GET /v1/files/{file_id}/url`

**Notes:**
- Cloud-backed media typically returns a signed URL.
- Local or memory-backed media may fall back to the API file route.

### getFile()

Download the raw file bytes as a `Blob`.

**Endpoint:** `GET /v1/files/{file_id}`

---

## Memory Management

### storeMemory()

Store a new memory in the agent's memory system.

**Endpoint:** `POST /v1/store/memories`

**Signature:**
```typescript
storeMemory(request: StoreMemoryRequest): Promise<StoreMemoryResponse>
```

**Parameters:**
```typescript
interface StoreMemoryRequest {
  config?: Record<string, any>;      // Optional configuration
  options?: Record<string, any>;     // Optional storage options
  content: string;                   // Memory content
  memory_type: MemoryType;           // Type of memory
  category: string;                  // Memory category
  metadata?: Record<string, any>;    // Additional metadata
}

enum MemoryType {
  EPISODIC = "episodic",          // Conversation memories
  SEMANTIC = "semantic",           // Facts and knowledge
  PROCEDURAL = "procedural",       // How-to knowledge
  ENTITY = "entity",               // Entity-based memories
  RELATIONSHIP = "relationship",   // Entity relationships
  CUSTOM = "custom",               // Custom memory types
  DECLARATIVE = "declarative"      // Explicit facts and events
}
```

**Returns:**
```typescript
interface StoreMemoryResponse {
  data: {
    memory_id: string;  // Unique ID of stored memory
  };
  metadata: ResponseMetadata;
}
```

**Example:**
```typescript
import { MemoryType } from '@10xscale/agentflow-client';

const response = await client.storeMemory({
  content: 'User prefers dark mode',
  memory_type: MemoryType.SEMANTIC,
  category: 'user_preferences',
  metadata: {
    user_id: 'user_123',
    timestamp: new Date().toISOString()
  }
});

console.log('Stored memory:', response.data.memory_id);
```

**Memory Types:**

| Type | Use Case |
|------|----------|
| `EPISODIC` | Conversation history, events |
| `SEMANTIC` | Facts, knowledge, preferences |
| `PROCEDURAL` | How-to information, procedures |
| `ENTITY` | Information about entities |
| `RELATIONSHIP` | Relationships between entities |
| `DECLARATIVE` | Explicit facts and events |
| `CUSTOM` | Custom memory types |

**Throws:**
- `BadRequestError` (400) - Invalid memory data
- `AuthenticationError` (401) - Invalid authentication
- `ValidationError` (422) - Memory validation failed
- `ServerError` (500+) - Server issues

---

### searchMemory()

Search for memories using vector similarity or other retrieval strategies.

**Endpoint:** `POST /v1/store/search`

**Signature:**
```typescript
searchMemory(request: SearchMemoryRequest): Promise<SearchMemoryResponse>
```

**Parameters:**
```typescript
interface SearchMemoryRequest {
  config?: Record<string, any>;
  options?: Record<string, any>;
  query: string;                              // Search query
  memory_type?: MemoryType;                   // Filter by memory type
  category?: string;                          // Filter by category
  limit?: number;                             // Max results (default: 10)
  score_threshold?: number;                   // Min similarity score (default: 0)
  filters?: Record<string, any>;              // Additional filters
  retrieval_strategy?: RetrievalStrategy;     // Search strategy
  distance_metric?: DistanceMetric;           // Similarity metric
  max_tokens?: number;                        // Max tokens to return (default: 4000)
}

enum RetrievalStrategy {
  SIMILARITY = "similarity",           // Vector similarity search
  TEMPORAL = "temporal",               // Time-based retrieval
  RELEVANCE = "relevance",             // Relevance scoring
  HYBRID = "hybrid",                   // Combined approaches
  GRAPH_TRAVERSAL = "graph_traversal"  // Knowledge graph navigation
}

enum DistanceMetric {
  COSINE = "cosine",
  EUCLIDEAN = "euclidean",
  DOT_PRODUCT = "dot_product",
  MANHATTAN = "manhattan"
}
```

**Returns:**
```typescript
interface SearchMemoryResponse {
  data: {
    results: MemoryResult[];
  };
  metadata: ResponseMetadata;
}

interface MemoryResult {
  id: string;
  content: string;
  score: number;                      // Similarity score (0-1)
  memory_type: string;
  metadata: Record<string, any>;
  vector: number[];                   // Embedding vector
  user_id: string;
  thread_id: string;
  timestamp: string;
}
```

**Example:**
```typescript
import { MemoryType, RetrievalStrategy, DistanceMetric } from '@10xscale/agentflow-client';

const response = await client.searchMemory({
  query: 'user interface preferences',
  memory_type: MemoryType.SEMANTIC,
  category: 'user_preferences',
  limit: 5,
  score_threshold: 0.7,
  retrieval_strategy: RetrievalStrategy.SIMILARITY,
  distance_metric: DistanceMetric.COSINE
});

for (const result of response.data.results) {
  console.log(`[${result.score.toFixed(2)}] ${result.content}`);
}
```

**Retrieval Strategies:**

| Strategy | Description |
|----------|-------------|
| `SIMILARITY` | Vector similarity search (default) |
| `TEMPORAL` | Time-based retrieval (recent first) |
| `RELEVANCE` | Relevance scoring |
| `HYBRID` | Combines multiple approaches |
| `GRAPH_TRAVERSAL` | Navigate knowledge graph |

**Distance Metrics:**

| Metric | Description |
|--------|-------------|
| `COSINE` | Cosine similarity (default) |
| `EUCLIDEAN` | Euclidean distance |
| `DOT_PRODUCT` | Dot product |
| `MANHATTAN` | Manhattan distance |

**Throws:**
- `BadRequestError` (400) - Invalid search parameters
- `AuthenticationError` (401) - Invalid authentication
- `ValidationError` (422) - Validation failed
- `ServerError` (500+) - Server issues

---

### getMemory()

Retrieve a specific memory by ID.

**Endpoint:** `GET /v1/store/memories/{memory_id}`

**Signature:**
```typescript
getMemory(
  memoryId: string,
  options?: {
    config?: Record<string, any>;
    options?: Record<string, any>;
  }
): Promise<GetMemoryResponse>
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| memoryId | string | Yes | Unique memory identifier |
| options.config | Record<string, any> | No | Optional configuration |
| options.options | Record<string, any> | No | Optional retrieval options |

**Returns:**
```typescript
interface GetMemoryResponse {
  data: {
    memory: MemoryResult;
  };
  metadata: ResponseMetadata;
}
```

**Example:**
```typescript
const response = await client.getMemory('mem_123', {
  config: { include_vector: true }
});
const memory = response.data.memory;

console.log(memory.content);
console.log(memory.memory_type);
console.log(memory.metadata);
```

**Throws:**
- `AuthenticationError` (401) - Invalid authentication
- `NotFoundError` (404) - Memory not found
- `ServerError` (500+) - Server issues

---

### updateMemory()

Update an existing memory's content or metadata.

**Endpoint:** `PUT /v1/store/memories/{memory_id}`

**Signature:**
```typescript
updateMemory(
  memoryId: string,
  content: string,
  options?: {
    config?: Record<string, any>;
    options?: Record<string, any>;
    metadata?: Record<string, any>;
  }
): Promise<UpdateMemoryResponse>
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| memoryId | string | Yes | Unique memory identifier |
| content | string | Yes | Updated content for the memory |
| options.config | Record<string, any> | No | Optional configuration |
| options.options | Record<string, any> | No | Optional update options |
| options.metadata | Record<string, any> | No | Updated metadata |

**Returns:**
```typescript
interface UpdateMemoryResponse {
  data: {
    memory: MemoryResult;  // Updated memory
  };
  metadata: ResponseMetadata;
}
```

**Example:**
```typescript
const response = await client.updateMemory(
  'mem_123',
  'Updated user preference: prefers light mode',
  {
    metadata: {
      updated_at: new Date().toISOString(),
      confidence: 0.95
    }
  }
);

console.log('Update success:', response.data.success);
```

**Throws:**
- `BadRequestError` (400) - Invalid update data
- `AuthenticationError` (401) - Invalid authentication
- `NotFoundError` (404) - Memory not found
- `ValidationError` (422) - Validation failed
- `ServerError` (500+) - Server issues

---

### deleteMemory()

Delete a specific memory by ID.

**Endpoint:** `DELETE /v1/store/memories/{memory_id}`

**Signature:**
```typescript
deleteMemory(
  memoryId: string,
  options?: {
    config?: Record<string, any>;
    options?: Record<string, any>;
  }
): Promise<DeleteMemoryResponse>
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| memoryId | string | Yes | Unique memory identifier |
| options.config | Record<string, any> | No | Optional configuration |
| options.options | Record<string, any> | No | Optional delete options |

**Returns:**
```typescript
interface DeleteMemoryResponse {
  data: {
    success: boolean;
  };
  metadata: ResponseMetadata;
}
```

**Example:**
```typescript
const response = await client.deleteMemory('mem_123');
console.log(response.data.success);  // true
```

**Warning:** This operation is permanent and cannot be undone.

**Throws:**
- `AuthenticationError` (401) - Invalid authentication
- `PermissionError` (403) - No permission to delete
- `NotFoundError` (404) - Memory not found
- `ServerError` (500+) - Server issues

---

### listMemories()

List all memories with optional filtering and pagination.

**Endpoint:** `GET /v1/store/memories`

**Signature:**
```typescript
listMemories(
  options?: {
    config?: Record<string, any>;
    options?: Record<string, any>;
    limit?: number;
  }
): Promise<ListMemoriesResponse>
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| options.config | Record<string, any> | No | Optional configuration |
| options.options | Record<string, any> | No | Optional retrieval options |
| options.limit | number | No | Number of results to return |

**Returns:**
```typescript
interface ListMemoriesResponse {
  data: {
    memories: MemoryResult[];
    total?: number;  // Total count (if available)
  };
  metadata: ResponseMetadata;
}
```

**Example:**
```typescript
// List all memories with limit
const response = await client.listMemories({
  limit: 50,
  config: { include_vectors: false }
});

console.log(`Found ${response.data.memories.length} memories`);
for (const memory of response.data.memories) {
  console.log(`- ${memory.content}`);
}
```

**Throws:**
- `AuthenticationError` (401) - Invalid authentication
- `ValidationError` (422) - Invalid parameters
- `ServerError` (500+) - Server issues

---

### forgetMemories()

Delete multiple memories matching specified criteria.

**Endpoint:** `POST /v1/store/memories/forget`

**Signature:**
```typescript
forgetMemories(
  options?: {
    config?: Record<string, any>;
    options?: Record<string, any>;
    memory_type?: any;
    category?: string;
    filters?: Record<string, any>;
  }
): Promise<ForgetMemoriesResponse>
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| options.config | Record<string, any> | No | Optional configuration |
| options.options | Record<string, any> | No | Optional forget options |
| options.memory_type | any | No | Filter by memory type |
| options.category | string | No | Filter by category |
| options.filters | Record<string, any> | No | Additional filters |

**Returns:**
```typescript
interface ForgetMemoriesResponse {
  data: {
    deleted_count: number;  // Number of memories deleted
    memory_ids: string[];   // IDs of deleted memories
  };
  metadata: ResponseMetadata;
}
```

**Example:**
```typescript
import { MemoryType } from '@10xscale/agentflow-client';

// Forget memories by category and type
const response = await client.forgetMemories({
  memory_type: MemoryType.EPISODIC,
  category: 'temporary',
  filters: { tag: 'delete-me' }
});

console.log('Forget success:', response.data.success);
```

**Warning:** This operation is permanent and cannot be undone.

**Throws:**
- `BadRequestError` (400) - Invalid criteria
- `AuthenticationError` (401) - Invalid authentication
- `PermissionError` (403) - No permission to delete
- `ValidationError` (422) - Validation failed
- `ServerError` (500+) - Server issues

---

## Error Handling

All endpoints may throw the following errors. See [Error Handling Guide](./error-handling.md) for details.

| Error Class | Status Code | Description |
|-------------|-------------|-------------|
| `BadRequestError` | 400 | Invalid request data |
| `AuthenticationError` | 401 | Authentication failed |
| `PermissionError` | 403 | Permission denied |
| `NotFoundError` | 404 | Resource not found |
| `ValidationError` | 422 | Validation failed |
| `ServerError` | 500+ | Server-side errors |

**See Also:**
- [Error Handling Guide](./error-handling.md)
- [Examples Directory](../examples/)

---

## Response Metadata

All responses include metadata with request tracking information:

```typescript
interface ResponseMetadata {
  message: string;        // Status message
  request_id: string;     // Unique request identifier (for debugging)
  timestamp: string;      // ISO 8601 timestamp
}
```

**Using Request IDs:**

Request IDs are useful for:
- Debugging issues
- Support tickets
- Log correlation
- Performance tracking

```typescript
try {
  const response = await client.invoke(request);
  console.log('Success! Request ID:', response.metadata.request_id);
} catch (error) {
  if (error instanceof AgentFlowError) {
    console.error('Failed! Request ID:', error.requestId);
    // Include this ID in support tickets
  }
}
```
