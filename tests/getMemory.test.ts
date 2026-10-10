import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getMemory } from '../src/endpoints/getMemory';
import type {
  GetMemoryContext,
  GetMemoryRequest,
  GetMemoryResponse,
} from '../src/endpoints/getMemory';

// Mock fetch globally
const fetchMock = vi.fn();
global.fetch = fetchMock;

describe('Get Memory Endpoint Tests', () => {
  let mockContext: GetMemoryContext;
  let mockRequest: GetMemoryRequest;

  beforeEach(() => {
    mockContext = {
      baseUrl: 'http://localhost:8000',
      authToken: 'test-token',
      timeout: 5000,
      debug: false,
    };

    mockRequest = {
      memoryId: '56565',
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

  describe('Successful get memory', () => {
    it('should return memory with correct structure', async () => {
      const mockResponse: GetMemoryResponse = {
        data: {
          memory: {
            id: '56565',
            content: 'User prefers dark mode',
            score: 0.95,
            memory_type: 'semantic',
            metadata: { source: 'user_settings' },
            vector: [0.1, 0.2, 0.3],
            user_id: 'user-1',
            thread_id: 'thread-1',
            timestamp: '2025-10-26T07:05:48.277Z',
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

      const result = await getMemory(mockContext, mockRequest);

      expect(result).toEqual(mockResponse);
      expect(result.data.memory.id).toBe('56565');
      expect(result.data.memory.content).toBe('User prefers dark mode');
    });

    it('should construct correct URL with memory ID', async () => {
      const mockResponse: GetMemoryResponse = {
        data: {
          memory: {
            id: '56565',
            content: 'Test content',
            score: 0.9,
            memory_type: 'semantic',
            metadata: {},
            vector: [],
            user_id: 'user-1',
            thread_id: 'thread-1',
            timestamp: '2025-10-26T07:05:48.277Z',
          },
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

      await getMemory(mockContext, mockRequest);

      const callArgs = fetchMock.mock.calls[0];
      const url = callArgs[0];

      expect(url).toBe('http://localhost:8000/v1/store/memories/56565');
    });

    it('should send POST request with correct headers', async () => {
      const mockResponse: GetMemoryResponse = {
        data: {
          memory: {
            id: '56565',
            content: 'Test',
            score: 0,
            memory_type: 'semantic',
            metadata: {},
            vector: [],
            user_id: '',
            thread_id: '',
            timestamp: '2025-10-26T07:05:48.277Z',
          },
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

      await getMemory(mockContext, mockRequest);

      const callArgs = fetchMock.mock.calls[0];
      const options = callArgs[1];

      expect(options.method).toBe('POST');
      expect(options.headers).toEqual({
        'Content-Type': 'application/json',
        Authorization: 'Bearer test-token',
      });
    });

    it('should send correct request body', async () => {
      const mockResponse: GetMemoryResponse = {
        data: {
          memory: {
            id: '56565',
            content: 'Test',
            score: 0,
            memory_type: 'semantic',
            metadata: {},
            vector: [],
            user_id: '',
            thread_id: '',
            timestamp: '2025-10-26T07:05:48.277Z',
          },
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

      await getMemory(mockContext, mockRequest);

      const callArgs = fetchMock.mock.calls[0];
      const options = callArgs[1];
      const body = JSON.parse(options.body);

      expect(body).toEqual({
        config: {},
        options: {},
      });
    });

    it('should work without auth token', async () => {
      const contextWithoutAuth = { ...mockContext, authToken: undefined };

      const mockResponse: GetMemoryResponse = {
        data: {
          memory: {
            id: '56565',
            content: 'Test',
            score: 0,
            memory_type: 'semantic',
            metadata: {},
            vector: [],
            user_id: '',
            thread_id: '',
            timestamp: '2025-10-26T07:05:48.277Z',
          },
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

      const result = await getMemory(contextWithoutAuth, mockRequest);

      expect(result).toEqual(mockResponse);

      const callArgs = fetchMock.mock.calls[0];
      const options = callArgs[1];

      expect(options.headers).toEqual({
        'Content-Type': 'application/json',
      });
    });

    it('should work with null auth token', async () => {
      const contextWithNullAuth = { ...mockContext, authToken: null };

      const mockResponse: GetMemoryResponse = {
        data: {
          memory: {
            id: '56565',
            content: 'Test',
            score: 0,
            memory_type: 'semantic',
            metadata: {},
            vector: [],
            user_id: '',
            thread_id: '',
            timestamp: '2025-10-26T07:05:48.277Z',
          },
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

      const result = await getMemory(contextWithNullAuth, mockRequest);

      expect(result).toEqual(mockResponse);
    });
  });

  describe('Different memory types', () => {
    it('should retrieve episodic memory', async () => {
      const mockResponse: GetMemoryResponse = {
        data: {
          memory: {
            id: 'mem-episodic-1',
            content: 'User asked about Python async/await',
            score: 0.88,
            memory_type: 'episodic',
            metadata: { timestamp: '2025-10-26T12:00:00' },
            vector: [0.1, 0.2],
            user_id: 'user-1',
            thread_id: 'thread-1',
            timestamp: '2025-10-26T07:05:48.277Z',
          },
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

      const result = await getMemory(mockContext, { memoryId: 'mem-episodic-1' });

      expect(result.data.memory.memory_type).toBe('episodic');
      expect(result.data.memory.id).toBe('mem-episodic-1');
    });

    it('should retrieve procedural memory', async () => {
      const mockResponse: GetMemoryResponse = {
        data: {
          memory: {
            id: 'mem-procedural-1',
            content: 'Steps to deploy a React app',
            score: 0.92,
            memory_type: 'procedural',
            metadata: {},
            vector: [],
            user_id: 'user-1',
            thread_id: 'thread-1',
            timestamp: '2025-10-26T07:05:48.277Z',
          },
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

      const result = await getMemory(mockContext, { memoryId: 'mem-procedural-1' });

      expect(result.data.memory.memory_type).toBe('procedural');
    });

    it('should retrieve entity memory', async () => {
      const mockResponse: GetMemoryResponse = {
        data: {
          memory: {
            id: 'mem-entity-1',
            content: 'John Doe is a software engineer',
            score: 0.85,
            memory_type: 'entity',
            metadata: { entity_type: 'person' },
            vector: [],
            user_id: 'user-1',
            thread_id: 'thread-1',
            timestamp: '2025-10-26T07:05:48.277Z',
          },
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

      const result = await getMemory(mockContext, { memoryId: 'mem-entity-1' });

      expect(result.data.memory.memory_type).toBe('entity');
    });

    it('should retrieve relationship memory', async () => {
      const mockResponse: GetMemoryResponse = {
        data: {
          memory: {
            id: 'mem-relationship-1',
            content: 'Alice is friends with Bob',
            score: 0.78,
            memory_type: 'relationship',
            metadata: {},
            vector: [],
            user_id: 'user-1',
            thread_id: 'thread-1',
            timestamp: '2025-10-26T07:05:48.277Z',
          },
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

      const result = await getMemory(mockContext, { memoryId: 'mem-relationship-1' });

      expect(result.data.memory.memory_type).toBe('relationship');
    });

    it('should retrieve declarative memory', async () => {
      const mockResponse: GetMemoryResponse = {
        data: {
          memory: {
            id: 'mem-declarative-1',
            content: 'The capital of France is Paris',
            score: 1.0,
            memory_type: 'declarative',
            metadata: { verified: true },
            vector: [],
            user_id: 'user-1',
            thread_id: 'thread-1',
            timestamp: '2025-10-26T07:05:48.277Z',
          },
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

      const result = await getMemory(mockContext, { memoryId: 'mem-declarative-1' });

      expect(result.data.memory.memory_type).toBe('declarative');
    });
  });

  describe('Different memory IDs', () => {
    it('should handle numeric memory ID', async () => {
      const mockResponse: GetMemoryResponse = {
        data: {
          memory: {
            id: '12345',
            content: 'Test',
            score: 0,
            memory_type: 'semantic',
            metadata: {},
            vector: [],
            user_id: '',
            thread_id: '',
            timestamp: '2025-10-26T07:05:48.277Z',
          },
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

      await getMemory(mockContext, { memoryId: '12345' });

      const callArgs = fetchMock.mock.calls[0];
      const url = callArgs[0];

      expect(url).toBe('http://localhost:8000/v1/store/memories/12345');
    });

    it('should handle UUID memory ID', async () => {
      const uuid = 'a0b1c2d3-e4f5-6789-abcd-ef0123456789';
      const mockResponse: GetMemoryResponse = {
        data: {
          memory: {
            id: uuid,
            content: 'Test',
            score: 0,
            memory_type: 'semantic',
            metadata: {},
            vector: [],
            user_id: '',
            thread_id: '',
            timestamp: '2025-10-26T07:05:48.277Z',
          },
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

      await getMemory(mockContext, { memoryId: uuid });

      const callArgs = fetchMock.mock.calls[0];
      const url = callArgs[0];

      expect(url).toBe(`http://localhost:8000/v1/store/memories/${uuid}`);
    });
  });

  describe('Config and options handling', () => {
    it('should send custom config', async () => {
      const requestWithConfig: GetMemoryRequest = {
        memoryId: '56565',
        config: { include_vector: true, format: 'detailed' },
        options: {},
      };

      const mockResponse: GetMemoryResponse = {
        data: {
          memory: {
            id: '56565',
            content: 'Test',
            score: 0,
            memory_type: 'semantic',
            metadata: {},
            vector: [0.1, 0.2, 0.3],
            user_id: '',
            thread_id: '',
            timestamp: '2025-10-26T07:05:48.277Z',
          },
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

      await getMemory(mockContext, requestWithConfig);

      const callArgs = fetchMock.mock.calls[0];
      const options = callArgs[1];
      const body = JSON.parse(options.body);

      expect(body.config).toEqual({ include_vector: true, format: 'detailed' });
    });

    it('should send custom options', async () => {
      const requestWithOptions: GetMemoryRequest = {
        memoryId: '56565',
        config: {},
        options: { cache: true, timeout: 1000 },
      };

      const mockResponse: GetMemoryResponse = {
        data: {
          memory: {
            id: '56565',
            content: 'Test',
            score: 0,
            memory_type: 'semantic',
            metadata: {},
            vector: [],
            user_id: '',
            thread_id: '',
            timestamp: '2025-10-26T07:05:48.277Z',
          },
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

      await getMemory(mockContext, requestWithOptions);

      const callArgs = fetchMock.mock.calls[0];
      const options = callArgs[1];
      const body = JSON.parse(options.body);

      expect(body.options).toEqual({ cache: true, timeout: 1000 });
    });
  });

  describe('Error handling', () => {
    it('should throw error on 404 not found', async () => {
      const mockErrorResponse = {
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: vi.fn().mockResolvedValue({
          detail: 'Memory not found',
        }),
      };
      fetchMock.mockResolvedValue(mockErrorResponse);

      await expect(getMemory(mockContext, mockRequest)).rejects.toThrow();
    });

    it('should throw error on 400 bad request', async () => {
      const mockErrorResponse = {
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: vi.fn().mockResolvedValue({
          detail: 'Invalid memory ID',
        }),
      };
      fetchMock.mockResolvedValue(mockErrorResponse);

      await expect(getMemory(mockContext, mockRequest)).rejects.toThrow();
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

      await expect(getMemory(mockContext, mockRequest)).rejects.toThrow();
    });

    it('should handle network errors', async () => {
      fetchMock.mockRejectedValue(new Error('Network error'));

      await expect(getMemory(mockContext, mockRequest)).rejects.toThrow('Network error');
    });

    it('should handle timeout', async () => {
      const timeoutContext = { ...mockContext, timeout: 100 };

      fetchMock.mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 1000)));

      await expect(getMemory(timeoutContext, mockRequest)).rejects.toThrow();
    });
  });

  describe('Debug logging', () => {
    it('should log debug messages when debug is enabled', async () => {
      const debugContext = { ...mockContext, debug: true };
      const consoleDebugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
      const consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

      const mockResponse: GetMemoryResponse = {
        data: {
          memory: {
            id: '56565',
            content: 'User prefers dark mode for all interfaces',
            score: 0.95,
            memory_type: 'semantic',
            metadata: {},
            vector: [],
            user_id: 'user-1',
            thread_id: 'thread-1',
            timestamp: '2025-10-26T07:05:48.277Z',
          },
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

      await getMemory(debugContext, mockRequest);

      expect(consoleDebugSpy).toHaveBeenCalledWith(
        'TenxGraphClient: Fetching memory with ID:',
        '56565'
      );
      expect(consoleInfoSpy).toHaveBeenCalledWith('TenxGraphClient: Memory fetched successfully', {
        memory_id: '56565',
        content: 'User prefers dark mode for all interfaces',
      });

      consoleDebugSpy.mockRestore();
      consoleInfoSpy.mockRestore();
    });

    it('should log debug error messages when debug is enabled and request fails', async () => {
      const debugContext = { ...mockContext, debug: true };
      const consoleDebugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});

      fetchMock.mockRejectedValue(new Error('Network error'));

      await expect(getMemory(debugContext, mockRequest)).rejects.toThrow();

      expect(consoleDebugSpy).toHaveBeenCalledWith(
        'TenxGraphClient: Get memory failed:',
        expect.any(Error)
      );

      consoleDebugSpy.mockRestore();
    });
  });

  describe('Response data validation', () => {
    it('should return complete memory object with all fields', async () => {
      const mockResponse: GetMemoryResponse = {
        data: {
          memory: {
            id: '56565',
            content: 'Complete memory data',
            score: 0.98,
            memory_type: 'semantic',
            metadata: {
              source: 'test',
              tags: ['important', 'verified'],
            },
            vector: [0.1, 0.2, 0.3, 0.4, 0.5],
            user_id: 'user-123',
            thread_id: 'thread-456',
            timestamp: '2025-10-26T07:05:48.277Z',
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

      const result = await getMemory(mockContext, mockRequest);

      expect(result.data.memory).toHaveProperty('id');
      expect(result.data.memory).toHaveProperty('content');
      expect(result.data.memory).toHaveProperty('score');
      expect(result.data.memory).toHaveProperty('memory_type');
      expect(result.data.memory).toHaveProperty('metadata');
      expect(result.data.memory).toHaveProperty('vector');
      expect(result.data.memory).toHaveProperty('user_id');
      expect(result.data.memory).toHaveProperty('thread_id');
      expect(result.data.memory).toHaveProperty('timestamp');
    });
  });
});
