import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { deleteMemory } from '../src/endpoints/deleteMemory';
import type {
  DeleteMemoryContext,
  DeleteMemoryRequest,
  DeleteMemoryResponse,
} from '../src/endpoints/deleteMemory';

// Mock fetch globally
const fetchMock = vi.fn();
global.fetch = fetchMock;

describe('Delete Memory Endpoint Tests', () => {
  let mockContext: DeleteMemoryContext;
  let mockRequest: DeleteMemoryRequest;

  beforeEach(() => {
    mockContext = {
      baseUrl: 'http://localhost:8000',
      authToken: 'test-token',
      timeout: 5000,
      debug: false,
    };

    mockRequest = {
      memoryId: 'mem-12345',
      config: {},
      options: {},
    };

    // Reset mocks
    fetchMock.mockReset();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Successful delete memory', () => {
    it('should return success response with correct structure', async () => {
      const mockResponse: DeleteMemoryResponse = {
        data: {
          success: true,
          data: 'Memory deleted successfully',
        },
        metadata: {
          request_id: '50009c49f05241938ce738a2199cd38a',
          timestamp: '2025-10-26T12:51:13.040424',
          message: 'Success',
        },
      };

      const mockFetchResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue(mockResponse),
      };
      fetchMock.mockResolvedValue(mockFetchResponse);

      const result = await deleteMemory(mockContext, mockRequest);

      expect(result).toEqual(mockResponse);
      expect(result.data.success).toBe(true);
      expect(result.data.data).toBe('Memory deleted successfully');
    });

    it('should construct correct URL with memory ID', async () => {
      const mockResponse: DeleteMemoryResponse = {
        data: {
          success: true,
          data: 'Deleted',
        },
        metadata: {
          request_id: 'test-id',
          timestamp: '2025-10-26T12:51:13.040424',
          message: 'Success',
        },
      };

      const mockFetchResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue(mockResponse),
      };
      fetchMock.mockResolvedValue(mockFetchResponse);

      await deleteMemory(mockContext, mockRequest);

      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:8000/v1/store/memories/mem-12345',
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });

    it('should send DELETE request with correct headers', async () => {
      const mockResponse: DeleteMemoryResponse = {
        data: {
          success: true,
          data: 'Deleted',
        },
        metadata: {
          request_id: 'test-id',
          timestamp: '2025-10-26T12:51:13.040424',
          message: 'Success',
        },
      };

      const mockFetchResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue(mockResponse),
      };
      fetchMock.mockResolvedValue(mockFetchResponse);

      await deleteMemory(mockContext, mockRequest);

      expect(fetchMock).toHaveBeenCalledWith(
        expect.any(String),
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

    it('should include config and options in request body', async () => {
      const mockResponse: DeleteMemoryResponse = {
        data: {
          success: true,
          data: 'Deleted',
        },
        metadata: {
          request_id: 'test-id',
          timestamp: '2025-10-26T12:51:13.040424',
          message: 'Success',
        },
      };

      const mockFetchResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue(mockResponse),
      };
      fetchMock.mockResolvedValue(mockFetchResponse);

      mockRequest.config = { soft_delete: true };
      mockRequest.options = { cascade: false };

      await deleteMemory(mockContext, mockRequest);

      const callArgs = fetchMock.mock.calls[0];
      const body = JSON.parse(callArgs[1].body);

      expect(body.config).toEqual({ soft_delete: true });
      expect(body.options).toEqual({ cascade: false });
    });

    it('should work without optional fields', async () => {
      const mockResponse: DeleteMemoryResponse = {
        data: {
          success: true,
          data: 'Deleted',
        },
        metadata: {
          request_id: 'test-id',
          timestamp: '2025-10-26T12:51:13.040424',
          message: 'Success',
        },
      };

      const mockFetchResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue(mockResponse),
      };
      fetchMock.mockResolvedValue(mockFetchResponse);

      const minimalRequest: DeleteMemoryRequest = {
        memoryId: 'mem-99999',
      };

      const result = await deleteMemory(mockContext, minimalRequest);

      expect(result.data.success).toBe(true);

      const callArgs = fetchMock.mock.calls[0];
      const body = JSON.parse(callArgs[1].body);

      expect(body.config).toEqual({});
      expect(body.options).toEqual({});
    });

    it('should work without auth token', async () => {
      const mockResponse: DeleteMemoryResponse = {
        data: {
          success: true,
          data: 'Deleted',
        },
        metadata: {
          request_id: 'test-id',
          timestamp: '2025-10-26T12:51:13.040424',
          message: 'Success',
        },
      };

      const mockFetchResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue(mockResponse),
      };
      fetchMock.mockResolvedValue(mockFetchResponse);

      mockContext.authToken = null;

      await deleteMemory(mockContext, mockRequest);

      const callArgs = fetchMock.mock.calls[0];
      const headers = callArgs[1].headers;

      expect(headers.Authorization).toBeUndefined();
    });

    it('should handle different memory ID formats', async () => {
      const mockResponse: DeleteMemoryResponse = {
        data: {
          success: true,
          data: 'Deleted',
        },
        metadata: {
          request_id: 'test-id',
          timestamp: '2025-10-26T12:51:13.040424',
          message: 'Success',
        },
      };

      const mockFetchResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue(mockResponse),
      };
      fetchMock.mockResolvedValue(mockFetchResponse);

      const testIds = [
        'mem-abc123',
        'uuid-12345678-1234-1234-1234-123456789abc',
        'memory_123',
        '12345',
      ];

      for (const memoryId of testIds) {
        fetchMock.mockClear();
        mockRequest.memoryId = memoryId;

        await deleteMemory(mockContext, mockRequest);

        expect(fetchMock).toHaveBeenCalledWith(
          `http://localhost:8000/v1/store/memories/${memoryId}`,
          expect.any(Object)
        );
      }
    });
  });

  describe('Error handling', () => {
    it('should throw error on 404 not found', async () => {
      const mockFetchResponse = {
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: vi.fn().mockResolvedValue({
          error: {
            code: 'RESOURCE_NOT_FOUND',
            message: 'Memory not found',
          },
        }),
      };
      fetchMock.mockResolvedValue(mockFetchResponse);

      await expect(deleteMemory(mockContext, mockRequest)).rejects.toThrow();
    });

    it('should throw error on 400 bad request', async () => {
      const mockFetchResponse = {
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: vi.fn().mockResolvedValue({
          error: {
            code: 'INVALID_REQUEST',
            message: 'Invalid memory ID',
          },
        }),
      };
      fetchMock.mockResolvedValue(mockFetchResponse);

      await expect(deleteMemory(mockContext, mockRequest)).rejects.toThrow();
    });

    it('should throw error on 500 status', async () => {
      const mockFetchResponse = {
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: vi.fn().mockResolvedValue({
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Server error',
          },
        }),
      };
      fetchMock.mockResolvedValue(mockFetchResponse);

      await expect(deleteMemory(mockContext, mockRequest)).rejects.toThrow();
    });

    it('should throw error on 401 unauthorized', async () => {
      const mockFetchResponse = {
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: vi.fn().mockResolvedValue({
          error: {
            code: 'UNAUTHORIZED',
            message: 'Invalid credentials',
          },
        }),
      };
      fetchMock.mockResolvedValue(mockFetchResponse);

      await expect(deleteMemory(mockContext, mockRequest)).rejects.toThrow();
    });

    it('should throw error on 403 forbidden', async () => {
      const mockFetchResponse = {
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        json: vi.fn().mockResolvedValue({
          error: {
            code: 'FORBIDDEN',
            message: 'Access denied',
          },
        }),
      };
      fetchMock.mockResolvedValue(mockFetchResponse);

      await expect(deleteMemory(mockContext, mockRequest)).rejects.toThrow();
    });

    it('should handle timeout', async () => {
      mockContext.timeout = 50; // Short timeout

      fetchMock.mockImplementation(
        () =>
          new Promise((_, reject) => {
            setTimeout(() => reject(new DOMException('AbortError', 'AbortError')), 100);
          })
      );

      await expect(deleteMemory(mockContext, mockRequest)).rejects.toThrow(
        'Request timeout after 50ms'
      );
    });

    it('should handle network errors', async () => {
      fetchMock.mockRejectedValue(new Error('Network connection failed'));

      await expect(deleteMemory(mockContext, mockRequest)).rejects.toThrow(
        'Network connection failed'
      );
    });

    it('should log errors when debug is enabled', async () => {
      const consoleDebugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
      mockContext.debug = true;

      fetchMock.mockRejectedValue(new Error('Test error'));

      await expect(deleteMemory(mockContext, mockRequest)).rejects.toThrow();

      expect(consoleDebugSpy).toHaveBeenCalledWith(
        'TenxGraphClient: Delete memory failed:',
        expect.any(Error)
      );

      consoleDebugSpy.mockRestore();
    });
  });

  describe('Debug logging', () => {
    it('should log when debug is enabled', async () => {
      const consoleDebugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
      const consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

      mockContext.debug = true;

      const mockResponse: DeleteMemoryResponse = {
        data: {
          success: true,
          data: 'Deleted',
        },
        metadata: {
          request_id: 'test-id',
          timestamp: '2025-10-26T12:51:13.040424',
          message: 'Success',
        },
      };

      const mockFetchResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue(mockResponse),
      };
      fetchMock.mockResolvedValue(mockFetchResponse);

      await deleteMemory(mockContext, mockRequest);

      expect(consoleDebugSpy).toHaveBeenCalledWith(
        'TenxGraphClient: Deleting memory with ID:',
        'mem-12345'
      );

      expect(consoleInfoSpy).toHaveBeenCalled();

      consoleDebugSpy.mockRestore();
      consoleInfoSpy.mockRestore();
    });

    it('should log request payload when debug is enabled', async () => {
      const consoleDebugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
      mockContext.debug = true;

      const mockResponse: DeleteMemoryResponse = {
        data: {
          success: true,
          data: 'Deleted',
        },
        metadata: {
          request_id: 'test-id',
          timestamp: '2025-10-26T12:51:13.040424',
          message: 'Success',
        },
      };

      const mockFetchResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue(mockResponse),
      };
      fetchMock.mockResolvedValue(mockFetchResponse);

      mockRequest.config = { soft_delete: true };
      mockRequest.options = { cascade: false };

      await deleteMemory(mockContext, mockRequest);

      expect(consoleDebugSpy).toHaveBeenCalledWith(
        'TenxGraphClient: Delete request payload:',
        expect.stringContaining('soft_delete')
      );

      consoleDebugSpy.mockRestore();
    });

    it('should not log when debug is disabled', async () => {
      const consoleDebugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
      mockContext.debug = false;

      const mockResponse: DeleteMemoryResponse = {
        data: {
          success: true,
          data: 'Deleted',
        },
        metadata: {
          request_id: 'test-id',
          timestamp: '2025-10-26T12:51:13.040424',
          message: 'Success',
        },
      };

      const mockFetchResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue(mockResponse),
      };
      fetchMock.mockResolvedValue(mockFetchResponse);

      await deleteMemory(mockContext, mockRequest);

      expect(consoleDebugSpy).not.toHaveBeenCalled();

      consoleDebugSpy.mockRestore();
    });
  });

  describe('Integration with TenxGraphClient', () => {
    it('should properly integrate with client context', async () => {
      const mockResponse: DeleteMemoryResponse = {
        data: {
          success: true,
          data: 'Deleted',
        },
        metadata: {
          request_id: 'test-id',
          timestamp: '2025-10-26T12:51:13.040424',
          message: 'Success',
        },
      };

      const mockFetchResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue(mockResponse),
      };
      fetchMock.mockResolvedValue(mockFetchResponse);

      const result = await deleteMemory(mockContext, mockRequest);

      expect(result).toBeDefined();
      expect(result.data).toBeDefined();
      expect(result.metadata).toBeDefined();
      expect(result.data.success).toBe(true);
    });
  });
});
