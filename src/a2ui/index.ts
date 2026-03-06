/**
 * A2UI (Agent-to-UI) Communication Module
 *
 * Exports all A2UI related functionality including WebSocket client,
 * React hooks, and TypeScript types.
 */

export { A2UIClient, createA2UIClient } from './client';
export type { A2UIClientConfig, MessageHandler, ErrorHandler, ConnectionHandler } from './client';

export {
  useA2UIClient,
  useAgentStatus,
  useAgentMessages,
  useAgentThinking,
  useAgentCommunication,
  useA2UIMessage,
} from './hooks';

export type {
  A2UIMessage,
  A2UIMessageType,
  ConnectionState,
  AgentStatusUpdate,
  AgentMessageUpdate,
  AgentThinkingUpdate,
  AgentErrorUpdate,
  AgentCompleteUpdate,
  AgentToolCallUpdate,
  AgentToolResultUpdate,
} from './types';

