import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { addThreadMessages } from '../src/endpoints/addThreadMessages';
import type {
  AddThreadMessagesContext,
  AddThreadMessagesRequest,
  AddThreadMessagesResponse,
} from '../src/endpoints/addThreadMessages';
import { Message, TextBlock } from '../src/message';

// Mock fetch globally
const fetchMock = vi.fn();
global.fetch = fetchMock;

describe('Add Thread Messages Endpoint Tests', () => {
  let mockContext: AddThreadMessagesContext;
  let mockRequest: AddThreadMessagesRequest;

  beforeEach(() => {
    mockContext = {
      baseUrl: 'http://localhost:8000',
      authToken: 'test-token',
      timeout: 5000,
      debug: false,
    };

    const testMessage = new Message('user', [
      { type: 'text', text: 'Hello, this is a test message' } as TextBlock,
    ]);

    mockRequest = {
      threadId: 5,
      config: {},
      messages: [testMessage],
      metadata: {},
    };

    // Reset mocks
    fetchMock.mockReset();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Successful add thread messages', () => {
    it('should return success response with correct structure', async () => {
      const mockResponse: AddThreadMessagesResponse = {
        data: {
          success: true,
          message: 'Messages added successfully',
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

      const result = await addThreadMessages(mockContext, mockRequest);

      expect(result).toEqual(mockResponse);
      expect(result.data.success).toBe(true);
      expect(result.metadata.request_id).toBe('f2e2147709b64caca391441256666d68');
    });

    it('should construct correct URL for thread', async () => {
      const mockResponse: AddThreadMessagesResponse = {
        data: {
          success: true,
          message: 'Success',
          data: {},
        },
        metadata: {
          request_id: 'test-id',
          timestamp: '2025-10-26T00:44:22.910508',
          message: 'Success',
        },
      };

      const mockFetchResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue(mockResponse),
      };
      fetchMock.mockResolvedValue(mockFetchResponse);

      await addThreadMessages(mockContext, mockRequest);

      const callArgs = fetchMock.mock.calls[0];
      const url = callArgs[0];

      expect(url).toBe('http://localhost:8000/v1/threads/5/messages');
    });

    it('should send POST request with correct headers', async () => {
      const mockResponse: AddThreadMessagesResponse = {
        data: {
          success: true,
          message: 'Success',
          data: {},
        },
        metadata: {
          request_id: 'test-id',
          timestamp: '2025-10-26T00:44:22.910508',
          message: 'Success',
        },
      };

      const mockFetchResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue(mockResponse),
      };
      fetchMock.mockResolvedValue(mockFetchResponse);

      await addThreadMessages(mockContext, mockRequest);

      const callArgs = fetchMock.mock.calls[0];
      const options = callArgs[1];

      expect(options.method).toBe('POST');
      expect(options.headers['Content-Type']).toBe('application/json');
      expect(options.headers['Authorization']).toBe('Bearer test-token');
    });

    it('should send correct body with messages, config, and metadata', async () => {
      const mockResponse: AddThreadMessagesResponse = {
        data: {
          success: true,
          message: 'Success',
          data: {},
        },
        metadata: {
          request_id: 'test-id',
          timestamp: '2025-10-26T00:44:22.910508',
          message: 'Success',
        },
      };

      const mockFetchResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue(mockResponse),
      };
      fetchMock.mockResolvedValue(mockFetchResponse);

      await addThreadMessages(mockContext, mockRequest);

      const callArgs = fetchMock.mock.calls[0];
      const options = callArgs[1];
      const body = JSON.parse(options.body);

      expect(body.config).toEqual({});
      expect(body.messages).toHaveLength(1);
      expect(body.metadata).toEqual({});
    });

    it('should work with string threadId', async () => {
      const requestWithStringId = {
        ...mockRequest,
        threadId: 'thread-abc-123',
      };

      const mockResponse: AddThreadMessagesResponse = {
        data: {
          success: true,
          message: 'Success',
          data: {},
        },
        metadata: {
          request_id: 'test-id',
          timestamp: '2025-10-26T00:44:22.910508',
          message: 'Success',
        },
      };

      const mockFetchResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue(mockResponse),
      };
      fetchMock.mockResolvedValue(mockFetchResponse);

      const result = await addThreadMessages(mockContext, requestWithStringId);

      const callArgs = fetchMock.mock.calls[0];
      const url = callArgs[0];

      expect(url).toBe('http://localhost:8000/v1/threads/thread-abc-123/messages');
      expect(result.data.success).toBe(true);
    });

    it('should work with multiple messages', async () => {
      const message1 = new Message('user', [{ type: 'text', text: 'First message' } as TextBlock]);
      const message2 = new Message('assistant', [
        { type: 'text', text: 'Second message' } as TextBlock,
      ]);

      const requestWithMultipleMessages = {
        ...mockRequest,
        messages: [message1, message2],
      };

      const mockResponse: AddThreadMessagesResponse = {
        data: {
          success: true,
          message: 'Success',
          data: {},
        },
        metadata: {
          request_id: 'test-id',
          timestamp: '2025-10-26T00:44:22.910508',
          message: 'Success',
        },
      };

      const mockFetchResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue(mockResponse),
      };
      fetchMock.mockResolvedValue(mockFetchResponse);

      await addThreadMessages(mockContext, requestWithMultipleMessages);

      const callArgs = fetchMock.mock.calls[0];
      const options = callArgs[1];
      const body = JSON.parse(options.body);

      expect(body.messages).toHaveLength(2);
    });

    it('should work without metadata', async () => {
      const requestWithoutMetadata = {
        threadId: 5,
        config: { key: 'value' },
        messages: [mockRequest.messages[0]],
      };

      const mockResponse: AddThreadMessagesResponse = {
        data: {
          success: true,
          message: 'Success',
          data: {},
        },
        metadata: {
          request_id: 'test-id',
          timestamp: '2025-10-26T00:44:22.910508',
          message: 'Success',
        },
      };

      const mockFetchResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue(mockResponse),
      };
      fetchMock.mockResolvedValue(mockFetchResponse);

      const result = await addThreadMessages(mockContext, requestWithoutMetadata);

      const callArgs = fetchMock.mock.calls[0];
      const options = callArgs[1];
      const body = JSON.parse(options.body);

      expect(body.metadata).toEqual({});
      expect(result.data.success).toBe(true);
    });
  });

  describe('Error handling', () => {
    it('should throw error on non-ok HTTP response', async () => {
      const mockFetchResponse = {
        ok: false,
        status: 404,
      };
      fetchMock.mockResolvedValue(mockFetchResponse);

      await expect(addThreadMessages(mockContext, mockRequest)).rejects.toThrow();
    });

    it('should throw error on network failure', async () => {
      fetchMock.mockRejectedValue(new Error('Network error'));

      await expect(addThreadMessages(mockContext, mockRequest)).rejects.toThrow('Network error');
    });

    it('should handle timeout', async () => {
      const slowContext = {
        ...mockContext,
        timeout: 100,
      };

      fetchMock.mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 500)));

      await expect(addThreadMessages(slowContext, mockRequest)).rejects.toThrow();
    });

    it('should throw error on 500 server error', async () => {
      const mockFetchResponse = {
        ok: false,
        status: 500,
      };
      fetchMock.mockResolvedValue(mockFetchResponse);

      await expect(addThreadMessages(mockContext, mockRequest)).rejects.toThrow();
    });

    it('should throw error on 401 unauthorized', async () => {
      const mockFetchResponse = {
        ok: false,
        status: 401,
      };
      fetchMock.mockResolvedValue(mockFetchResponse);

      await expect(addThreadMessages(mockContext, mockRequest)).rejects.toThrow();
    });
  });

  describe('Debug logging', () => {
    it('should log when debug is enabled', async () => {
      const debugContext = {
        ...mockContext,
        debug: true,
      };

      const consoleSpy = vi.spyOn(console, 'debug');
      const infoSpy = vi.spyOn(console, 'info');

      const mockResponse: AddThreadMessagesResponse = {
        data: {
          success: true,
          message: 'Success',
          data: {},
        },
        metadata: {
          request_id: 'test-id',
          timestamp: '2025-10-26T00:44:22.910508',
          message: 'Success',
        },
      };

      const mockFetchResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue(mockResponse),
      };
      fetchMock.mockResolvedValue(mockFetchResponse);

      await addThreadMessages(debugContext, mockRequest);

      expect(consoleSpy).toHaveBeenCalledWith(
        'TenxGraphClient: Adding thread messages to thread',
        mockRequest.threadId
      );
      expect(infoSpy).toHaveBeenCalledWith(
        'TenxGraphClient: Thread messages added successfully',
        mockResponse
      );
    });

    it('should log errors when debug is enabled', async () => {
      const debugContext = {
        ...mockContext,
        debug: true,
      };

      const consoleSpy = vi.spyOn(console, 'debug');

      fetchMock.mockRejectedValue(new Error('Test error'));

      await expect(addThreadMessages(debugContext, mockRequest)).rejects.toThrow('Test error');

      expect(consoleSpy).toHaveBeenCalledWith(
        'TenxGraphClient: Add checkpoint messages failed:',
        expect.any(Error)
      );
    });
  });

  describe('Authorization', () => {
    it('should work without auth token', async () => {
      const contextWithoutAuth = {
        ...mockContext,
        authToken: null,
      };

      const mockResponse: AddThreadMessagesResponse = {
        data: {
          success: true,
          message: 'Success',
          data: {},
        },
        metadata: {
          request_id: 'test-id',
          timestamp: '2025-10-26T00:44:22.910508',
          message: 'Success',
        },
      };

      const mockFetchResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue(mockResponse),
      };
      fetchMock.mockResolvedValue(mockFetchResponse);

      await addThreadMessages(contextWithoutAuth, mockRequest);

      const callArgs = fetchMock.mock.calls[0];
      const options = callArgs[1];

      expect(options.headers['Authorization']).toBeUndefined();
    });

    it('should include auth token when provided', async () => {
      const mockResponse: AddThreadMessagesResponse = {
        data: {
          success: true,
          message: 'Success',
          data: {},
        },
        metadata: {
          request_id: 'test-id',
          timestamp: '2025-10-26T00:44:22.910508',
          message: 'Success',
        },
      };

      const mockFetchResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue(mockResponse),
      };
      fetchMock.mockResolvedValue(mockFetchResponse);

      await addThreadMessages(mockContext, mockRequest);

      const callArgs = fetchMock.mock.calls[0];
      const options = callArgs[1];

      expect(options.headers['Authorization']).toBe('Bearer test-token');
    });
  });

  describe('Request body validation', () => {
    it('should include custom config in request body', async () => {
      const customRequest = {
        ...mockRequest,
        config: {
          model: 'gpt-4',
          temperature: 0.7,
        },
      };

      const mockResponse: AddThreadMessagesResponse = {
        data: {
          success: true,
          message: 'Success',
          data: {},
        },
        metadata: {
          request_id: 'test-id',
          timestamp: '2025-10-26T00:44:22.910508',
          message: 'Success',
        },
      };

      const mockFetchResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue(mockResponse),
      };
      fetchMock.mockResolvedValue(mockFetchResponse);

      await addThreadMessages(mockContext, customRequest);

      const callArgs = fetchMock.mock.calls[0];
      const options = callArgs[1];
      const body = JSON.parse(options.body);

      expect(body.config.model).toBe('gpt-4');
      expect(body.config.temperature).toBe(0.7);
    });

    it('should include custom metadata in request body', async () => {
      const customRequest = {
        ...mockRequest,
        metadata: {
          userId: 'user-123',
          sessionId: 'session-456',
        },
      };

      const mockResponse: AddThreadMessagesResponse = {
        data: {
          success: true,
          message: 'Success',
          data: {},
        },
        metadata: {
          request_id: 'test-id',
          timestamp: '2025-10-26T00:44:22.910508',
          message: 'Success',
        },
      };

      const mockFetchResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue(mockResponse),
      };
      fetchMock.mockResolvedValue(mockFetchResponse);

      await addThreadMessages(mockContext, customRequest);

      const callArgs = fetchMock.mock.calls[0];
      const options = callArgs[1];
      const body = JSON.parse(options.body);

      expect(body.metadata.userId).toBe('user-123');
      expect(body.metadata.sessionId).toBe('session-456');
    });
  });
});
