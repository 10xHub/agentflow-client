# 10xGraph Client Examples

This directory contains complete, runnable examples demonstrating how to use the 10xgraph-client library.

## 📁 Examples Overview

### Core API Examples

#### 1. [invoke-example.ts](./invoke-example.ts)

**What it demonstrates:**

- Basic client setup and configuration
- Tool registration (weather and calculator)
- Automatic tool execution loop with `invoke()`
- Handling invoke results
- Progress callbacks with `on_progress`

**⚠️ Important Note:** This example demonstrates remote tool registration for learning purposes. In production, define most tools in your Python backend. Remote tools should **only** be used for browser-level APIs. See [Tools Guide](../docs/tools-guide.md#remote-tools-vs-backend-tools).

**Best for:**

- Understanding the invoke API
- Learning tool registration patterns
- Batch processing use cases

**Run:**

```bash
npx ts-node examples/invoke-example.ts
```

---

#### 2. [stream-example.ts](./stream-example.ts)

**What it demonstrates:**

- Real-time streaming with `stream()`
- Processing different stream event types
- Handling progressive content updates
- Stream error handling
- Building responsive UIs with streaming

**Best for:**

- Chat interfaces
- Real-time agent responses
- Progress indicators
- Streaming content generation

**Run:**

```bash
npx ts-node examples/stream-example.ts
```

---

#### 3. [state-schema-examples.ts](./state-schema-examples.ts)

**What it demonstrates:**

- Fetching agent state schema
- Understanding field types and properties
- Building dynamic forms from schema
- Validating state data
- Working with complex field types (arrays, objects)

**Best for:**

- Dynamic UI generation
- Form builders
- State validation
- Understanding agent capabilities

**Run:**

```bash
npx ts-node examples/state-schema-examples.ts
```

---

## 🚀 Getting Started

### Prerequisites

1. **Node.js 18+** installed
2. **10xGraph API** running locally or accessible endpoint
3. **Environment variables** set (optional):
   ```bash
   export TENXGRAPH_API_URL="http://localhost:8000"
   export TENXGRAPH_API_TOKEN="your-token"
   ```

### Installation

```bash
# Install dependencies
npm install

# Install TypeScript and ts-node (if needed)
npm install -g typescript ts-node
```

### Running Examples

Each example is a standalone TypeScript file that can be run with ts-node:

```bash
# Run invoke example
npx ts-node examples/invoke-example.ts

# Run stream example
npx ts-node examples/stream-example.ts

# Run state schema example
npx ts-node examples/state-schema-examples.ts
```

---

## 📚 React Examples

For React-specific examples, see the **[React Examples Documentation](../docs/react-examples.md)**, which includes:

1. **SimpleChat** - Basic chat with invoke
2. **StreamingChat** - Real-time streaming chat
3. **DynamicFormBuilder** - Forms from state schema
4. **AgentWithTools** - Tool registration in React
5. **MultiStepWorkflow** - Complex multi-step UI
6. **ThreadManagement** - Thread navigation and management

These are complete, copy-paste-ready React components with TypeScript.

---

## 🎯 Example Structure

Each example follows this structure:

```typescript
// 1. Import dependencies
import { TenxGraphClient, Message } from '10xgraph-client';

// 2. Configure client
const client = new TenxGraphClient({
  baseUrl: 'http://localhost:8000',
  authToken: null,
  debug: true,
});

// 3. Register tools (if needed)
client.registerTool({
  node: 'assistant',
  name: 'my_tool',
  handler: async (args) => {
    /* ... */
  },
});

// 4. Main function
async function main() {
  // Your example code here
}

// 5. Run
main().catch(console.error);
```

---

## 🔧 Configuration

### API Endpoint

Update `baseUrl` in examples to match your API server:

```typescript
// Local development
const client = new TenxGraphClient({
  baseUrl: 'http://localhost:8000',
});

// Production
const client = new TenxGraphClient({
  baseUrl: 'https://api.example.com',
  authToken: process.env.TENXGRAPH_API_TOKEN,
});
```

### Debug Mode

Enable debug mode to see detailed logs:

```typescript
const client = new TenxGraphClient({
  baseUrl: 'http://localhost:8000',
  debug: true, // 🔍 Shows requests, responses, tool execution
});
```

---

## 📖 Documentation

For more information:

- **[Getting Started Guide](../docs/getting-started.md)** - Quick start for beginners
- **[Invoke Usage Guide](../docs/invoke-usage.md)** - Complete invoke documentation
- **[Stream Usage Guide](../docs/stream-usage.md)** - Complete streaming documentation
- **[State Schema Guide](../docs/state-schema-guide.md)** - State schema documentation
- **[Tools Guide](../docs/tools-guide.md)** - Tool registration and patterns
- **[React Integration](../docs/react-integration.md)** - React patterns and hooks
- **[React Examples](../docs/react-examples.md)** - React components
- **[API Reference](../docs/api-reference.md)** - Complete API reference
- **[TypeScript Types](../docs/typescript-types.md)** - Type definitions
- **[Troubleshooting](../docs/troubleshooting.md)** - Common issues

---

## 🐛 Troubleshooting

### "Connection refused" error

**Problem:** Can't connect to API server.

**Solution:**

1. Ensure API server is running: `curl http://localhost:8000/v1/ping`
2. Check `baseUrl` matches server address
3. Verify firewall/network settings

### "Tool not found" error

**Problem:** Tool execution fails with "not found".

**Solution:**

1. Register tools **before** calling `invoke()` or `stream()`
2. Verify tool `name` matches exactly
3. Check `node` name matches your agent graph

### TypeScript compilation errors

**Problem:** Type errors when running examples.

**Solution:**

1. Ensure TypeScript is installed: `npm install -g typescript`
2. Check `tsconfig.json` is present
3. Install type definitions: `npm install`

### "Recursion limit reached" warning

**Problem:** Tool loop hits max iterations.

**Solution:**

1. Increase `recursion_limit` in invoke request
2. Check tool handlers return clear, actionable results
3. Use `on_progress` callback to monitor iterations

---

## 💡 Tips

1. **Start with invoke-example.ts** - Easiest to understand
2. **Enable debug mode** - See what's happening under the hood
3. **Read the comments** - Examples are heavily commented
4. **Modify and experiment** - Change prompts, tools, and settings
5. **Check documentation** - Links to full guides in each example

---

## 🤝 Contributing

Have a useful example? Please contribute!

1. Create a new `.ts` file in `examples/`
2. Follow the structure above
3. Add heavy comments explaining what it does
4. Update this README with a description
5. Submit a pull request

---

## 📝 Example Checklist

New examples should include:

- ✅ Clear, descriptive filename
- ✅ Imports and dependencies
- ✅ Configuration section
- ✅ Main function with example logic
- ✅ Error handling
- ✅ Comments explaining key concepts
- ✅ Runnable with `npx ts-node`
- ✅ Entry in this README

---

## 🆘 Need Help?

- **Documentation:** See [docs/README.md](../docs/README.md)
- **Troubleshooting:** See [docs/troubleshooting.md](../docs/troubleshooting.md)
- **API Reference:** See [docs/api-reference.md](../docs/api-reference.md)
- **Issues:** Create an issue on GitHub

---

**Happy coding!** 🚀
