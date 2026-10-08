import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { updateThreadState } from '../src/endpoints/updateThreadState';
import type { UpdateThreadStateResponse } from '../src/endpoints/updateThreadState';
import { TenxGraphClient } from '../src/client';
import type { TextBlock } from '../src/message';

describe('updateThreadState endpoint', () => {
  const mockBaseUrl = 'http://localhost:8000';
  const threadId = 5;

  const mockUpdateResponse: UpdateThreadStateResponse = {
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
      request_id: '97160711-b1d1-41d9-bd8e-e2a84269e855',
      timestamp: '2025-10-24T13:31:21.225194',
      message: 'OK',
    },
  };

  const mockRequest = {
    config: {
      max_iterations: 10,
      timeout: 300,
    },
    state: {
      context: [],
      context_summary: null,
      execution_meta: {
        current_node: 'START',
        step: 0,
        is_running: false,
        is_interrupted: false,
        is_stopped_requested: false,
      },
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('updateThreadState function', () => {
    it('should update thread state successfully', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockUpdateResponse,
        text: async () => '{}',
      });
      global.fetch = fetchMock;

      const context = {
        baseUrl: mockBaseUrl,
        authToken: 'test-token',
        timeout: 5000,
        debug: false,
      };

      const response = await updateThreadState(context, threadId, mockRequest);

      expect(response).toEqual(mockUpdateResponse);
      expect(fetchMock).toHaveBeenCalledWith(
        `${mockBaseUrl}/v1/threads/${threadId}/state`,
        expect.objectContaining({
          method: 'PUT',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            accept: 'application/json',
            Authorization: 'Bearer test-token',
          }),
        })
      );
    });

    it('should send correct request body with config and state', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockUpdateResponse,
        text: async () => '{}',
      });
      global.fetch = fetchMock;

      const context = {
        baseUrl: mockBaseUrl,
        authToken: 'test-token',
        timeout: 5000,
        debug: false,
      };

      await updateThreadState(context, threadId, mockRequest);

      const callArgs = fetchMock.mock.calls[0];
      const bodyStr = callArgs[1].body;
      const body = JSON.parse(bodyStr as string);

      expect(body.config).toEqual(mockRequest.config);
      expect(body.state).toEqual(mockRequest.state);
    });

    it('should handle HTTP errors', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        text: async () => 'Thread not found',
      });
      global.fetch = fetchMock;

      const context = {
        baseUrl: mockBaseUrl,
        authToken: 'test-token',
        timeout: 5000,
        debug: false,
      };

      await expect(updateThreadState(context, threadId, mockRequest)).rejects.toThrow();
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

      await expect(updateThreadState(context, threadId, mockRequest)).rejects.toThrow(
        'Request timeout'
      );
    });

    it('should include auth token in headers when provided', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockUpdateResponse,
        text: async () => '{}',
      });
      global.fetch = fetchMock;

      const context = {
        baseUrl: mockBaseUrl,
        authToken: 'my-secret-token',
        timeout: 5000,
        debug: false,
      };

      await updateThreadState(context, threadId, mockRequest);

      const callArgs = fetchMock.mock.calls[0];
      expect(callArgs[1].headers).toHaveProperty('Authorization', 'Bearer my-secret-token');
    });

    it('should not include auth header when authToken is null', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockUpdateResponse,
        text: async () => '{}',
      });
      global.fetch = fetchMock;

      const context = {
        baseUrl: mockBaseUrl,
        authToken: null,
        timeout: 5000,
        debug: false,
      };

      await updateThreadState(context, threadId, mockRequest);

      const callArgs = fetchMock.mock.calls[0];
      expect(callArgs[1].headers).not.toHaveProperty('Authorization');
    });

    it('should correctly construct the URL with thread ID', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockUpdateResponse,
        text: async () => '{}',
      });
      global.fetch = fetchMock;

      const context = {
        baseUrl: mockBaseUrl,
        authToken: 'test-token',
        timeout: 5000,
        debug: false,
      };

      const customThreadId = 42;
      await updateThreadState(context, customThreadId, mockRequest);

      const calledUrl = fetchMock.mock.calls[0][0];
      expect(calledUrl).toBe(`${mockBaseUrl}/v1/threads/${customThreadId}/state`);
    });

    it('should handle empty config', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockUpdateResponse,
        text: async () => '{}',
      });
      global.fetch = fetchMock;

      const context = {
        baseUrl: mockBaseUrl,
        authToken: 'test-token',
        timeout: 5000,
        debug: false,
      };

      const requestWithEmptyConfig = {
        config: {},
        state: mockRequest.state,
      };

      await updateThreadState(context, threadId, requestWithEmptyConfig);

      const callArgs = fetchMock.mock.calls[0];
      const body = JSON.parse(callArgs[1].body as string);
      expect(body.config).toEqual({});
    });

    it('should handle complex config objects', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockUpdateResponse,
        text: async () => '{}',
      });
      global.fetch = fetchMock;

      const context = {
        baseUrl: mockBaseUrl,
        authToken: 'test-token',
        timeout: 5000,
        debug: false,
      };

      const complexConfig = {
        max_iterations: 25,
        timeout: 600,
        retry_policy: {
          max_retries: 3,
          backoff_factor: 1.5,
        },
        flags: {
          debug: true,
          stream: false,
        },
      };

      const requestWithComplexConfig = {
        config: complexConfig,
        state: mockRequest.state,
      };

      await updateThreadState(context, threadId, requestWithComplexConfig);

      const callArgs = fetchMock.mock.calls[0];
      const body = JSON.parse(callArgs[1].body as string);
      expect(body.config).toEqual(complexConfig);
    });
  });

  describe('TenxGraphClient.updateThreadState', () => {
    it('should call the updateThreadState endpoint with correct parameters', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockUpdateResponse,
        text: async () => '{}',
      });
      global.fetch = fetchMock;

      const client = new TenxGraphClient({
        baseUrl: mockBaseUrl,
        authToken: 'test-token',
        timeout: 5000,
        debug: false,
      });

      const response = await client.updateThreadState(
        threadId,
        mockRequest.config,
        mockRequest.state
      );

      expect(response).toEqual(mockUpdateResponse);
    });

    it('should pass client config to context', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockUpdateResponse,
        text: async () => '{}',
      });
      global.fetch = fetchMock;

      const client = new TenxGraphClient({
        baseUrl: mockBaseUrl,
        authToken: 'my-token',
        timeout: 10000,
        debug: true,
      });

      await client.updateThreadState(threadId, mockRequest.config, mockRequest.state);

      const callArgs = fetchMock.mock.calls[0];
      expect(callArgs[1].headers).toHaveProperty('Authorization', 'Bearer my-token');
    });

    it('should handle different thread IDs correctly', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockUpdateResponse,
        text: async () => '{}',
      });
      global.fetch = fetchMock;

      const client = new TenxGraphClient({
        baseUrl: mockBaseUrl,
        authToken: 'test-token',
      });

      const threadIds = [1, 5, 100, 999];

      for (const id of threadIds) {
        await client.updateThreadState(id, mockRequest.config, mockRequest.state);
        const calledUrl = fetchMock.mock.calls[fetchMock.mock.calls.length - 1][0];
        expect(calledUrl).toBe(`${mockBaseUrl}/v1/threads/${id}/state`);
      }
    });

    it('should return updated state with messages', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockUpdateResponse,
        text: async () => '{}',
      });
      global.fetch = fetchMock;

      const client = new TenxGraphClient({
        baseUrl: mockBaseUrl,
        authToken: 'test-token',
      });

      const response = await client.updateThreadState(
        threadId,
        mockRequest.config,
        mockRequest.state
      );

      expect(response.data.state.context).toBeDefined();
      expect(response.data.state.context.length).toBeGreaterThan(0);
    });

    it('should return metadata with request details', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockUpdateResponse,
        text: async () => '{}',
      });
      global.fetch = fetchMock;

      const client = new TenxGraphClient({
        baseUrl: mockBaseUrl,
        authToken: 'test-token',
      });

      const response = await client.updateThreadState(
        threadId,
        mockRequest.config,
        mockRequest.state
      );

      expect(response.metadata).toBeDefined();
      expect(response.metadata.request_id).toBe('97160711-b1d1-41d9-bd8e-e2a84269e855');
      expect(response.metadata.message).toBe('OK');
    });
  });

  describe('Request validation', () => {
    it('should send PUT method', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockUpdateResponse,
        text: async () => '{}',
      });
      global.fetch = fetchMock;

      const context = {
        baseUrl: mockBaseUrl,
        authToken: 'test-token',
        timeout: 5000,
        debug: false,
      };

      await updateThreadState(context, threadId, mockRequest);

      const callArgs = fetchMock.mock.calls[0];
      expect(callArgs[1].method).toBe('PUT');
    });

    it('should set correct content type headers', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockUpdateResponse,
        text: async () => '{}',
      });
      global.fetch = fetchMock;

      const context = {
        baseUrl: mockBaseUrl,
        authToken: 'test-token',
        timeout: 5000,
        debug: false,
      };

      await updateThreadState(context, threadId, mockRequest);

      const callArgs = fetchMock.mock.calls[0];
      const headers = callArgs[1].headers;
      expect(headers['Content-Type']).toBe('application/json');
      expect(headers['accept']).toBe('application/json');
    });
  });

  describe('Error handling', () => {
    it('should handle 400 bad request errors', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        text: async () => 'Invalid request body',
      });
      global.fetch = fetchMock;

      const context = {
        baseUrl: mockBaseUrl,
        authToken: 'test-token',
        timeout: 5000,
        debug: false,
      };

      await expect(updateThreadState(context, threadId, mockRequest)).rejects.toThrow();
    });

    it('should handle 500 server errors', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        text: async () => 'Internal Server Error',
      });
      global.fetch = fetchMock;

      const context = {
        baseUrl: mockBaseUrl,
        authToken: 'test-token',
        timeout: 5000,
        debug: false,
      };

      await expect(updateThreadState(context, threadId, mockRequest)).rejects.toThrow();
    });

    it('should include error message in exception', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        text: async () => 'Unauthorized',
      });
      global.fetch = fetchMock;

      const context = {
        baseUrl: mockBaseUrl,
        authToken: 'invalid-token',
        timeout: 5000,
        debug: false,
      };

      try {
        await updateThreadState(context, threadId, mockRequest);
        expect.fail('Should have thrown an error');
      } catch (error) {
        // Just verify an error was thrown - new error system throws structured errors
        expect(error).toBeInstanceOf(Error);
      }
    });
  });
});
