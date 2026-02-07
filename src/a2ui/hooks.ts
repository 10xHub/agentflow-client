/**
 * React hooks for A2UI (Agent-to-UI) communication
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { A2UIClient, createA2UIClient, A2UIClientConfig } from './client';
import type {
  A2UIMessage,
  ConnectionState,
  AgentStatusUpdate,
  AgentMessageUpdate,
  AgentThinkingUpdate,
} from './types';

/**
 * Hook for A2UI WebSocket connection
 */
export function useA2UIClient(config: A2UIClientConfig) {
  const [client, setClient] = useState<A2UIClient | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const newClient = createA2UIClient(config);

    newClient.onConnectionChange((state) => {
      setConnectionState(state);
    });

    newClient.onError((err) => {
      setError(err);
    });

    newClient.connect();
    setClient(newClient);

    return () => {
      newClient.disconnect();
    };
  }, [config.baseUrl, config.agentId, config.authToken]);

  return {
    client,
    connectionState,
    error,
    isConnected: connectionState === 'connected',
  };
}

/**
 * Hook for agent status updates
 */
export function useAgentStatus(client: A2UIClient | null) {
  const [status, setStatus] = useState<{
    status: string;
    message?: string;
    timestamp?: string;
  } | null>(null);

  useEffect(() => {
    if (!client) return;

    const handler = (message: A2UIMessage) => {
      const statusMsg = message as AgentStatusUpdate;
      setStatus({
        status: statusMsg.data.status,
        message: statusMsg.data.message,
        timestamp: statusMsg.timestamp,
      });
    };

    client.on('AGENT_STATUS', handler);

    return () => {
      client.off('AGENT_STATUS', handler);
    };
  }, [client]);

  return status;
}

/**
 * Hook for agent messages
 */
export function useAgentMessages(client: A2UIClient | null) {
  const [messages, setMessages] = useState<
    Array<{
      content: string;
      role: string;
      timestamp: string;
      message_id?: string;
    }>
  >([]);

  useEffect(() => {
    if (!client) return;

    const handler = (message: A2UIMessage) => {
      const msgUpdate = message as AgentMessageUpdate;
      setMessages((prev) => [
        ...prev,
        {
          content: msgUpdate.data.content,
          role: msgUpdate.data.role,
          timestamp: msgUpdate.timestamp,
          message_id: msgUpdate.data.message_id,
        },
      ]);
    };

    client.on('AGENT_MESSAGE', handler);

    return () => {
      client.off('AGENT_MESSAGE', handler);
    };
  }, [client]);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return { messages, clearMessages };
}

/**
 * Hook for agent thinking process
 */
export function useAgentThinking(client: A2UIClient | null) {
  const [thinking, setThinking] = useState<{
    thinking: string;
    step?: string;
    timestamp?: string;
  } | null>(null);

  useEffect(() => {
    if (!client) return;

    const handler = (message: A2UIMessage) => {
      const thinkingMsg = message as AgentThinkingUpdate;
      setThinking({
        thinking: thinkingMsg.data.thinking,
        step: thinkingMsg.data.step,
        timestamp: thinkingMsg.timestamp,
      });
    };

    client.on('AGENT_THINKING', handler);

    return () => {
      client.off('AGENT_THINKING', handler);
    };
  }, [client]);

  return thinking;
}

/**
 * Hook for complete agent communication (all message types)
 */
export function useAgentCommunication(config: A2UIClientConfig) {
  const { client, connectionState, error, isConnected } = useA2UIClient(config);
  const status = useAgentStatus(client);
  const { messages, clearMessages } = useAgentMessages(client);
  const thinking = useAgentThinking(client);

  return {
    client,
    connectionState,
    error,
    isConnected,
    status,
    messages,
    thinking,
    clearMessages,
  };
}

/**
 * Hook for subscribing to specific message types
 */
export function useA2UIMessage<T extends A2UIMessage>(
  client: A2UIClient | null,
  messageType: T['message_type'],
  handler: (message: T) => void
) {
  const handlerRef = useRef(handler);

  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    if (!client) return;

    const wrappedHandler = (message: A2UIMessage) => {
      handlerRef.current(message as T);
    };

    client.on(messageType, wrappedHandler);

    return () => {
      client.off(messageType, wrappedHandler);
    };
  }, [client, messageType]);
}

