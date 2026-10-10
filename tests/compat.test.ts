import { describe, it, expect } from 'vitest';
import {
  AgentFlowClient,
  AgentFlowError,
  TenxGraphClient,
  TenxGraphError,
  WS_BEARER_SUBPROTOCOL,
  type AgentFlowAuth,
  type AgentFlowConfig,
} from '../src/index.js';

describe('deprecated AgentFlow* aliases', () => {
  it('AgentFlowClient is the same class as TenxGraphClient', () => {
    expect(AgentFlowClient).toBe(TenxGraphClient);

    const auth: AgentFlowAuth = { type: 'bearer', token: 'tok' };
    const config: AgentFlowConfig = { baseUrl: 'http://localhost:8000', auth };
    const client: AgentFlowClient = new AgentFlowClient(config);

    expect(client).toBeInstanceOf(TenxGraphClient);
  });

  it('AgentFlowError matches errors thrown as TenxGraphError', () => {
    expect(AgentFlowError).toBe(TenxGraphError);

    const error = new TenxGraphError('boom', 418, 'TEAPOT', 'req-1', '2026-01-01T00:00:00Z');

    expect(error).toBeInstanceOf(AgentFlowError);
    expect(error.name).toBe('TenxGraphError');
  });
});

describe('WebSocket bearer subprotocol', () => {
  it('uses the 10xgraph-bearer name the API expects', () => {
    expect(WS_BEARER_SUBPROTOCOL).toBe('10xgraph-bearer');
  });
});
