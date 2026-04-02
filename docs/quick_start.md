# Quick Start Guide

Get started with @10xscale/agentflow-client in minutes.

## Table of Contents

- [Installation](#installation)
- [Basic Setup](#basic-setup)
- [Common Use Cases](#common-use-cases)
  - [Health Check](#1-health-check)
  - [List Threads](#2-list-threads)
  - [Get Thread State](#3-get-thread-state)
  - [Update Thread State](#4-update-thread-state)
  - [Simple Invoke](#5-simple-invoke)
  - [Invoke with Tools](#6-invoke-with-tools)
  - [Streaming Invoke](#7-streaming-invoke)
  - [Memory Operations](#8-memory-operations)
- [Next Steps](#next-steps)

---

## Installation

```bash
npm install @10xscale/agentflow-client
```

Or with yarn:

```bash
yarn add @10xscale/agentflow-client
```

---

## Basic Setup

### 1. Initialize the Client

```typescript
import {
  AgentFlowClient,
  basicAuth,
  headerAuth,
} from '@10xscale/agentflow-client';

const client = new AgentFlowClient({
  baseUrl: 'https://your-api-url.com',   // Your AgentFlow API URL
  authToken: 'your-auth-token',          // Optional legacy Bearer auth
  timeout: 60000,                        // Optional: 60 second timeout
  debug: true                            // Optional: Enable debug logging
});

const basicClient = new AgentFlowClient({
  baseUrl: 'https://your-api-url.com',
  auth: basicAuth('service-user', 'service-password'),
});

const apiKeyClient = new AgentFlowClient({
  baseUrl: 'https://your-api-url.com',
  auth: headerAuth('X-API-Key', 'your-api-key'),
});

const sessionClient = new AgentFlowClient({
  baseUrl: 'https://your-api-url.com',
  credentials: 'include',
});
```

### 2. Test the Connection

```typescript
try {
  const response = await client.ping();
  console.log('Connected!', response.data);  // "pong"
} catch (error) {
  console.error('Connection failed:', error);
}
```

---

## Common Use Cases

### 1. Health Check

Check if the API is accessible.

```typescript
const response = await client.ping();
console.log(response.data);  // "pong"
```

---

### 2. List Threads

Get all conversation threads.

```typescript
// Get all threads
const threads = await client.threads();
console.log(threads.data.threads);

// Search and paginate
const filtered = await client.threads('customer', 0, 10);

for (const thread of filtered.data.threads) {
  console.log(`${thread.thread_id}: ${thread.thread_name}`);
}
```

---

### 3. Get Thread State

Retrieve the current state of a thread.

```typescript
const state = await client.threadState(123);
console.log('Current state:', state.data.state);

// Access specific state fields
const userPreferences = state.data.state.preferences;
const progress = state.data.state.progress;
```

---

### 4. Update Thread State

Modify the state of a thread.

```typescript
const response = await client.updateThreadState(
  123,
  {}, // config
  {   // state
    step: 'completed',
    progress: 100,
    result: { success: true }
  }
);

console.log('Updated state:', response.data.state);
```

---

### 5. Simple Invoke

Execute the agent workflow without tools.

```typescript
import { Message } from '@10xscale/agentflow-client';

const result = await client.invoke(
  [Message.text_message('What is the weather like today?', 'user')],
  { response_granularity: 'full' }
);

console.log('Response:', result.messages);
console.log('State:', result.state);
console.log('Iterations:', result.iterations);
```

---

### 6. Invoke with Tools

Execute the agent with automatic tool execution.

**⚠️ Important:** Remote tools (registered client-side) should **only** be used for browser-level APIs like `localStorage`, `navigator.geolocation`, etc. For most operations (database queries, external API calls, calculations), define your tools in the Python backend instead. See [Tools Guide - When to Use Remote Tools](./tools-guide.md#remote-tools-vs-backend-tools).

```typescript
import { Message } from '@10xscale/agentflow-client';

// Step 1: Register tools (ONLY for browser APIs)
client.registerTool({
  node: 'weather_node',
  name: 'get_weather',
  description: 'Get current weather for a location',
  parameters: {
    type: 'object',
    properties: {
      location: {
        type: 'string',
        description: 'City name or location'
      }
    },
    required: ['location']
  },
  handler: async (args) => {
    // Your tool implementation
    const weather = await fetchWeather(args.location);
    return {
      temperature: weather.temp,
      condition: weather.condition,
      humidity: weather.humidity
    };
  }
});

client.registerTool({
  node: 'calculator_node',
  name: 'calculate',
  description: 'Perform mathematical calculations',
  parameters: {
    type: 'object',
    properties: {
      expression: {
        type: 'string',
        description: 'Mathematical expression to evaluate'
      }
    },
    required: ['expression']
  },
  handler: async (args) => {
    // Your calculator implementation
    const result = eval(args.expression);  // Use a safe eval in production!
    return { result };
  }
});

// Step 2: Invoke with automatic tool execution
const result = await client.invoke(
  [Message.text_message("What's the weather in San Francisco and what's 25 + 17?", 'user')],
  {
    response_granularity: 'full',
    recursion_limit: 10,
    onPartialResult: (partial) => {
      console.log(`Progress: Iteration ${partial.iterations}`);
    }
  }
);

console.log('Final response:', result.messages);
console.log('All messages (including tool calls):', result.all_messages);
console.log('Total iterations:', result.iterations);
```

**How it Works:**

1. You register tools with handlers
2. Agent decides when to call tools
3. Library automatically executes local tool handlers
4. Results are sent back to the agent
5. Process repeats until complete

---

### 7. Streaming Invoke

Get real-time responses as the agent processes.

```typescript
import { Message } from '@10xscale/agentflow-client';

console.log('Streaming response:');

const stream = client.stream(
  [Message.text_message('Tell me a short story about a robot', 'user')],
  { response_granularity: 'full' }
);

for await (const chunk of stream) {
  switch (chunk.event) {
    case 'metadata':
      console.log('Request ID:', chunk.data.request_id);
      break;
    
    case 'on_chain_start':
      console.log('Started processing...');
      break;
    
    case 'messages_chunk':
      // Print message content as it arrives
      process.stdout.write(chunk.data);
      break;
    
    case 'state_chunk':
      console.log('\nState update:', chunk.data);
      break;
    
    case 'on_chain_end':
      console.log('\nCompleted!');
      break;
    
    case 'error':
      console.error('Error:', chunk.data);
      break;
  }
}
```

**Stream Events:**

- `metadata` - Request metadata
- `on_chain_start` - Processing started
- `messages_chunk` - Incremental message content
- `state_chunk` - State updates
- `context_chunk` - Context updates
- `summary_chunk` - Summary (full granularity only)
- `on_chain_end` - Processing completed
- `error` - Error occurred

---

### 8. Memory Operations

Store and retrieve agent memories.

#### Store Memory

```typescript
import { MemoryType } from '@10xscale/agentflow-client';

const response = await client.storeMemory({
  content: 'User prefers dark mode and compact layout',
  memory_type: MemoryType.SEMANTIC,
  category: 'user_preferences',
  metadata: {
    user_id: 'user_123',
    confidence: 0.95
  }
});

console.log('Stored memory:', response.data.memory_id);
```

#### Search Memory

```typescript
import { MemoryType, RetrievalStrategy } from '@10xscale/agentflow-client';

const results = await client.searchMemory({
  query: 'user interface preferences',
  memory_type: MemoryType.SEMANTIC,
  category: 'user_preferences',
  limit: 5,
  score_threshold: 0.7,
  retrieval_strategy: RetrievalStrategy.SIMILARITY
});

for (const memory of results.data.results) {
  console.log(`[${memory.score.toFixed(2)}] ${memory.content}`);
}
```

#### List Memories

```typescript
const memories = await client.listMemories({
  limit: 10
});

console.log(`Found ${memories.data.memories.length} memories`);
```

#### Update Memory

```typescript
const response = await client.updateMemory(
  'mem_123',
  'Updated: User now prefers light mode',
  {
    metadata: {
      updated_at: new Date().toISOString()
    }
  }
);

console.log('Update success:', response.data.success);
```

#### Delete Memory

```typescript
const response = await client.deleteMemory('mem_123');
console.log('Deleted:', response.data.success);
```

---

## Error Handling

### Basic Error Handling

```typescript
import { AgentFlowError } from '@10xscale/agentflow-client';

try {
  const result = await client.invoke({ messages: [...] });
} catch (error) {
  if (error instanceof AgentFlowError) {
    console.error('API Error:', error.message);
    console.error('Request ID:', error.requestId);  // For support tickets
    console.error('Error Code:', error.errorCode);
  } else {
    console.error('Unexpected error:', error);
  }
}
```

### Handling Specific Errors

```typescript
import {
  AuthenticationError,
  NotFoundError,
  ValidationError,
  ServerError
} from '@10xscale/agentflow-client';

try {
  await client.threadDetails('thread_123');
} catch (error) {
  if (error instanceof AuthenticationError) {
    console.log('Please log in again');
  } else if (error instanceof NotFoundError) {
    console.log('Thread not found');
  } else if (error instanceof ValidationError) {
    console.log('Validation failed:', error.details);
  } else if (error instanceof ServerError) {
    console.log('Server error, please retry');
  }
}
```

**See Also:** [Error Handling Guide](./error-handling.md)

---

## Complete Example

Here's a complete example combining multiple features:

```typescript
import {
  AgentFlowClient,
  Message,
  MemoryType,
  AuthenticationError,
  NotFoundError
} from '@10xscale/agentflow-client';

// Initialize client
const client = new AgentFlowClient({
  baseUrl: 'https://api.agentflow.example.com',
  authToken: 'your-secret-token',
  debug: true
});

async function main() {
  try {
    // 1. Health check
    await client.ping();
    console.log('✓ Connected to API');
    
    // 2. Register tools
    client.registerTool({
      node: 'search_node',
      name: 'search_database',
      description: 'Search the database for information',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string' }
        },
        required: ['query']
      },
      handler: async (args) => {
        const results = await searchDatabase(args.query);
        return { results };
      }
    });
    
    // 3. Get or create thread
    let threadId = 123;
    try {
      const thread = await client.threadDetails(threadId);
      console.log('✓ Using existing thread:', thread.data.thread_name);
    } catch (error) {
      if (error instanceof NotFoundError) {
        console.log('Thread not found, creating new one...');
        // Create new thread logic here
      }
    }
    
    // 4. Get thread state
    const state = await client.threadState(threadId);
    console.log('Current state:', state.data.state);
    
    // 5. Search memories for context
    const memories = await client.searchMemory({
      query: 'previous conversation topics',
      memory_type: MemoryType.EPISODIC,
      limit: 5
    });
    console.log(`Found ${memories.data.results.length} relevant memories`);
    
    // 6. Invoke agent with streaming
    console.log('\nAgent response:');
    const stream = client.stream(
      [Message.text_message('Help me find information about our project timeline', 'user')],
      { response_granularity: 'full' }
    );
    
    for await (const chunk of stream) {
      if (chunk.event === 'messages_chunk') {
        process.stdout.write(chunk.data);
      } else if (chunk.event === 'on_chain_end') {
        console.log('\n✓ Completed');
      }
    }
    
    // 7. Store new memory
    await client.storeMemory({
      content: 'User asked about project timeline',
      memory_type: MemoryType.EPISODIC,
      category: 'conversation',
      metadata: {
        timestamp: new Date().toISOString()
      }
    });
    
    // 8. Update thread state
    await client.updateThreadState(
      threadId,
      {}, // config
      {
        last_topic: 'project_timeline',
        messages_count: state.data.state.messages_count + 1
      }
    );
    
    console.log('✓ All operations completed successfully');
    
  } catch (error) {
    if (error instanceof AuthenticationError) {
      console.error('❌ Authentication failed. Please check your token.');
    } else if (error instanceof NotFoundError) {
      console.error('❌ Resource not found.');
    } else {
      console.error('❌ Error:', error);
    }
  }
}

main();
```

---

## Next Steps

### Learn More

- **[API Reference](./api-reference.md)** - Complete API documentation
- **[Error Handling Guide](./error-handling.md)** - Comprehensive error handling
- **[Invoke Usage Guide](./invoke-usage.md)** - Deep dive into invoke API
- **[Stream Usage Guide](./stream-usage.md)** - Streaming API guide
- **[State Schema Guide](./state-schema-guide.md)** - Dynamic state schema

### Examples

- **[Invoke Example](../examples/invoke-example.ts)** - Tool execution example
- **[Stream Example](../examples/stream-example.ts)** - Streaming example
- **[State Schema Examples](../examples/state-schema-examples.ts)** - State schema usage

### Advanced Topics

- **[Tool Registration](./invoke-usage.md#tool-registration)** - How to register tools
- **[Tool Execution Loop](./invoke-usage.md#automatic-tool-execution-loop)** - How the loop works
- **[Stream Events](./stream-usage.md#event-types)** - All stream event types
- **[State Schema Usage](./state-schema-guide.md#use-cases)** - Dynamic forms and validation

### Memory Types

| Type | Use Case |
|------|----------|
| `EPISODIC` | Conversation history, events |
| `SEMANTIC` | Facts, knowledge, preferences |
| `PROCEDURAL` | How-to information |
| `ENTITY` | Information about entities |
| `RELATIONSHIP` | Entity relationships |
| `DECLARATIVE` | Explicit facts and events |
| `CUSTOM` | Custom memory types |

### Granularity Levels

| Level | Returns |
|-------|---------|
| `low` | Messages and metadata only |
| `partial` | + State and context |
| `full` | + Summary |

---

## Tips

1. **Enable Debug Mode** during development to see detailed logs
2. **Use Request IDs** from errors for debugging and support
3. **Register Tools** before calling invoke if your agent needs them
4. **Handle Authentication Errors** globally to refresh tokens
5. **Use Streaming** for real-time user feedback
6. **Store Memories** to build context over time
7. **Check State Schema** to understand available state fields

---

## Need Help?

- Check the [API Reference](./api-reference.md) for detailed documentation
- Review [Examples](../examples/) for working code
- See [Error Handling Guide](./error-handling.md) for error handling patterns

Happy coding! 🚀
