import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { threadDetails } from '../src/endpoints/threadDetails';
import type { ThreadDetailsResponse } from '../src/endpoints/threadDetails';
import { TenxGraphClient } from '../src/client';

describe('threadDetails endpoint', () => {
  const mockBaseUrl = 'http://localhost:8000';
  const threadId = 5;

  const mockThreadDetailsResponse: ThreadDetailsResponse = {
    data: {
      thread_data: {
        thread: {
          thread_id: '5',
          thread_name: null,
          user_id: null,
          metadata: null,
          updated_at: null,
          run_id: null,
        },
      },
    },
    metadata: {
      request_id: '9925ae58-d83d-4cbb-bc1b-ac048bd4a9b3',
      timestamp: '2025-10-26T01:21:30.488167',
      message: 'OK',
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('threadDetails function', () => {
    it('should fetch thread details successfully', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockThreadDetailsResponse,
      });
      global.fetch = fetchMock;

      const context = {
        baseUrl: mockBaseUrl,
        authToken: 'test-token',
        timeout: 5000,
        debug: false,
      };

      const response = await threadDetails(context, threadId);

      expect(response).toEqual(mockThreadDetailsResponse);
      expect(fetchMock).toHaveBeenCalledWith(
        `${mockBaseUrl}/v1/threads/${threadId}`,
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

      await expect(threadDetails(context, threadId)).rejects.toThrow();
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

      await expect(threadDetails(context, threadId)).rejects.toThrow('Request timeout');
    });

    it('should include auth token in headers when provided', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockThreadDetailsResponse,
      });
      global.fetch = fetchMock;

      const context = {
        baseUrl: mockBaseUrl,
        authToken: 'my-secret-token',
        timeout: 5000,
        debug: false,
      };

      await threadDetails(context, threadId);

      const callArgs = (fetchMock as any).mock.calls[0];
      expect(callArgs[1].headers).toHaveProperty('Authorization', 'Bearer my-secret-token');
    });

    it('should not include auth header when authToken is null', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockThreadDetailsResponse,
      });
      global.fetch = fetchMock;

      const context = {
        baseUrl: mockBaseUrl,
        authToken: null,
        timeout: 5000,
        debug: false,
      };

      await threadDetails(context, threadId);

      const callArgs = (fetchMock as any).mock.calls[0];
      expect(callArgs[1].headers).not.toHaveProperty('Authorization');
    });

    it('should debug log when debug is true', async () => {
      const consoleDebug = vi.spyOn(console, 'debug').mockImplementation(() => {});
      const consoleInfo = vi.spyOn(console, 'info').mockImplementation(() => {});
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockThreadDetailsResponse,
      });
      global.fetch = fetchMock;

      const context = {
        baseUrl: mockBaseUrl,
        authToken: 'test-token',
        timeout: 5000,
        debug: true,
      };

      await threadDetails(context, threadId);

      expect(consoleDebug).toHaveBeenCalled();
      expect(consoleInfo).toHaveBeenCalled();
      consoleDebug.mockRestore();
      consoleInfo.mockRestore();
    });

    it('should correctly construct the URL with thread ID', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockThreadDetailsResponse,
      });
      global.fetch = fetchMock;

      const context = {
        baseUrl: mockBaseUrl,
        authToken: 'test-token',
        timeout: 5000,
        debug: false,
      };

      const customThreadId = 42;
      await threadDetails(context, customThreadId);

      const calledUrl = (fetchMock as any).mock.calls[0][0];
      expect(calledUrl).toBe(`${mockBaseUrl}/v1/threads/${customThreadId}`);
    });
  });

  describe('TenxGraphClient.threadDetails', () => {
    it('should call the threadDetails endpoint with correct parameters', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockThreadDetailsResponse,
      });
      global.fetch = fetchMock;

      const client = new TenxGraphClient({
        baseUrl: mockBaseUrl,
        authToken: 'test-token',
        timeout: 5000,
        debug: false,
      });

      const response = await client.threadDetails(threadId);

      expect(response).toEqual(mockThreadDetailsResponse);
      expect(fetchMock).toHaveBeenCalledWith(
        `${mockBaseUrl}/v1/threads/${threadId}`,
        expect.objectContaining({ method: 'GET' })
      );
    });

    it('should return metadata and thread object', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockThreadDetailsResponse,
      });
      global.fetch = fetchMock;

      const client = new TenxGraphClient({
        baseUrl: mockBaseUrl,
        authToken: 'test-token',
      });

      const response = await client.threadDetails(threadId);

      expect(response.metadata).toBeDefined();
      expect(response.metadata.request_id).toBe('9925ae58-d83d-4cbb-bc1b-ac048bd4a9b3');
      expect(response.metadata.message).toBe('OK');
      expect(response.data.thread_data.thread).toBeDefined();
      expect(response.data.thread_data.thread.thread_id).toBe('5');
    });
  });
});
