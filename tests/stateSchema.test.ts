import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { stateSchema } from '../src/endpoints/stateSchema';
import type {
  StateSchemaContext,
  StateSchemaResponse,
  AgentStateSchema,
} from '../src/endpoints/stateSchema';
import { TenxGraphClient } from '../src';

// Mock fetch globally
const fetchMock = vi.fn();
(globalThis as unknown as { fetch: typeof fetch }).fetch = fetchMock as unknown as typeof fetch;

describe('State Schema Endpoint Tests', () => {
  let mockContext: StateSchemaContext;

  beforeEach(() => {
    mockContext = {
      baseUrl: 'http://localhost:8000',
      authToken: 'test-token',
      timeout: 5000,
      debug: false,
    };

    fetchMock.mockReset();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Successful fetch', () => {
    it('should return state schema with field definitions', async () => {
      const mockSchema: AgentStateSchema = {
        title: 'AgentState',
        description: 'Schema for agent execution state',
        type: 'object',
        properties: {
          context: {
            type: 'array',
            description: 'List of context items',
            items: { type: 'object' },
          },
          context_summary: {
            description: 'Summary of context',
            anyOf: [{ type: 'string' }, { type: 'null' }],
            default: null,
          },
          execution_meta: {
            type: 'object',
            description: 'Execution metadata',
            properties: {
              current_node: { type: 'string' },
              step: { type: 'integer' },
              is_running: { type: 'boolean' },
              is_interrupted: { type: 'boolean' },
              is_stopped_requested: { type: 'boolean' },
            },
          },
          cv_text: { type: 'string', default: '', description: 'CV content' },
          cid: { type: 'string', default: '', description: 'Candidate ID' },
          jd_text: { type: 'string', default: '', description: 'Job description content' },
          jd_id: { type: 'string', default: '', description: 'Job description ID' },
        },
      };

      const mockResponse: StateSchemaResponse = {
        data: mockSchema,
        metadata: {
          request_id: 'test-request-id',
          timestamp: '2025-10-19T01:00:00.000000',
          message: 'OK',
        },
      };

      const mockFetchResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue(mockResponse),
      };
      fetchMock.mockResolvedValue(mockFetchResponse);

      const result = await stateSchema(mockContext);

      expect(result.data).toHaveProperty('properties');
      expect(result.data.properties).toHaveProperty('context');
      expect(result.data.properties).toHaveProperty('context_summary');
      expect(result.data.properties).toHaveProperty('execution_meta');
      expect(result.data.properties).toHaveProperty('cv_text');
      expect(result.data.properties).toHaveProperty('cid');
      expect(result.metadata.request_id).toBe('test-request-id');
      expect(fetchMock).toHaveBeenCalledWith('http://localhost:8000/v1/graph:StateSchema', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          accept: 'application/json',
          Authorization: 'Bearer test-token',
        },
        signal: expect.any(AbortSignal),
      });
    });

    it('should work without auth token', async () => {
      const contextWithoutAuth = { ...mockContext, authToken: undefined };

      const mockSchema: AgentStateSchema = {
        title: 'AgentState',
        type: 'object',
        properties: {
          context: { type: 'array' },
          context_summary: { anyOf: [{ type: 'string' }, { type: 'null' }] },
          execution_meta: { type: 'object' },
        },
      };

      const mockResponse: StateSchemaResponse = {
        data: mockSchema,
        metadata: {
          request_id: 'test-request-id',
          timestamp: '2025-10-19T01:00:00.000000',
          message: 'OK',
        },
      };

      const mockFetchResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue(mockResponse),
      };
      fetchMock.mockResolvedValue(mockFetchResponse);

      const result = await stateSchema(contextWithoutAuth);

      expect(result.data).toHaveProperty('properties');
      expect(fetchMock).toHaveBeenCalledWith('http://localhost:8000/v1/graph:StateSchema', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          accept: 'application/json',
        },
        signal: expect.any(AbortSignal),
      });
    });
  });

  describe('Error handling', () => {
    it('should throw error for non-2xx HTTP status', async () => {
      const mockFetchResponse = {
        ok: false,
        status: 404,
      };
      fetchMock.mockResolvedValue(mockFetchResponse);

      await expect(stateSchema(mockContext)).rejects.toThrow();
    });

    it('should handle timeout correctly', async () => {
      const abortError = new Error('Request timed out');
      abortError.name = 'AbortError';
      fetchMock.mockRejectedValue(abortError);

      await expect(stateSchema(mockContext)).rejects.toThrow('Request timeout after 5000ms');
    });

    it('should handle network errors', async () => {
      const networkError = new Error('Network connection failed');
      fetchMock.mockRejectedValue(networkError);

      await expect(stateSchema(mockContext)).rejects.toThrow('Network connection failed');
    });
  });

  describe('Client integration', () => {
    it('TenxGraphClient.graphStateSchema exists and calls endpoint', async () => {
      const client = new TenxGraphClient({ baseUrl: 'http://localhost:8000', debug: false });

      const mockSchema: AgentStateSchema = {
        title: 'AgentState',
        type: 'object',
        properties: {
          context: { type: 'array', description: 'List of context items' },
          context_summary: {
            description: 'Summary',
            anyOf: [{ type: 'string' }, { type: 'null' }],
            default: null,
          },
          execution_meta: {
            type: 'object',
            properties: {
              current_node: { type: 'string' },
              step: { type: 'integer' },
              is_running: { type: 'boolean' },
              is_interrupted: { type: 'boolean' },
              is_stopped_requested: { type: 'boolean' },
            },
          },
        },
      };

      const mockResponse: StateSchemaResponse = {
        data: mockSchema,
        metadata: {
          request_id: 'req-1',
          timestamp: '2025-10-19T01:00:00.000000',
          message: 'OK',
        },
      };

      const mockFetchResponse = { ok: true, json: vi.fn().mockResolvedValue(mockResponse) };
      fetchMock.mockResolvedValue(mockFetchResponse);

      expect(typeof client.graphStateSchema).toBe('function');
      const result = await client.graphStateSchema();
      expect(result.data).toHaveProperty('properties');
      expect(result.data.properties).toHaveProperty('context');
      expect(result.data.properties).toHaveProperty('execution_meta');
      expect(result.metadata.request_id).toBe('req-1');
    });
  });
});
