/**
 * Test script to verify streaming functionality with the server
 * Run with: npx tsx test-stream.ts
 */

import { TenxGraphClient } from '../src/client.js';
import { Message } from '../src/message.js';

const SERVER_URL = 'http://127.0.0.1:8000';

async function testPing() {
  console.log('\n🔍 Testing server connectivity...');

  // The server has ping at /ping, not /v1/ping
  try {
    const response = await fetch(`${SERVER_URL}/ping`);
    if (!response.ok) {
      console.error('❌ Ping failed:', response.status, response.statusText);
      return false;
    }
    const data = await response.json();
    console.log('✅ Ping successful:', data);
    return true;
  } catch (error) {
    console.error('❌ Ping failed:', error);
    return false;
  }
}

async function testStreaming() {
  console.log('\n🌊 Testing streaming functionality...');

  const client = new TenxGraphClient({
    baseUrl: SERVER_URL,
    debug: true,
    timeout: 60000, // 60 second timeout for streaming
  });

  // Create a simple user message
  const userMessage = Message.text_message('Hello! Can you tell me a short joke?', 'user');

  console.log('\n📤 Sending message:', userMessage.text());
  console.log('---');

  try {
    const stream = client.stream([userMessage], {
      response_granularity: 'low',
    });

    let chunkCount = 0;
    let messageCount = 0;
    let fullResponse = '';

    console.log('\n📥 Receiving stream chunks:');
    console.log('---');

    for await (const chunk of stream) {
      chunkCount++;
      console.log(`\n[Chunk ${chunkCount}]`);
      console.log('  Event type:', chunk.event);

      if (chunk.message) {
        messageCount++;
        const text =
          chunk.message.content
            ?.filter((b: any) => b.type === 'text')
            ?.map((b: any) => b.text)
            ?.join('') || '';

        if (text) {
          fullResponse += text;
          console.log('  Message text:', text.slice(0, 100) + (text.length > 100 ? '...' : ''));
        }
        console.log('  Message role:', chunk.message.role);
      }

      if (chunk.state) {
        console.log('  State keys:', Object.keys(chunk.state));
      }

      if (chunk.metadata) {
        console.log('  Metadata:', JSON.stringify(chunk.metadata).slice(0, 100));
      }

      if (chunk.thread_id) {
        console.log('  Thread ID:', chunk.thread_id);
      }
    }

    console.log('\n---');
    console.log('\n📊 Stream Summary:');
    console.log(`  Total chunks received: ${chunkCount}`);
    console.log(`  Message chunks: ${messageCount}`);
    console.log(`  Full response length: ${fullResponse.length} characters`);

    if (fullResponse) {
      console.log('\n📝 Full response:');
      console.log(fullResponse);
    }

    console.log('\n✅ Streaming test completed successfully!');
    return true;
  } catch (error) {
    console.error('\n❌ Streaming test failed:', error);
    return false;
  }
}

async function testRawStreamEndpoint() {
  console.log('\n🔧 Testing raw stream endpoint with fetch...');

  const message = {
    role: 'user',
    content: [{ type: 'text', text: 'Hello! Say hi back in one sentence.' }],
    message_id: '0',
  };

  try {
    const response = await fetch(`${SERVER_URL}/v1/graph/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify({
        messages: [message],
        response_granularity: 'low',
      }),
    });

    if (!response.ok) {
      console.error('❌ Raw stream request failed:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('Error body:', errorText);
      return false;
    }

    if (!response.body) {
      console.error('❌ No response body');
      return false;
    }

    console.log('Response headers:');
    response.headers.forEach((value, key) => {
      console.log(`  ${key}: ${value}`);
    });

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    const rawChunks: string[] = [];

    console.log('\n📥 Raw stream data:');
    console.log('---');

    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        if (buffer.trim()) {
          rawChunks.push(buffer);
          console.log('Final buffer:', buffer.slice(0, 200));
        }
        break;
      }

      const chunk = decoder.decode(value, { stream: true });
      buffer += chunk;
      rawChunks.push(chunk);
      console.log('Received chunk:', chunk.slice(0, 200) + (chunk.length > 200 ? '...' : ''));
    }

    console.log('---');
    console.log(`\n✅ Received ${rawChunks.length} raw chunks`);

    // Try to parse the combined buffer
    console.log('\n📋 Attempting to parse JSON from buffer:');
    const lines = buffer.split('\n').filter((l) => l.trim());
    for (const line of lines) {
      try {
        const parsed = JSON.parse(line);
        console.log('Parsed object:', JSON.stringify(parsed).slice(0, 200));
      } catch (e) {
        console.log('Could not parse line:', line.slice(0, 100));
      }
    }

    return true;
  } catch (error) {
    console.error('❌ Raw stream test failed:', error);
    return false;
  }
}

async function main() {
  console.log('========================================');
  console.log('10xGraph Streaming Verification Test');
  console.log('========================================');
  console.log(`Server: ${SERVER_URL}`);
  console.log(`Time: ${new Date().toISOString()}`);

  // Step 1: Test server connectivity
  const pingOk = await testPing();
  if (!pingOk) {
    console.log('\n⚠️  Server is not reachable. Please ensure the server is running.');
    process.exit(1);
  }

  // Step 2: Test raw stream endpoint first
  const rawOk = await testRawStreamEndpoint();

  // Step 3: Test with TenxGraphClient
  const streamOk = await testStreaming();

  console.log('\n========================================');
  console.log('Test Results Summary');
  console.log('========================================');
  console.log(`Ping Test:       ${pingOk ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Raw Stream Test: ${rawOk ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Client Stream:   ${streamOk ? '✅ PASS' : '❌ FAIL'}`);
  console.log('========================================\n');

  process.exit(pingOk && rawOk && streamOk ? 0 : 1);
}

main().catch(console.error);
