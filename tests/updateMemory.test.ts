import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { updateMemory } from '../src/endpoints/updateMemory';
import type {
  UpdateMemoryContext,
  UpdateMemoryRequest,
  UpdateMemoryResponse,
} from '../src/endpoints/updateMemory';

// Mock fetch globally
const fetchMock = vi.fn();
global.fetch = fetchMock;

describe('Update Memory Endpoint Tests', () => {
  let mockContext: UpdateMemoryContext;
  let mockRequest: UpdateMemoryRequest;

  beforeEach(() => {
    mockContext = {
      baseUrl: 'http://localhost:8000',
      authToken: 'test-token',
      timeout: 5000,
      debug: false,
    };

    mockRequest = {
      memoryId: 'mem-12345',
      content: 'Updated memory content',
      config: {},
      options: {},
      metadata: {},
    };

    // Reset mocks
    fetchMock.mockReset();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Successful update memory', () => {
    it('should return success response with correct structure', async () => {
      const mockResponse: UpdateMemoryResponse = {
        data: {
          success: true,
          data: {
            memory_id: 'mem-12345',
            updated_at: '2025-10-26T12:05:32.986050',
          },
        },
        metadata: {
          request_id: 'e0c023e6066742b8bba8ad7990608018',
          timestamp: '2025-10-26T12:05:32.986050',
          message: 'Success',
        },
      };

      const mockFetchResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue(mockResponse),
      };
      fetchMock.mockResolvedValue(mockFetchResponse);

      const result = await updateMemory(mockContext, mockRequest);

      expect(result).toEqual(mockResponse);
      expect(result.data.success).toBe(true);
      expect(result.data.data.memory_id).toBe('mem-12345');
    });

    it('should construct correct URL with memory ID', async () => {
      const mockResponse: UpdateMemoryResponse = {
        data: {
          success: true,
          data: {},
        },
        metadata: {
          request_id: 'test-id',
          timestamp: '2025-10-26T12:05:32.986050',
          message: 'Success',
        },
      };

      const mockFetchResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue(mockResponse),
      };
      fetchMock.mockResolvedValue(mockFetchResponse);

      await updateMemory(mockContext, mockRequest);

      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:8000/v1/store/memories/mem-12345',
        expect.objectContaining({
          method: 'PUT',
        })
      );
    });

    it('should send PUT request with correct headers', async () => {
      const mockResponse: UpdateMemoryResponse = {
        data: {
          success: true,
          data: {},
        },
        metadata: {
          request_id: 'test-id',
          timestamp: '2025-10-26T12:05:32.986050',
          message: 'Success',
        },
      };

      const mockFetchResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue(mockResponse),
      };
      fetchMock.mockResolvedValue(mockFetchResponse);

      await updateMemory(mockContext, mockRequest);

      expect(fetchMock).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'PUT',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            Authorization: 'Bearer test-token',
          }),
        })
      );
    });

    it('should include content in request body', async () => {
      const mockResponse: UpdateMemoryResponse = {
        data: {
          success: true,
          data: {},
        },
        metadata: {
          request_id: 'test-id',
          timestamp: '2025-10-26T12:05:32.986050',
          message: 'Success',
        },
      };

      const mockFetchResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue(mockResponse),
      };
      fetchMock.mockResolvedValue(mockFetchResponse);

      mockRequest.content = 'New updated content';
      await updateMemory(mockContext, mockRequest);

      const callArgs = fetchMock.mock.calls[0];
      const body = JSON.parse(callArgs[1].body);

      expect(body.content).toBe('New updated content');
    });

    it('should include metadata in request body', async () => {
      const mockResponse: UpdateMemoryResponse = {
        data: {
          success: true,
          data: {},
        },
        metadata: {
          request_id: 'test-id',
          timestamp: '2025-10-26T12:05:32.986050',
          message: 'Success',
        },
      };

      const mockFetchResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue(mockResponse),
      };
      fetchMock.mockResolvedValue(mockFetchResponse);

      mockRequest.metadata = {
        tags: ['important', 'updated'],
        source: 'user_edit',
      };

      await updateMemory(mockContext, mockRequest);

      const callArgs = fetchMock.mock.calls[0];
      const body = JSON.parse(callArgs[1].body);

      expect(body.metadata).toEqual({
        tags: ['important', 'updated'],
        source: 'user_edit',
      });
    });

    it('should include config and options in request body', async () => {
      const mockResponse: UpdateMemoryResponse = {
        data: {
          success: true,
          data: {},
        },
        metadata: {
          request_id: 'test-id',
          timestamp: '2025-10-26T12:05:32.986050',
          message: 'Success',
        },
      };

      const mockFetchResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue(mockResponse),
      };
      fetchMock.mockResolvedValue(mockFetchResponse);

      mockRequest.config = { update_vector: true };
      mockRequest.options = { format: 'markdown' };

      await updateMemory(mockContext, mockRequest);

      const callArgs = fetchMock.mock.calls[0];
      const body = JSON.parse(callArgs[1].body);

      expect(body.config).toEqual({ update_vector: true });
      expect(body.options).toEqual({ format: 'markdown' });
    });

    it('should work without optional fields', async () => {
      const mockResponse: UpdateMemoryResponse = {
        data: {
          success: true,
          data: {},
        },
        metadata: {
          request_id: 'test-id',
          timestamp: '2025-10-26T12:05:32.986050',
          message: 'Success',
        },
      };

      const mockFetchResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue(mockResponse),
      };
      fetchMock.mockResolvedValue(mockFetchResponse);

      const minimalRequest: UpdateMemoryRequest = {
        memoryId: 'mem-99999',
        content: 'Minimal update',
      };

      const result = await updateMemory(mockContext, minimalRequest);

      expect(result.data.success).toBe(true);
    });

    it('should work without auth token', async () => {
      const mockResponse: UpdateMemoryResponse = {
        data: {
          success: true,
          data: {},
        },
        metadata: {
          request_id: 'test-id',
          timestamp: '2025-10-26T12:05:32.986050',
          message: 'Success',
        },
      };

      const mockFetchResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue(mockResponse),
      };
      fetchMock.mockResolvedValue(mockFetchResponse);

      mockContext.authToken = null;
      await updateMemory(mockContext, mockRequest);

      const callArgs = fetchMock.mock.calls[0];
      const headers = callArgs[1].headers;

      expect(headers['Authorization']).toBeUndefined();
    });
  });

  describe('Error handling', () => {
    it('should throw error on 404 not found', async () => {
      const mockFetchResponse = {
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: vi.fn().mockResolvedValue({
          detail: 'Memory not found',
        }),
      };
      fetchMock.mockResolvedValue(mockFetchResponse);

      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      await expect(updateMemory(mockContext, mockRequest)).rejects.toThrow();

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'TenxGraphClient: Update memory failed with HTTP 404'
      );

      consoleWarnSpy.mockRestore();
    });

    it('should throw error on 400 bad request', async () => {
      const mockFetchResponse = {
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: vi.fn().mockResolvedValue({
          detail: 'Invalid content',
        }),
      };
      fetchMock.mockResolvedValue(mockFetchResponse);

      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      await expect(updateMemory(mockContext, mockRequest)).rejects.toThrow();

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'TenxGraphClient: Update memory failed with HTTP 400'
      );

      consoleWarnSpy.mockRestore();
    });

    it('should throw error on 500 status', async () => {
      const mockFetchResponse = {
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: vi.fn().mockResolvedValue({
          detail: 'Server error',
        }),
      };
      fetchMock.mockResolvedValue(mockFetchResponse);

      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      await expect(updateMemory(mockContext, mockRequest)).rejects.toThrow();

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'TenxGraphClient: Update memory failed with HTTP 500'
      );

      consoleWarnSpy.mockRestore();
    });

    it('should handle timeout correctly', async () => {
      mockContext.timeout = 50;

      fetchMock.mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 1000)));

      await expect(updateMemory(mockContext, mockRequest)).rejects.toThrow();
    });

    it('should handle network errors', async () => {
      fetchMock.mockRejectedValue(new Error('Network connection failed'));

      const consoleDebugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});

      await expect(updateMemory(mockContext, mockRequest)).rejects.toThrow(
        'Network connection failed'
      );

      consoleDebugSpy.mockRestore();
    });
  });

  describe('Debug logging', () => {
    it('should log when debug is enabled', async () => {
      mockContext.debug = true;

      const mockResponse: UpdateMemoryResponse = {
        data: {
          success: true,
          data: {},
        },
        metadata: {
          request_id: 'test-id',
          timestamp: '2025-10-26T12:05:32.986050',
          message: 'Success',
        },
      };

      const mockFetchResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue(mockResponse),
      };
      fetchMock.mockResolvedValue(mockFetchResponse);

      const consoleDebugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
      const consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

      await updateMemory(mockContext, mockRequest);

      expect(consoleDebugSpy).toHaveBeenCalledWith(
        'TenxGraphClient: Updating memory with ID:',
        'mem-12345'
      );

      expect(consoleInfoSpy).toHaveBeenCalledWith(
        'TenxGraphClient: Memory updated successfully',
        expect.objectContaining({
          memory_id: 'mem-12345',
          success: true,
        })
      );

      consoleDebugSpy.mockRestore();
      consoleInfoSpy.mockRestore();
    });

    it('should log request payload when debug is enabled', async () => {
      mockContext.debug = true;

      const mockResponse: UpdateMemoryResponse = {
        data: {
          success: true,
          data: {},
        },
        metadata: {
          request_id: 'test-id',
          timestamp: '2025-10-26T12:05:32.986050',
          message: 'Success',
        },
      };

      const mockFetchResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue(mockResponse),
      };
      fetchMock.mockResolvedValue(mockFetchResponse);

      const consoleDebugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});

      mockRequest.metadata = { tags: ['test'] };
      await updateMemory(mockContext, mockRequest);

      expect(consoleDebugSpy).toHaveBeenCalledWith(
        'TenxGraphClient: Request payload:',
        expect.stringContaining('"content"')
      );

      consoleDebugSpy.mockRestore();
    });

    it('should log errors when debug is enabled', async () => {
      mockContext.debug = true;

      const mockFetchResponse = {
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: vi.fn().mockResolvedValue({
          detail: 'Invalid content',
        }),
      };
      fetchMock.mockResolvedValue(mockFetchResponse);

      const consoleDebugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      await expect(updateMemory(mockContext, mockRequest)).rejects.toThrow();

      expect(consoleDebugSpy).toHaveBeenCalledWith(
        'TenxGraphClient: Update memory failed:',
        expect.anything()
      );

      consoleDebugSpy.mockRestore();
      consoleWarnSpy.mockRestore();
    });

    it('should not log when debug is disabled', async () => {
      mockContext.debug = false;

      const mockResponse: UpdateMemoryResponse = {
        data: {
          success: true,
          data: {},
        },
        metadata: {
          request_id: 'test-id',
          timestamp: '2025-10-26T12:05:32.986050',
          message: 'Success',
        },
      };

      const mockFetchResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue(mockResponse),
      };
      fetchMock.mockResolvedValue(mockFetchResponse);

      const consoleDebugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
      const consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

      await updateMemory(mockContext, mockRequest);

      expect(consoleDebugSpy).not.toHaveBeenCalled();
      expect(consoleInfoSpy).not.toHaveBeenCalled();

      consoleDebugSpy.mockRestore();
      consoleInfoSpy.mockRestore();
    });
  });

  describe('TenxGraphClient.updateMemory', () => {
    it('should pass client config to context', async () => {
      const { TenxGraphClient } = await import('../src/client');

      const client = new TenxGraphClient({
        baseUrl: 'http://localhost:8000',
        authToken: 'client-token',
        timeout: 10000,
        debug: true,
      });

      const mockResponse: UpdateMemoryResponse = {
        data: {
          success: true,
          data: {},
        },
        metadata: {
          request_id: 'test-id',
          timestamp: '2025-10-26T12:05:32.986050',
          message: 'Success',
        },
      };

      const mockFetchResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue(mockResponse),
      };
      fetchMock.mockResolvedValue(mockFetchResponse);

      const consoleDebugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
      const consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

      await client.updateMemory('mem-12345', 'Updated content', {
        metadata: { tags: ['important'] },
      });

      // Verify debug logging was enabled (from context.debug = true)
      expect(consoleDebugSpy).toHaveBeenCalled();

      consoleDebugSpy.mockRestore();
      consoleInfoSpy.mockRestore();
    });
  });
});
