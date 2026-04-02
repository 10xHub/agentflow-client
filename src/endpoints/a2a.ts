/**
 * Agent-to-Agent (A2A) Communication API Endpoints
 *
 * Provides methods for agent-to-agent communication including direct messaging,
 * broadcasting, and agent discovery.
 */

import type {
  AgentRegistryEntry,
  ACPMessage,
  SendMessageParams,
  BroadcastMessageParams,
  NotificationParams,
} from '../types/a2a';
import { AgentFlowAuth, buildHeaders, getRequestCredentials } from '../request.js';

export interface A2AClientOptions {
  authToken?: string;
  auth?: AgentFlowAuth | null;
  headers?: HeadersInit;
  credentials?: RequestCredentials;
}

/**
 * Agent-to-Agent communication client
 */
export class A2AClient {
  private baseUrl: string;
  private authToken?: string;
  private auth?: AgentFlowAuth | null;
  private headers?: HeadersInit;
  private credentials?: RequestCredentials;

  constructor(baseUrl: string, authTokenOrOptions?: string | A2AClientOptions) {
    this.baseUrl = baseUrl;

    if (typeof authTokenOrOptions === 'string') {
      this.authToken = authTokenOrOptions;
      return;
    }

    if (authTokenOrOptions) {
      this.authToken = authTokenOrOptions.authToken;
      this.auth = authTokenOrOptions.auth;
      this.headers = authTokenOrOptions.headers;
      this.credentials = authTokenOrOptions.credentials;
    }
  }

  /**
   * Get headers with optional authentication
   */
  private getHeaders(): HeadersInit {
    return buildHeaders(
      {
        authToken: this.authToken,
        auth: this.auth,
        headers: this.headers,
      },
      {
        'Content-Type': 'application/json',
      }
    );
  }

  private getRequestOptions(): Pick<RequestInit, 'credentials'> | Record<string, never> {
    return getRequestCredentials({
      credentials: this.credentials,
    });
  }

  /**
   * Register an agent
   */
  async registerAgent(params: {
    agent_id: string;
    agent_name: string;
    agent_type?: string;
    capabilities?: string[];
    metadata?: Record<string, any>;
  }): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${this.baseUrl}/api/v1/agents/register`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(params),
      ...this.getRequestOptions(),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to register agent' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  /**
   * Unregister an agent
   */
  async unregisterAgent(agentId: string): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${this.baseUrl}/api/v1/agents/${agentId}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
      ...this.getRequestOptions(),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to unregister agent' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  /**
   * Send a direct message to another agent
   */
  async sendMessage(params: SendMessageParams): Promise<ACPMessage | null> {
    const response = await fetch(
      `${this.baseUrl}/api/v1/agents/${params.recipient_id}/message`,
      {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          sender_id: params.sender_id,
          action: params.action,
          data: params.data || {},
          priority: params.priority || 5,
          ttl: params.ttl,
          context: params.context,
        }),
        ...this.getRequestOptions(),
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to send message' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  /**
   * Broadcast a message to all agents
   */
  async broadcastMessage(params: BroadcastMessageParams): Promise<{ success: boolean }> {
    const response = await fetch(
      `${this.baseUrl}/api/v1/agents/${params.sender_id}/broadcast`,
      {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          action: params.action,
          data: params.data || {},
          priority: params.priority || 5,
        }),
        ...this.getRequestOptions(),
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to broadcast message' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  /**
   * Send a notification to an agent
   */
  async sendNotification(params: NotificationParams): Promise<{ success: boolean }> {
    const response = await fetch(
      `${this.baseUrl}/api/v1/agents/${params.recipient_id}/notification`,
      {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          sender_id: params.sender_id,
          action: params.action,
          data: params.data || {},
        }),
        ...this.getRequestOptions(),
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to send notification' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  /**
   * Get list of active agents
   */
  async getActiveAgents(filters?: {
    agent_type?: string;
    status?: string;
  }): Promise<AgentRegistryEntry[]> {
    const params = new URLSearchParams();
    if (filters?.agent_type) params.append('agent_type', filters.agent_type);
    if (filters?.status) params.append('status', filters.status);

    const url = `${this.baseUrl}/api/v1/agents?${params.toString()}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: this.getHeaders(),
      ...this.getRequestOptions(),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to get agents' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    return data.agents || [];
  }

  /**
   * Get agent status
   */
  async getAgentStatus(agentId: string): Promise<AgentRegistryEntry> {
    const response = await fetch(`${this.baseUrl}/api/v1/agents/${agentId}/status`, {
      method: 'GET',
      headers: this.getHeaders(),
      ...this.getRequestOptions(),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to get agent status' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  /**
   * Get agent messages (history)
   */
  async getAgentMessages(
    agentId: string,
    options?: {
      limit?: number;
      offset?: number;
      message_type?: string;
    }
  ): Promise<ACPMessage[]> {
    const params = new URLSearchParams();
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.offset) params.append('offset', options.offset.toString());
    if (options?.message_type) params.append('message_type', options.message_type);

    const url = `${this.baseUrl}/api/v1/agents/${agentId}/messages?${params.toString()}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: this.getHeaders(),
      ...this.getRequestOptions(),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to get messages' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    return data.messages || [];
  }

  /**
   * Find agents by capability
   */
  async findAgentsByCapability(capability: string): Promise<AgentRegistryEntry[]> {
    const response = await fetch(
      `${this.baseUrl}/api/v1/agents/capability/${encodeURIComponent(capability)}`,
      {
        method: 'GET',
        headers: this.getHeaders(),
        ...this.getRequestOptions(),
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to find agents' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    return data.agents || [];
  }

  /**
   * Send heartbeat for an agent
   */
  async sendHeartbeat(agentId: string): Promise<{ success: boolean }> {
    const response = await fetch(`${this.baseUrl}/api/v1/agents/${agentId}/heartbeat`, {
      method: 'POST',
      headers: this.getHeaders(),
      ...this.getRequestOptions(),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to send heartbeat' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  /**
   * Update agent status
   */
  async updateAgentStatus(
    agentId: string,
    status: string
  ): Promise<{ success: boolean }> {
    const response = await fetch(`${this.baseUrl}/api/v1/agents/${agentId}/status`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify({ status }),
      ...this.getRequestOptions(),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to update status' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }
}
