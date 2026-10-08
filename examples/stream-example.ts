/**
 * Stream Invoke Example
 *
 * This example demonstrates how to use the streamInvoke method
 * for real-time streaming responses from the 10xGraph API.
 */

import { TenxGraphClient, Message, StreamChunk, StreamEventType } from '../src/index.js';

/**
 * Basic streaming example
 */
async function basicStreamExample() {
  // Create client
  const client = new TenxGraphClient({
    baseUrl: 'http://127.0.0.1:8000',
    debug: true,
  });

  // Create a message
  const messages = [Message.text_message('What is the weather like?', 'user')];

  console.log('Starting stream...\n');

  // Stream the response
  const stream = client.stream(messages, {
    response_granularity: 'low',
    recursion_limit: 25,
  });

  let messageCount = 0;
  let updateCount = 0;

  // Iterate over stream chunks
  for await (const chunk of stream) {
    switch (chunk.event) {
      case StreamEventType.MESSAGE:
        if (chunk.message) {
          messageCount++;
          console.log(`\n[Message ${messageCount}] ${chunk.message.role}:`);

          // Print text content
          const textBlocks = chunk.message.content?.filter((block: any) => block.type === 'text');
          textBlocks?.forEach((block: any) => {
            console.log(block.text);
          });
        }
        break;

      case StreamEventType.UPDATES:
        updateCount++;
        console.log(`\n[Update ${updateCount}] State changed`);
        if (chunk.state) {
          console.log('  Context messages:', chunk.state.context?.length || 0);
        }
        break;

      case StreamEventType.ERROR:
        console.error('\n[Error]', chunk.data);
        break;

      default:
        console.log(`\n[${chunk.event}]`, chunk.data);
    }
  }

  console.log('\n\nStream completed!');
}

/**
 * Collect all chunks then process them
 */
async function collectAndProcessExample() {
  const client = new TenxGraphClient({
    baseUrl: 'http://127.0.0.1:8000',
    debug: false,
  });

  const messages = [Message.text_message('Hello!', 'user')];
  const chunks: StreamChunk[] = [];

  // Collect all chunks
  const stream = client.stream(messages);
  for await (const chunk of stream) {
    chunks.push(chunk);
  }

  // Now process all at once
  const messageChunks = chunks.filter((c) => c.event === 'message');
  const updateChunks = chunks.filter((c) => c.event === 'updates');

  console.log(`Received ${messageChunks.length} messages and ${updateChunks.length} updates`);
  console.log(`Total chunks: ${chunks.length}`);
}

/**
 * Real-time UI update simulation
 */
async function realtimeUIExample() {
  const client = new TenxGraphClient({
    baseUrl: 'http://127.0.0.1:8000',
    debug: false,
  });

  const userMessage = Message.text_message('Tell me a joke', 'user');

  console.log('User:', userMessage.content[0]);

  let assistantResponse = '';

  // Stream response and update "UI" incrementally
  const stream = client.stream([userMessage], {
    response_granularity: 'low',
  });

  for await (const chunk of stream) {
    if (chunk.event === 'message' && chunk.message?.role === 'assistant') {
      // Accumulate assistant response text
      const textBlocks = chunk.message.content?.filter((block: any) => block.type === 'text');
      textBlocks?.forEach((block: any) => {
        assistantResponse += block.text;
        // In a real UI, you'd update React state here
        process.stdout.write(block.text);
      });
    }
  }

  console.log('\n\nFull response:', assistantResponse);
}

/**
 * With error handling
 */
async function withErrorHandlingExample() {
  const client = new TenxGraphClient({
    baseUrl: 'http://127.0.0.1:8000',
    timeout: 30000, // 30 seconds
    debug: false,
  });

  const messages = [Message.text_message('Hello', 'user')];

  try {
    const stream = client.stream(messages);

    for await (const chunk of stream) {
      if (chunk.event === 'error') {
        console.error('Received error in stream:', chunk.data);
        break;
      }

      if (chunk.event === 'message') {
        console.log('Message received');
      }
    }
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('timeout')) {
        console.error('Stream timed out');
      } else if (error.message.includes('HTTP error')) {
        console.error('Server error');
      } else {
        console.error('Unknown error:', error.message);
      }
    }
  }
}

/**
 * Multiple messages example
 */
async function multiMessageExample() {
  const client = new TenxGraphClient({
    baseUrl: 'http://127.0.0.1:8000',
  });

  // Create a conversation
  const messages = [
    Message.text_message('What is machine learning?', 'user'),
    Message.text_message(
      'Machine learning is a subset of AI that enables systems to learn from data.',
      'assistant'
    ),
    Message.text_message('Give me an example', 'user'),
  ];

  console.log('Continuing conversation...\n');

  const stream = client.stream(messages, {
    response_granularity: 'low',
  });

  for await (const chunk of stream) {
    if (chunk.event === 'message') {
      console.log(`\n[${chunk.message?.role}]: ${chunk.message?.content}`);
    }
  }
}

// Run example based on command line argument
const example = process.argv[2] || 'basic';

switch (example) {
  case 'basic':
    basicStreamExample().catch(console.error);
    break;
  case 'collect':
    collectAndProcessExample().catch(console.error);
    break;
  case 'realtime':
    realtimeUIExample().catch(console.error);
    break;
  case 'error':
    withErrorHandlingExample().catch(console.error);
    break;
  case 'multi':
    multiMessageExample().catch(console.error);
    break;
  default:
    console.log('Usage: npx ts-node stream-example.ts [basic|collect|realtime|error|multi]');
}
