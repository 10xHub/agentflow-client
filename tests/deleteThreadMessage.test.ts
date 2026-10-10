import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { deleteThreadMessage } from '../src/endpoints/deleteThreadMessage';
import type {
  DeleteThreadMessageContext,
  DeleteThreadMessageRequest,
  DeleteThreadMessageResponse,
} from '../src/endpoints/deleteThreadMessage';

// Mock fetch globally
const fetchMock = vi.fn();
global.fetch = fetchMock;

describe('Delete Thread Message Endpoint Tests', () => {
  let mockContext: DeleteThreadMessageContext;
  let mockRequest: DeleteThreadMessageRequest;

  beforeEach(() => {
    mockContext = {
      baseUrl: 'http://localhost:8000',
      authToken: 'test-token',
      timeout: 5000,
      debug: false,
    };

    mockRequest = {
      threadId: 5,
      messageId: '58788989',
      config: {},
    };

    fetchMock.mockReset();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Successful delete', () => {
    it('should return success response with correct structure', async () => {
      const mockResponse: DeleteThreadMessageResponse = {
        data: {
          success: true,
          message: 'Deleted',
          data: {},
        },
        metadata: {
          request_id: 'f2e2147709b64caca391441256666d68',
          timestamp: '2025-10-26T00:44:22.910508',
          message: 'Success',
        },
      };

      const mockFetchResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue(mockResponse),
      };
      fetchMock.mockResolvedValue(mockFetchResponse);

      const result = await deleteThreadMessage(mockContext, mockRequest);

      expect(result).toEqual(mockResponse);
      expect(result.data.success).toBe(true);
      expect(result.metadata.message).toBe('Success');
    });

    it('should call correct URL and method with headers and body', async () => {
      const mockResponse: DeleteThreadMessageResponse = {
        data: { success: true, message: 'OK', data: {} },
        metadata: { request_id: 'id', timestamp: 'ts', message: 'Success' },
      };
      const mockFetchResponse = { ok: true, json: vi.fn().mockResolvedValue(mockResponse) };
      fetchMock.mockResolvedValue(mockFetchResponse);

      await deleteThreadMessage(mockContext, mockRequest);

      const [url, options] = fetchMock.mock.calls[0];
      expect(url).toBe('http://localhost:8000/v1/threads/5/messages/58788989');
      expect(options.method).toBe('DELETE');
      expect(options.headers['Content-Type']).toBe('application/json');
      expect(options.headers['accept']).toBe('application/json');
      expect(options.headers['Authorization']).toBe('Bearer test-token');
      const body = JSON.parse(options.body);
      expect(body).toEqual({ config: {} });
    });

    it('should work with string threadId', async () => {
      const req: DeleteThreadMessageRequest = { threadId: 't-5', messageId: 'm-1', config: {} };
      const mockResponse: DeleteThreadMessageResponse = {
        data: { success: true, message: 'OK', data: {} },
        metadata: { request_id: 'id', timestamp: 'ts', message: 'Success' },
      };
      const mockFetchResponse = { ok: true, json: vi.fn().mockResolvedValue(mockResponse) };
      fetchMock.mockResolvedValue(mockFetchResponse);

      await deleteThreadMessage(mockContext, req);

      const [url] = fetchMock.mock.calls[0];
      expect(url).toBe('http://localhost:8000/v1/threads/t-5/messages/m-1');
    });

    it('should omit Authorization header when no token', async () => {
      const ctx: DeleteThreadMessageContext = { ...mockContext, authToken: null };
      const mockResponse: DeleteThreadMessageResponse = {
        data: { success: true, message: 'OK', data: {} },
        metadata: { request_id: 'id', timestamp: 'ts', message: 'Success' },
      };
      const mockFetchResponse = { ok: true, json: vi.fn().mockResolvedValue(mockResponse) };
      fetchMock.mockResolvedValue(mockFetchResponse);

      await deleteThreadMessage(ctx, mockRequest);

      const [, options] = fetchMock.mock.calls[0];
      expect(options.headers['Authorization']).toBeUndefined();
    });
  });

  describe('Error handling', () => {
    it('should throw on 404', async () => {
      const mockFetchResponse = { ok: false, status: 404 };
      fetchMock.mockResolvedValue(mockFetchResponse);
      await expect(deleteThreadMessage(mockContext, mockRequest)).rejects.toThrow();
    });

    it('should throw on 500', async () => {
      const mockFetchResponse = { ok: false, status: 500 };
      fetchMock.mockResolvedValue(mockFetchResponse);
      await expect(deleteThreadMessage(mockContext, mockRequest)).rejects.toThrow();
    });

    it('should throw on 401', async () => {
      const mockFetchResponse = { ok: false, status: 401 };
      fetchMock.mockResolvedValue(mockFetchResponse);
      await expect(deleteThreadMessage(mockContext, mockRequest)).rejects.toThrow();
    });

    it('should timeout', async () => {
      const slowContext = { ...mockContext, timeout: 50 };
      fetchMock.mockImplementation(
        () =>
          new Promise((_, reject) => {
            setTimeout(() => reject(new DOMException('AbortError', 'AbortError')), 100);
          })
      );
      await expect(deleteThreadMessage(slowContext, mockRequest)).rejects.toThrow(
        'Request timeout after 50ms'
      );
    });

    it('should handle network error', async () => {
      fetchMock.mockRejectedValue(new Error('Network error'));
      await expect(deleteThreadMessage(mockContext, mockRequest)).rejects.toThrow('Network error');
    });
  });

  describe('Debug logging', () => {
    it('should log when debug is true', async () => {
      const ctx = { ...mockContext, debug: true };
      const debugSpy = vi.spyOn(console, 'debug');
      const infoSpy = vi.spyOn(console, 'info');

      const mockResponse: DeleteThreadMessageResponse = {
        data: { success: true, message: 'OK', data: {} },
        metadata: { request_id: 'id', timestamp: 'ts', message: 'Success' },
      };
      const mockFetchResponse = { ok: true, json: vi.fn().mockResolvedValue(mockResponse) };
      fetchMock.mockResolvedValue(mockFetchResponse);

      await deleteThreadMessage(ctx, mockRequest);

      expect(debugSpy).toHaveBeenCalled();
      expect(infoSpy).toHaveBeenCalledWith(
        'TenxGraphClient: Thread message deleted successfully',
        mockResponse
      );
    });
  });
});
