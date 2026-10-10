import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { checkpointMessages } from '../src/endpoints/threadMessages';
import type {
  ThreadMessagesContext,
  ThreadMessagesRequest,
  ThreadMessagesResponse,
} from '../src/endpoints/threadMessages';
import { Message, TextBlock } from '../src/message';

// Mock fetch globally
const fetchMock = vi.fn();
global.fetch = fetchMock;

describe('Thread Messages Endpoint Tests', () => {
  let mockContext: ThreadMessagesContext;
  let mockRequest: ThreadMessagesRequest;

  beforeEach(() => {
    mockContext = {
      baseUrl: 'http://localhost:8000',
      authToken: 'test-token',
      timeout: 5000,
      debug: false,
    };

    mockRequest = {
      threadId: 5,
      search: 'test',
      offset: 0,
      limit: 10,
    };

    // Reset mocks
    fetchMock.mockReset();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Successful checkpoint messages fetch', () => {
    it('should return checkpoint messages response with correct structure', async () => {
      const mockMessage = new Message('assistant', [{ type: 'text', text: 'Hello' } as TextBlock]);

      const mockResponse: ThreadMessagesResponse = {
        data: {
          messages: [mockMessage],
        },
        metadata: {
          request_id: 'test-request-id',
          timestamp: '2025-10-24T16:10:10.693427',
          message: 'OK',
        },
      };

      const mockFetchResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue(mockResponse),
      };
      fetchMock.mockResolvedValue(mockFetchResponse);

      const result = await checkpointMessages(mockContext, mockRequest);

      expect(result).toEqual(mockResponse);
      expect(result.data.messages).toHaveLength(1);
      expect(result.metadata.request_id).toBe('test-request-id');
    });

    it('should construct correct URL with query parameters', async () => {
      const mockResponse: ThreadMessagesResponse = {
        data: { messages: [] },
        metadata: {
          request_id: 'test-request-id',
          timestamp: '2025-10-24T16:10:10.693427',
          message: 'OK',
        },
      };

      const mockFetchResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue(mockResponse),
      };
      fetchMock.mockResolvedValue(mockFetchResponse);

      await checkpointMessages(mockContext, mockRequest);

      const callArgs = fetchMock.mock.calls[0];
      const url = callArgs[0];

      expect(url).toContain('/v1/threads/5/messages');
      expect(url).toContain('search=test');
      expect(url).toContain('offset=0');
      expect(url).toContain('limit=10');
    });

    it('should work with only threadId parameter', async () => {
      const simpleRequest: ThreadMessagesRequest = {
        threadId: 5,
      };

      const mockResponse: ThreadMessagesResponse = {
        data: { messages: [] },
        metadata: {
          request_id: 'test-request-id',
          timestamp: '2025-10-24T16:10:10.693427',
          message: 'OK',
        },
      };

      const mockFetchResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue(mockResponse),
      };
      fetchMock.mockResolvedValue(mockFetchResponse);

      const result = await checkpointMessages(mockContext, simpleRequest);

      expect(result).toEqual(mockResponse);
      const url = fetchMock.mock.calls[0][0];
      expect(url).toBe('http://localhost:8000/v1/threads/5/messages');
    });

    it('should work with string threadId', async () => {
      const stringThreadRequest: ThreadMessagesRequest = {
        threadId: 'thread-abc-123',
        search: 'query',
      };

      const mockResponse: ThreadMessagesResponse = {
        data: { messages: [] },
        metadata: {
          request_id: 'test-request-id',
          timestamp: '2025-10-24T16:10:10.693427',
          message: 'OK',
        },
      };

      const mockFetchResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue(mockResponse),
      };
      fetchMock.mockResolvedValue(mockFetchResponse);

      const result = await checkpointMessages(mockContext, stringThreadRequest);

      expect(result).toEqual(mockResponse);
      const url = fetchMock.mock.calls[0][0];
      expect(url).toContain('/v1/threads/thread-abc-123/messages');
    });

    it('should work without auth token', async () => {
      const contextWithoutAuth = { ...mockContext, authToken: undefined };

      const mockResponse: ThreadMessagesResponse = {
        data: { messages: [] },
        metadata: {
          request_id: 'test-request-id',
          timestamp: '2025-10-24T16:10:10.693427',
          message: 'OK',
        },
      };

      const mockFetchResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue(mockResponse),
      };
      fetchMock.mockResolvedValue(mockFetchResponse);

      const result = await checkpointMessages(contextWithoutAuth, mockRequest);

      expect(result).toEqual(mockResponse);
      const headers = fetchMock.mock.calls[0][1].headers;
      expect(headers).not.toHaveProperty('Authorization');
    });
  });

  describe('Error handling', () => {
    it('should throw error for non-2xx HTTP status', async () => {
      const mockFetchResponse = {
        ok: false,
        status: 404,
      };
      fetchMock.mockResolvedValue(mockFetchResponse);

      await expect(checkpointMessages(mockContext, mockRequest)).rejects.toThrow();
    });

    it('should throw error for 500 status', async () => {
      const mockFetchResponse = {
        ok: false,
        status: 500,
      };
      fetchMock.mockResolvedValue(mockFetchResponse);

      await expect(checkpointMessages(mockContext, mockRequest)).rejects.toThrow();
    });

    it('should handle network errors', async () => {
      const networkError = new Error('Network connection failed');
      fetchMock.mockRejectedValue(networkError);

      await expect(checkpointMessages(mockContext, mockRequest)).rejects.toThrow(
        'Network connection failed'
      );
    });

    it('should handle JSON parsing errors', async () => {
      const mockFetchResponse = {
        ok: true,
        json: vi.fn().mockRejectedValue(new Error('Invalid JSON')),
      };
      fetchMock.mockResolvedValue(mockFetchResponse);

      await expect(checkpointMessages(mockContext, mockRequest)).rejects.toThrow('Invalid JSON');
    });
  });

  describe('Debug logging', () => {
    let consoleDebugSpy: any;
    let consoleInfoSpy: any;
    let consoleWarnSpy: any;

    beforeEach(() => {
      consoleDebugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
      consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
      consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
      consoleDebugSpy.mockRestore();
      consoleInfoSpy.mockRestore();
      consoleWarnSpy.mockRestore();
    });

    it('should log debug messages when debug is enabled', async () => {
      const debugContext = { ...mockContext, debug: true };

      const mockResponse: ThreadMessagesResponse = {
        data: { messages: [] },
        metadata: {
          request_id: 'test-request-id',
          timestamp: '2025-10-24T16:10:10.693427',
          message: 'OK',
        },
      };

      const mockFetchResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue(mockResponse),
      };
      fetchMock.mockResolvedValue(mockFetchResponse);

      await checkpointMessages(debugContext, mockRequest);

      expect(consoleDebugSpy).toHaveBeenCalledWith(
        'TenxGraphClient: Fetching thread messages for thread',
        5
      );
      expect(consoleInfoSpy).toHaveBeenCalledWith(
        'TenxGraphClient: Thread messages fetched successfully',
        mockResponse
      );
    });

    it('should not log debug messages when debug is disabled', async () => {
      const noDebugContext = { ...mockContext, debug: false };

      const mockResponse: ThreadMessagesResponse = {
        data: { messages: [] },
        metadata: {
          request_id: 'test-request-id',
          timestamp: '2025-10-24T16:10:10.693427',
          message: 'OK',
        },
      };

      const mockFetchResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue(mockResponse),
      };
      fetchMock.mockResolvedValue(mockFetchResponse);

      await checkpointMessages(noDebugContext, mockRequest);

      expect(consoleDebugSpy).not.toHaveBeenCalled();
      expect(consoleInfoSpy).not.toHaveBeenCalled();
    });
  });

  describe('Request headers', () => {
    it('should include auth token in headers when provided', async () => {
      const mockResponse: ThreadMessagesResponse = {
        data: { messages: [] },
        metadata: {
          request_id: 'test-request-id',
          timestamp: '2025-10-24T16:10:10.693427',
          message: 'OK',
        },
      };

      const mockFetchResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue(mockResponse),
      };
      fetchMock.mockResolvedValue(mockFetchResponse);

      await checkpointMessages(mockContext, mockRequest);

      const headers = fetchMock.mock.calls[0][1].headers;
      expect(headers['Authorization']).toBe('Bearer test-token');
      expect(headers['Content-Type']).toBe('application/json');
    });

    it('should include Content-Type header', async () => {
      const mockResponse: ThreadMessagesResponse = {
        data: { messages: [] },
        metadata: {
          request_id: 'test-request-id',
          timestamp: '2025-10-24T16:10:10.693427',
          message: 'OK',
        },
      };

      const mockFetchResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue(mockResponse),
      };
      fetchMock.mockResolvedValue(mockFetchResponse);

      await checkpointMessages(mockContext, mockRequest);

      const headers = fetchMock.mock.calls[0][1].headers;
      expect(headers['Content-Type']).toBe('application/json');
    });
  });
});
