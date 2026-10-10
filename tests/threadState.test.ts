import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { threadState } from '../src/endpoints/threadState';
import type { ThreadStateResponse } from '../src/endpoints/threadState';
import { TenxGraphClient } from '../src/client';
import type { TextBlock } from '../src/message';

describe('threadState endpoint', () => {
  const mockBaseUrl = 'http://localhost:8000';
  const threadId = 5;

  const mockThreadStateResponse: ThreadStateResponse = {
    data: {
      state: {
        context: [
          {
            message_id: '82549b0c-dd9b-4756-a303-ea0ea6c9be3b',
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'HI',
                annotations: [],
              } as TextBlock,
            ],
            delta: false,
            tools_calls: null,
            timestamp: 1761290526.29568,
            metadata: {},
            usages: null,
            raw: null,
          } as any,
          {
            message_id: 'Hin7aLyROPup1e8P5J69qQQ',
            role: 'assistant',
            content: [
              {
                type: 'text',
                text: 'Hi, how can I help you today?\n',
                annotations: [],
              } as TextBlock,
            ],
            delta: false,
            tools_calls: null,
            timestamp: 1761290526,
            metadata: {
              provider: 'litellm',
              model: 'gemini-2.0-flash-exp',
              finish_reason: 'stop',
            },
            usages: {
              completion_tokens: 10,
              prompt_tokens: 59,
              total_tokens: 69,
              reasoning_tokens: 0,
              cache_creation_input_tokens: 0,
              cache_read_input_tokens: 0,
              image_tokens: 0,
              audio_tokens: 0,
            },
            raw: {},
          } as any,
        ],
        context_summary: null,
        execution_meta: {
          current_node: 'START',
          step: 0,
          is_running: true,
          is_interrupted: false,
          is_stopped_requested: false,
        },
      },
    },
    metadata: {
      request_id: '8b898571-6822-4760-858b-aaa0d7c39974',
      timestamp: '2025-10-24T13:22:32.651786',
      message: 'OK',
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('threadState function', () => {
    it('should fetch thread state successfully', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockThreadStateResponse,
      });
      global.fetch = fetchMock;

      const context = {
        baseUrl: mockBaseUrl,
        authToken: 'test-token',
        timeout: 5000,
        debug: false,
      };

      const response = await threadState(context, threadId);

      expect(response).toEqual(mockThreadStateResponse);
      expect(fetchMock).toHaveBeenCalledWith(
        `${mockBaseUrl}/v1/threads/${threadId}/state`,
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            accept: 'application/json',
            Authorization: 'Bearer test-token',
          }),
        })
      );
    });

    it('should handle HTTP errors', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
      });
      global.fetch = fetchMock;

      const context = {
        baseUrl: mockBaseUrl,
        authToken: 'test-token',
        timeout: 5000,
        debug: false,
      };

      await expect(threadState(context, threadId)).rejects.toThrow();
    });

    it('should handle timeout', async () => {
      const fetchMock = vi.fn().mockImplementation(
        () =>
          new Promise((_, reject) => {
            setTimeout(() => reject(new DOMException('AbortError', 'AbortError')), 100);
          })
      );
      global.fetch = fetchMock;

      const context = {
        baseUrl: mockBaseUrl,
        authToken: 'test-token',
        timeout: 50,
        debug: false,
      };

      await expect(threadState(context, threadId)).rejects.toThrow('Request timeout');
    });

    it('should include auth token in headers when provided', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockThreadStateResponse,
      });
      global.fetch = fetchMock;

      const context = {
        baseUrl: mockBaseUrl,
        authToken: 'my-secret-token',
        timeout: 5000,
        debug: false,
      };

      await threadState(context, threadId);

      const callArgs = fetchMock.mock.calls[0];
      expect(callArgs[1].headers).toHaveProperty('Authorization', 'Bearer my-secret-token');
    });

    it('should not include auth header when authToken is null', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockThreadStateResponse,
      });
      global.fetch = fetchMock;

      const context = {
        baseUrl: mockBaseUrl,
        authToken: null,
        timeout: 5000,
        debug: false,
      };

      await threadState(context, threadId);

      const callArgs = fetchMock.mock.calls[0];
      expect(callArgs[1].headers).not.toHaveProperty('Authorization');
    });

    it('should debug log when debug is true', async () => {
      const consoleMock = vi.spyOn(console, 'debug').mockImplementation(() => {});
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockThreadStateResponse,
      });
      global.fetch = fetchMock;

      const context = {
        baseUrl: mockBaseUrl,
        authToken: 'test-token',
        timeout: 5000,
        debug: true,
      };

      await threadState(context, threadId);

      expect(consoleMock).toHaveBeenCalled();
      consoleMock.mockRestore();
    });

    it('should correctly construct the URL with thread ID', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockThreadStateResponse,
      });
      global.fetch = fetchMock;

      const context = {
        baseUrl: mockBaseUrl,
        authToken: 'test-token',
        timeout: 5000,
        debug: false,
      };

      const customThreadId = 42;
      await threadState(context, customThreadId);

      const calledUrl = fetchMock.mock.calls[0][0];
      expect(calledUrl).toBe(`${mockBaseUrl}/v1/threads/${customThreadId}/state`);
    });
  });

  describe('TenxGraphClient.threadState', () => {
    it('should call the threadState endpoint with correct parameters', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockThreadStateResponse,
      });
      global.fetch = fetchMock;

      const client = new TenxGraphClient({
        baseUrl: mockBaseUrl,
        authToken: 'test-token',
        timeout: 5000,
        debug: false,
      });

      const response = await client.threadState(threadId);

      expect(response).toEqual(mockThreadStateResponse);
      expect(fetchMock).toHaveBeenCalledWith(
        `${mockBaseUrl}/v1/threads/${threadId}/state`,
        expect.objectContaining({
          method: 'GET',
        })
      );
    });

    it('should pass client config to context', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockThreadStateResponse,
      });
      global.fetch = fetchMock;

      const client = new TenxGraphClient({
        baseUrl: mockBaseUrl,
        authToken: 'my-token',
        timeout: 10000,
        debug: true,
      });

      await client.threadState(threadId);

      const callArgs = fetchMock.mock.calls[0];
      expect(callArgs[1].headers).toHaveProperty('Authorization', 'Bearer my-token');
    });

    it('should handle different thread IDs correctly', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockThreadStateResponse,
      });
      global.fetch = fetchMock;

      const client = new TenxGraphClient({
        baseUrl: mockBaseUrl,
        authToken: 'test-token',
        timeout: 5000,
      });

      const threadIds = [1, 5, 100, 999];

      for (const id of threadIds) {
        await client.threadState(id);
        const calledUrl = fetchMock.mock.calls[fetchMock.mock.calls.length - 1][0];
        expect(calledUrl).toBe(`${mockBaseUrl}/v1/threads/${id}/state`);
      }
    });

    it('should return state with messages', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockThreadStateResponse,
      });
      global.fetch = fetchMock;

      const client = new TenxGraphClient({
        baseUrl: mockBaseUrl,
        authToken: 'test-token',
      });

      const response = await client.threadState(threadId);

      expect(response.data.state.context).toBeDefined();
      expect(response.data.state.context.length).toBeGreaterThan(0);
      expect(response.data.state.context[0].role).toBe('user');
      expect(response.data.state.context[1].role).toBe('assistant');
    });

    it('should return metadata with request details', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockThreadStateResponse,
      });
      global.fetch = fetchMock;

      const client = new TenxGraphClient({
        baseUrl: mockBaseUrl,
        authToken: 'test-token',
      });

      const response = await client.threadState(threadId);

      expect(response.metadata).toBeDefined();
      expect(response.metadata.request_id).toBe('8b898571-6822-4760-858b-aaa0d7c39974');
      expect(response.metadata.message).toBe('OK');
      expect(response.metadata.timestamp).toBe('2025-10-24T13:22:32.651786');
    });
  });

  describe('Response parsing', () => {
    it('should correctly parse state with context', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockThreadStateResponse,
      });
      global.fetch = fetchMock;

      const context = {
        baseUrl: mockBaseUrl,
        authToken: 'test-token',
        timeout: 5000,
        debug: false,
      };

      const response = await threadState(context, threadId);

      expect(response.data.state.context).toBeInstanceOf(Array);
      expect(response.data.state.context.length).toBe(2);

      const firstMessage = response.data.state.context[0];
      expect(firstMessage.role).toBe('user');
      expect(firstMessage.content[0].type).toBe('text');
      expect((firstMessage.content[0] as TextBlock).text).toBe('HI');
    });

    it('should preserve metadata in response', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockThreadStateResponse,
      });
      global.fetch = fetchMock;

      const context = {
        baseUrl: mockBaseUrl,
        authToken: 'test-token',
        timeout: 5000,
        debug: false,
      };

      const response = await threadState(context, threadId);

      expect(response.metadata.request_id).toBeDefined();
      expect(response.metadata.timestamp).toBeDefined();
      expect(response.metadata.message).toBe('OK');
    });
  });
});
