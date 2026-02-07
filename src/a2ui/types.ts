/**
 * TypeScript types for Agent-to-UI (A2UI) communication
 */

/**
 * A2UI Message Types
 */
export type A2UIMessageType =
  | 'AGENT_STATUS'
  | 'AGENT_MESSAGE'
  | 'AGENT_THINKING'
  | 'AGENT_ERROR'
  | 'AGENT_COMPLETE'
  | 'AGENT_TOOL_CALL'
  | 'AGENT_TOOL_RESULT'
  | '*'; // Wildcard for all messages

/**
 * Connection State
 */
export type ConnectionState =
  | 'connected'
  | 'connecting'
  | 'disconnected'
  | 'reconnecting';

/**
 * Base A2UI Message
 */
export interface A2UIMessage {
  message_type: A2UIMessageType;
  agent_id: string;
  timestamp: string;
  data: Record<string, any>;
}

/**
 * Agent Status Update
 */
export interface AgentStatusUpdate extends A2UIMessage {
  message_type: 'AGENT_STATUS';
  data: {
    status: 'active' | 'idle' | 'busy' | 'error' | 'offline';
    message?: string;
    metadata?: Record<string, any>;
  };
}

/**
 * Agent Message
 */
export interface AgentMessageUpdate extends A2UIMessage {
  message_type: 'AGENT_MESSAGE';
  data: {
    content: string;
    role: string;
    message_id?: string;
    metadata?: Record<string, any>;
  };
}

/**
 * Agent Thinking Update
 */
export interface AgentThinkingUpdate extends A2UIMessage {
  message_type: 'AGENT_THINKING';
  data: {
    thinking: string;
    step?: string;
    metadata?: Record<string, any>;
  };
}

/**
 * Agent Error
 */
export interface AgentErrorUpdate extends A2UIMessage {
  message_type: 'AGENT_ERROR';
  data: {
    error: string;
    error_code?: string;
    stack_trace?: string;
    metadata?: Record<string, any>;
  };
}

/**
 * Agent Complete
 */
export interface AgentCompleteUpdate extends A2UIMessage {
  message_type: 'AGENT_COMPLETE';
  data: {
    result: any;
    duration?: number;
    metadata?: Record<string, any>;
  };
}

/**
 * Agent Tool Call
 */
export interface AgentToolCallUpdate extends A2UIMessage {
  message_type: 'AGENT_TOOL_CALL';
  data: {
    tool_name: string;
    tool_id: string;
    arguments: Record<string, any>;
    metadata?: Record<string, any>;
  };
}

/**
 * Agent Tool Result
 */
export interface AgentToolResultUpdate extends A2UIMessage {
  message_type: 'AGENT_TOOL_RESULT';
  data: {
    tool_name: string;
    tool_id: string;
    result: any;
    error?: string;
    metadata?: Record<string, any>;
  };
}

