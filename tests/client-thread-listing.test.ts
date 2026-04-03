import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AgentFlowClient } from '../src/index';

const fetchMock = vi.fn();
global.fetch = fetchMock;

describe('AgentFlowClient thread listing helpers', () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('supports object-style threads requests', async () => {
    const client = new AgentFlowClient({
      baseUrl: 'http://localhost:8000',
      debug: false,
    });

    fetchMock.mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        data: { threads: [] },
        metadata: {
          request_id: 'req-threads',
          timestamp: '2026-04-03T00:00:00.000Z',
          message: 'OK',
        },
      }),
    });

    await client.threads({ search: 'weather', offset: 5, limit: 10 });

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:8000/v1/threads?search=weather&offset=5&limit=10',
      expect.objectContaining({
        method: 'GET',
      })
    );
  });

  it('supports object-style thread message requests', async () => {
    const client = new AgentFlowClient({
      baseUrl: 'http://localhost:8000',
      debug: false,
    });

    fetchMock.mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        data: { messages: [] },
        metadata: {
          request_id: 'req-messages',
          timestamp: '2026-04-03T00:00:00.000Z',
          message: 'OK',
        },
      }),
    });

    await client.threadMessages('thread-123', {
      search: 'hello',
      offset: 2,
      limit: 20,
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:8000/v1/threads/thread-123/messages?search=hello&offset=2&limit=20',
      expect.objectContaining({
        method: 'GET',
      })
    );
  });
});
