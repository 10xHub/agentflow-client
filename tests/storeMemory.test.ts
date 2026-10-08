import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { storeMemory } from '../src/endpoints/storeMemory';
import type {
  StoreMemoryContext,
  StoreMemoryRequest,
  StoreMemoryResponse,
} from '../src/endpoints/storeMemory';
import { MemoryType } from '../src/endpoints/storeMemory';

// Mock fetch globally
const fetchMock = vi.fn();
global.fetch = fetchMock;

describe('Store Memory Endpoint Tests', () => {
  let mockContext: StoreMemoryContext;
  let mockRequest: StoreMemoryRequest;

  beforeEach(() => {
    mockContext = {
      baseUrl: 'http://localhost:8000',
      authToken: 'test-token',
      timeout: 5000,
      debug: false,
    };

    mockRequest = {
      config: {},
      options: {},
      content: 'User prefers dark mode',
      memory_type: MemoryType.SEMANTIC,
      category: 'preferences',
      metadata: { source: 'user_settings' },
    };

    // Reset mocks
    fetchMock.mockReset();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Successful store memory', () => {
    it('should return success response with memory_id', async () => {
      const mockResponse: StoreMemoryResponse = {
        data: {
          memory_id: 'mem-12345',
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

      const result = await storeMemory(mockContext, mockRequest);

      expect(result).toEqual(mockResponse);
      expect(result.data.memory_id).toBe('mem-12345');
      expect(result.metadata.request_id).toBe('e0c023e6066742b8bba8ad7990608018');
    });

    it('should construct correct URL', async () => {
      const mockResponse: StoreMemoryResponse = {
        data: {
          memory_id: 'mem-12345',
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

      await storeMemory(mockContext, mockRequest);

      const callArgs = fetchMock.mock.calls[0];
      const url = callArgs[0];

      expect(url).toBe('http://localhost:8000/v1/store/memories');
    });

    it('should send POST request with correct headers', async () => {
      const mockResponse: StoreMemoryResponse = {
        data: {
          memory_id: 'mem-12345',
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

      await storeMemory(mockContext, mockRequest);

      const callArgs = fetchMock.mock.calls[0];
      const options = callArgs[1];

      expect(options.method).toBe('POST');
      expect(options.headers).toEqual({
        'Content-Type': 'application/json',
        Authorization: 'Bearer test-token',
      });
    });

    it('should send correct request body', async () => {
      const mockResponse: StoreMemoryResponse = {
        data: {
          memory_id: 'mem-12345',
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

      await storeMemory(mockContext, mockRequest);

      const callArgs = fetchMock.mock.calls[0];
      const options = callArgs[1];
      const body = JSON.parse(options.body);

      expect(body).toEqual({
        config: {},
        options: {},
        content: 'User prefers dark mode',
        memory_type: 'semantic',
        category: 'preferences',
        metadata: { source: 'user_settings' },
      });
    });

    it('should work without auth token', async () => {
      const contextWithoutAuth = { ...mockContext, authToken: undefined };

      const mockResponse: StoreMemoryResponse = {
        data: {
          memory_id: 'mem-12345',
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

      const result = await storeMemory(contextWithoutAuth, mockRequest);

      expect(result).toEqual(mockResponse);

      const callArgs = fetchMock.mock.calls[0];
      const options = callArgs[1];

      expect(options.headers).toEqual({
        'Content-Type': 'application/json',
      });
    });

    it('should work with null auth token', async () => {
      const contextWithNullAuth = { ...mockContext, authToken: null };

      const mockResponse: StoreMemoryResponse = {
        data: {
          memory_id: 'mem-12345',
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

      const result = await storeMemory(contextWithNullAuth, mockRequest);

      expect(result).toEqual(mockResponse);
    });
  });

  describe('Different memory types', () => {
    it('should handle episodic memory type', async () => {
      const episodicRequest: StoreMemoryRequest = {
        content: 'User asked about Python async/await',
        memory_type: MemoryType.EPISODIC,
        category: 'conversation',
        metadata: { timestamp: '2025-10-26T12:00:00' },
      };

      const mockResponse: StoreMemoryResponse = {
        data: {
          memory_id: 'mem-episodic-1',
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

      const result = await storeMemory(mockContext, episodicRequest);

      expect(result.data.memory_id).toBe('mem-episodic-1');
    });

    it('should handle procedural memory type', async () => {
      const proceduralRequest: StoreMemoryRequest = {
        content: 'Steps to deploy a React app',
        memory_type: MemoryType.PROCEDURAL,
        category: 'how-to',
        metadata: {},
      };

      const mockResponse: StoreMemoryResponse = {
        data: {
          memory_id: 'mem-procedural-1',
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

      const result = await storeMemory(mockContext, proceduralRequest);

      expect(result.data.memory_id).toBe('mem-procedural-1');
    });

    it('should handle entity memory type', async () => {
      const entityRequest: StoreMemoryRequest = {
        content: 'John Doe is a software engineer',
        memory_type: MemoryType.ENTITY,
        category: 'people',
        metadata: {},
      };

      const mockResponse: StoreMemoryResponse = {
        data: {
          memory_id: 'mem-entity-1',
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

      const result = await storeMemory(mockContext, entityRequest);

      expect(result.data.memory_id).toBe('mem-entity-1');
    });

    it('should handle relationship memory type', async () => {
      const relationshipRequest: StoreMemoryRequest = {
        content: 'Alice is friends with Bob',
        memory_type: MemoryType.RELATIONSHIP,
        category: 'social',
        metadata: {},
      };

      const mockResponse: StoreMemoryResponse = {
        data: {
          memory_id: 'mem-relationship-1',
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

      const result = await storeMemory(mockContext, relationshipRequest);

      expect(result.data.memory_id).toBe('mem-relationship-1');
    });

    it('should handle custom memory type', async () => {
      const customRequest: StoreMemoryRequest = {
        content: 'Custom memory data',
        memory_type: MemoryType.CUSTOM,
        category: 'custom_category',
        metadata: {},
      };

      const mockResponse: StoreMemoryResponse = {
        data: {
          memory_id: 'mem-custom-1',
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

      const result = await storeMemory(mockContext, customRequest);

      expect(result.data.memory_id).toBe('mem-custom-1');
    });

    it('should handle declarative memory type', async () => {
      const declarativeRequest: StoreMemoryRequest = {
        content: 'The capital of France is Paris',
        memory_type: MemoryType.DECLARATIVE,
        category: 'facts',
        metadata: {},
      };

      const mockResponse: StoreMemoryResponse = {
        data: {
          memory_id: 'mem-declarative-1',
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

      const result = await storeMemory(mockContext, declarativeRequest);

      expect(result.data.memory_id).toBe('mem-declarative-1');
    });
  });

  describe('Request body handling', () => {
    it('should provide default empty objects for optional fields', async () => {
      const minimalRequest: StoreMemoryRequest = {
        content: 'Minimal memory',
        memory_type: MemoryType.SEMANTIC,
        category: 'test',
      };

      const mockResponse: StoreMemoryResponse = {
        data: {
          memory_id: 'mem-12345',
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

      await storeMemory(mockContext, minimalRequest);

      const callArgs = fetchMock.mock.calls[0];
      const options = callArgs[1];
      const body = JSON.parse(options.body);

      expect(body.config).toEqual({});
      expect(body.options).toEqual({});
      expect(body.metadata).toEqual({});
    });

    it('should include provided config and options', async () => {
      const fullRequest: StoreMemoryRequest = {
        config: { key: 'value' },
        options: { ttl: 3600 },
        content: 'Full memory',
        memory_type: MemoryType.SEMANTIC,
        category: 'test',
        metadata: { source: 'api' },
      };

      const mockResponse: StoreMemoryResponse = {
        data: {
          memory_id: 'mem-12345',
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

      await storeMemory(mockContext, fullRequest);

      const callArgs = fetchMock.mock.calls[0];
      const options = callArgs[1];
      const body = JSON.parse(options.body);

      expect(body.config).toEqual({ key: 'value' });
      expect(body.options).toEqual({ ttl: 3600 });
      expect(body.metadata).toEqual({ source: 'api' });
    });
  });

  describe('Error handling', () => {
    it('should throw error on non-ok response', async () => {
      const mockErrorResponse = {
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: vi.fn().mockResolvedValue({
          detail: 'Invalid memory type',
        }),
      };
      fetchMock.mockResolvedValue(mockErrorResponse);

      await expect(storeMemory(mockContext, mockRequest)).rejects.toThrow();
    });

    it('should throw error on 500 status', async () => {
      const mockErrorResponse = {
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: vi.fn().mockResolvedValue({
          detail: 'Server error',
        }),
      };
      fetchMock.mockResolvedValue(mockErrorResponse);

      await expect(storeMemory(mockContext, mockRequest)).rejects.toThrow();
    });

    it('should handle network errors', async () => {
      fetchMock.mockRejectedValue(new Error('Network error'));

      await expect(storeMemory(mockContext, mockRequest)).rejects.toThrow('Network error');
    });

    it('should handle timeout', async () => {
      const timeoutContext = { ...mockContext, timeout: 100 };

      fetchMock.mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 1000)));

      await expect(storeMemory(timeoutContext, mockRequest)).rejects.toThrow();
    });
  });

  describe('Debug logging', () => {
    it('should log debug messages when debug is enabled', async () => {
      const debugContext = { ...mockContext, debug: true };
      const consoleDebugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
      const consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

      const mockResponse: StoreMemoryResponse = {
        data: {
          memory_id: 'mem-12345',
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

      await storeMemory(debugContext, mockRequest);

      expect(consoleDebugSpy).toHaveBeenCalledWith(
        'TenxGraphClient: Storing memory with type',
        MemoryType.SEMANTIC
      );
      expect(consoleInfoSpy).toHaveBeenCalledWith(
        'TenxGraphClient: Memory stored successfully',
        mockResponse
      );

      consoleDebugSpy.mockRestore();
      consoleInfoSpy.mockRestore();
    });

    it('should log debug error messages when debug is enabled and request fails', async () => {
      const debugContext = { ...mockContext, debug: true };
      const consoleDebugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});

      fetchMock.mockRejectedValue(new Error('Network error'));

      await expect(storeMemory(debugContext, mockRequest)).rejects.toThrow();

      expect(consoleDebugSpy).toHaveBeenCalledWith(
        'TenxGraphClient: Store memory failed:',
        expect.any(Error)
      );

      consoleDebugSpy.mockRestore();
    });
  });

  describe('Timeout handling', () => {
    it('should respect timeout setting', async () => {
      const shortTimeoutContext = { ...mockContext, timeout: 1000 };

      const mockResponse: StoreMemoryResponse = {
        data: {
          memory_id: 'mem-12345',
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

      await storeMemory(shortTimeoutContext, mockRequest);

      const callArgs = fetchMock.mock.calls[0];
      const options = callArgs[1];

      expect(options.signal).toBeInstanceOf(AbortSignal);
    });
  });
});
