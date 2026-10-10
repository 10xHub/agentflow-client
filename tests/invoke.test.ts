import { describe, it, expect, vi } from 'vitest';
import { TenxGraphClient } from '../src/client';
import { Message } from '../src/message';
import { ToolRegistration } from '../src/tools';

// Mock fetch
global.fetch = vi.fn();

describe('Invoke with Tool Execution', () => {
  it('should invoke without tool calls', async () => {
    const mockResponse = {
      data: {
        messages: [
          {
            message_id: '123',
            role: 'assistant',
            content: [{ type: 'text', text: 'Hello!' }],
            delta: false,
            timestamp: Date.now(),
            metadata: {},
          },
        ],
        meta: {
          is_new_thread: true,
          thread_id: 'thread-123',
        },
      },
      metadata: {
        request_id: 'req-123',
        timestamp: new Date().toISOString(),
        message: 'OK',
      },
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const client = new TenxGraphClient({
      baseUrl: 'http://localhost:8000',
      debug: false,
    });

    const messages = [Message.text_message('Hello', 'user')];
    const result = await client.invoke(messages);

    expect(result.iterations).toBe(1);
    expect(result.recursion_limit_reached).toBe(false);
    expect(result.messages.length).toBe(1);
    expect(result.all_messages.length).toBe(1);
  });

  it('should execute tool calls and continue loop', async () => {
    // Mock tool
    const mockTool: ToolRegistration = {
      node: 'test_node',
      name: 'test_tool',
      description: 'Test tool',
      handler: async (_args: any) => {
        return { result: 'tool executed' };
      },
    };

    // First response with tool call
    const firstResponse = {
      data: {
        messages: [
          {
            message_id: '123',
            role: 'assistant',
            content: [
              {
                type: 'remote_tool_call',
                id: 'call-1',
                name: 'test_tool',
                args: { test: 'arg' },
                tool_type: 'remote',
              },
            ],
            delta: false,
            timestamp: Date.now(),
            metadata: {},
          },
        ],
        meta: {
          is_new_thread: true,
          thread_id: 'thread-123',
        },
      },
      metadata: {
        request_id: 'req-123',
        timestamp: new Date().toISOString(),
        message: 'OK',
      },
    };

    // Second response without tool calls
    const secondResponse = {
      data: {
        messages: [
          {
            message_id: '124',
            role: 'assistant',
            content: [{ type: 'text', text: 'Done!' }],
            delta: false,
            timestamp: Date.now(),
            metadata: {},
          },
        ],
        meta: {
          is_new_thread: false,
          thread_id: 'thread-123',
        },
      },
      metadata: {
        request_id: 'req-124',
        timestamp: new Date().toISOString(),
        message: 'OK',
      },
    };

    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => firstResponse,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => secondResponse,
      });

    const client = new TenxGraphClient({
      baseUrl: 'http://localhost:8000',
      debug: false,
    });

    client.registerToolHandler(mockTool.name, mockTool.handler);

    const messages = [Message.text_message('Test', 'user')];
    const result = await client.invoke(messages);

    expect(result.iterations).toBe(2);
    expect(result.recursion_limit_reached).toBe(false);
    // Should have: initial message, tool call response, tool result, final response
    expect(result.all_messages.length).toBeGreaterThan(1);
  });

  it('should respect recursion limit', async () => {
    // Mock response that always has tool calls
    const mockResponseWithToolCall = {
      data: {
        messages: [
          {
            message_id: '123',
            role: 'assistant',
            content: [
              {
                type: 'remote_tool_call',
                id: 'call-1',
                name: 'test_tool',
                args: {},
                tool_type: 'remote',
              },
            ],
            delta: false,
            timestamp: Date.now(),
            metadata: {},
          },
        ],
        meta: {
          is_new_thread: true,
          thread_id: 'thread-123',
        },
      },
      metadata: {
        request_id: 'req-123',
        timestamp: new Date().toISOString(),
        message: 'OK',
      },
    };

    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => mockResponseWithToolCall,
    });

    const mockTool: ToolRegistration = {
      node: 'test_node',
      name: 'test_tool',
      handler: async () => ({ result: 'ok' }),
    };

    const client = new TenxGraphClient({
      baseUrl: 'http://localhost:8000',
      debug: false,
    });

    client.registerTool(mockTool);

    const messages = [Message.text_message('Test', 'user')];
    const result = await client.invoke(messages, {
      recursion_limit: 3, // Low limit
    });

    expect(result.iterations).toBe(3);
    expect(result.recursion_limit_reached).toBe(true);
  });

  it('should call onPartialResult callback for each iteration', async () => {
    // Mock tool
    const mockTool: ToolRegistration = {
      node: 'test_node',
      name: 'test_tool',
      handler: async () => ({ result: 'ok' }),
    };

    // First response with tool call
    const firstResponse = {
      data: {
        messages: [
          {
            message_id: '123',
            role: 'assistant',
            content: [
              {
                type: 'remote_tool_call',
                id: 'call-1',
                name: 'test_tool',
                args: {},
                tool_type: 'remote',
              },
            ],
            delta: false,
            timestamp: Date.now(),
            metadata: {},
          },
        ],
        meta: {
          is_new_thread: true,
          thread_id: 'thread-123',
        },
      },
      metadata: {
        request_id: 'req-123',
        timestamp: new Date().toISOString(),
        message: 'OK',
      },
    };

    // Second response without tool calls
    const secondResponse = {
      data: {
        messages: [
          {
            message_id: '124',
            role: 'assistant',
            content: [{ type: 'text', text: 'Done!' }],
            delta: false,
            timestamp: Date.now(),
            metadata: {},
          },
        ],
        meta: {
          is_new_thread: false,
          thread_id: 'thread-123',
        },
      },
      metadata: {
        request_id: 'req-124',
        timestamp: new Date().toISOString(),
        message: 'OK',
      },
    };

    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => firstResponse,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => secondResponse,
      });

    const client = new TenxGraphClient({
      baseUrl: 'http://localhost:8000',
      debug: false,
    });

    client.registerTool(mockTool);

    const messages = [Message.text_message('Test', 'user')];

    // Track callback invocations
    const partialResults: any[] = [];

    const result = await client.invoke(messages, {
      onPartialResult: async (partial) => {
        partialResults.push(partial);
      },
    });

    // Should have received 2 partial results (one for each iteration)
    expect(partialResults.length).toBe(2);

    // First partial should have tool calls
    expect(partialResults[0].has_tool_calls).toBe(true);
    expect(partialResults[0].is_final).toBe(false);
    expect(partialResults[0].iteration).toBe(1);

    // Second partial should be final
    expect(partialResults[1].has_tool_calls).toBe(false);
    expect(partialResults[1].is_final).toBe(true);
    expect(partialResults[1].iteration).toBe(2);

    // Final result should be correct
    expect(result.iterations).toBe(2);
  });
});
