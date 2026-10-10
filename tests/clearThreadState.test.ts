import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { clearThreadState } from '../src/endpoints/clearThreadState';
import type { ClearThreadStateResponse } from '../src/endpoints/clearThreadState';
import { TenxGraphClient } from '../src/client';

describe('clearThreadState endpoint', () => {
  const mockBaseUrl = 'http://localhost:8000';
  const threadId = 5;

  const mockClearThreadStateResponse: ClearThreadStateResponse = {
    data: {
      success: true,
      message: 'State cleared successfully',
      data: true,
    },
    metadata: {
      request_id: '07471cf8-0d95-4f4f-af23-619d1011a465',
      timestamp: '2025-10-24T15:59:17.683517',
      message: 'OK',
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('clearThreadState function', () => {
    it('should clear thread state successfully', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockClearThreadStateResponse,
      });
      global.fetch = fetchMock;

      const context = {
        baseUrl: mockBaseUrl,
        authToken: 'test-token',
        timeout: 5000,
        debug: false,
      };

      const response = await clearThreadState(context, threadId);

      expect(response).toEqual(mockClearThreadStateResponse);
      expect(fetchMock).toHaveBeenCalledWith(
        `${mockBaseUrl}/v1/threads/${threadId}/state`,
        expect.objectContaining({
          method: 'DELETE',
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

      await expect(clearThreadState(context, threadId)).rejects.toThrow();
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

      await expect(clearThreadState(context, threadId)).rejects.toThrow(
        'Request timeout after 50ms'
      );
    });

    it('should work without auth token', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockClearThreadStateResponse,
      });
      global.fetch = fetchMock;

      const context = {
        baseUrl: mockBaseUrl,
        authToken: null,
        timeout: 5000,
        debug: false,
      };

      const response = await clearThreadState(context, threadId);

      expect(response).toEqual(mockClearThreadStateResponse);
      expect(fetchMock).toHaveBeenCalledWith(
        `${mockBaseUrl}/v1/threads/${threadId}/state`,
        expect.objectContaining({
          method: 'DELETE',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            accept: 'application/json',
          }),
        })
      );
      // Verify Authorization header is not present
      const callArgs = fetchMock.mock.calls[0][1];
      expect(callArgs.headers['Authorization']).toBeUndefined();
    });

    it('should log debug messages when debug is enabled', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockClearThreadStateResponse,
      });
      global.fetch = fetchMock;
      const debugSpy = vi.spyOn(console, 'debug');
      const infoSpy = vi.spyOn(console, 'info');

      const context = {
        baseUrl: mockBaseUrl,
        authToken: 'test-token',
        timeout: 5000,
        debug: true,
      };

      await clearThreadState(context, threadId);

      expect(debugSpy).toHaveBeenCalledWith(
        `TenxGraphClient: Clearing thread state for thread ${threadId}`
      );
      expect(infoSpy).toHaveBeenCalledWith(
        `TenxGraphClient: Thread state cleared successfully for thread ${threadId}`,
        mockClearThreadStateResponse
      );

      debugSpy.mockRestore();
      infoSpy.mockRestore();
    });

    it('should handle server errors (500)', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
      });
      global.fetch = fetchMock;

      const context = {
        baseUrl: mockBaseUrl,
        authToken: 'test-token',
        timeout: 5000,
        debug: false,
      };

      await expect(clearThreadState(context, threadId)).rejects.toThrow();
    });
  });

  describe('TenxGraphClient.clearThreadState', () => {
    it('should call clearThreadState endpoint with correct parameters', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockClearThreadStateResponse,
      });
      global.fetch = fetchMock;

      const client = new TenxGraphClient({
        baseUrl: mockBaseUrl,
        authToken: 'test-token',
        timeout: 5000,
        debug: false,
      });

      const response = await client.clearThreadState(threadId);

      expect(response).toEqual(mockClearThreadStateResponse);
      expect(response.data.success).toBe(true);
      expect(response.data.message).toBe('State cleared successfully');
    });

    it('should pass debug flag to endpoint', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockClearThreadStateResponse,
      });
      global.fetch = fetchMock;
      const debugSpy = vi.spyOn(console, 'debug');

      const client = new TenxGraphClient({
        baseUrl: mockBaseUrl,
        authToken: 'test-token',
        timeout: 5000,
        debug: true,
      });

      await client.clearThreadState(threadId);

      expect(debugSpy).toHaveBeenCalled();
      debugSpy.mockRestore();
    });
  });
});
