/**
 * Example: Using TenxGraphClient with tool registration and invoke
 *
 * ⚠️ IMPORTANT: This example demonstrates remote tool registration for demonstration purposes.
 * In production, you should define most tools in your Python backend (agent graph) instead.
 * Only use remote tools (client-side) for browser-level APIs like localStorage, geolocation, etc.
 * See: docs/tools-guide.md#remote-tools-vs-backend-tools
 *
 * This example demonstrates:
 * 1. Creating an TenxGraphClient
 * 2. Registering tools for remote execution
 * 3. Setting up tools on the server
 * 4. Invoking the graph with automatic tool execution loop
 */

import { TenxGraphClient, Message, ToolRegistration } from '../src/index.js';

// Example tool: Get current weather
const getWeatherTool: ToolRegistration = {
  node: 'weather_node',
  name: 'get_weather',
  description: 'Get the current weather for a location',
  parameters: {
    type: 'object',
    properties: {
      location: {
        type: 'string',
        description: 'The city and state, e.g., San Francisco, CA',
      },
      unit: {
        type: 'string',
        enum: ['celsius', 'fahrenheit'],
        description: 'Temperature unit',
      },
    },
    required: ['location'],
  },
  handler: async (args: any) => {
    // Simulate API call
    console.log(`Getting weather for ${args.location}...`);
    return {
      location: args.location,
      temperature: 72,
      unit: args.unit || 'fahrenheit',
      conditions: 'sunny',
    };
  },
};

// Example tool: Calculate
const calculateTool: ToolRegistration = {
  node: 'math_node',
  name: 'calculate',
  description: 'Perform a mathematical calculation',
  parameters: {
    type: 'object',
    properties: {
      expression: {
        type: 'string',
        description: 'Mathematical expression to evaluate',
      },
    },
    required: ['expression'],
  },
  handler: async (args: any) => {
    console.log(`Calculating: ${args.expression}`);
    try {
      // Simple evaluation (in production, use a safe math parser)
      const result = eval(args.expression);
      return { result };
    } catch (error) {
      throw new Error(`Invalid expression: ${args.expression}`);
    }
  },
};

async function main() {
  // Create client
  const client = new TenxGraphClient({
    baseUrl: 'http://127.0.0.1:8000',
    authToken: null,
    debug: true,
    timeout: 300000, // 5 minutes
  });

  // Register client-side handlers. Their schemas live in 10xgraph.json.
  client.registerToolHandler(getWeatherTool.name, getWeatherTool.handler);
  client.registerToolHandler(calculateTool.name, calculateTool.handler);

  // Create initial messages
  const messages = [Message.text_message('What is the weather in San Francisco?', 'user')];

  // Invoke the graph
  // The invoke method will:
  // 1. Send the initial message
  // 2. If the response contains remote_tool_call blocks, execute them
  // 3. Send the tool results back
  // 4. Repeat until no more tool calls or recursion_limit is reached
  const result = await client.invoke(messages, {
    initial_state: {},
    config: {},
    recursion_limit: 25,
    response_granularity: 'full',
  });

  console.log('\n=== Invoke Result ===');
  console.log('Iterations:', result.iterations);
  console.log('Recursion limit reached:', result.recursion_limit_reached);
  console.log('Total messages:', result.all_messages.length);
  console.log('\nFinal messages:');
  result.messages.forEach((msg, idx) => {
    console.log(`${idx + 1}. [${msg.role}]:`, msg.text());
  });

  console.log('\nAll messages (including intermediate):');
  result.all_messages.forEach((msg, idx) => {
    console.log(`${idx + 1}. [${msg.role}]:`, msg.text());
  });
}

// Run example
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
