/**
 * TypeScript types for Agent-to-Agent (A2A) communication
 */

/**
 * ACP Message Type
 */
export type ACPMessageType =
  | 'REQUEST'
  | 'RESPONSE'
  | 'BROADCAST'
  | 'NOTIFICATION'
  | 'ERROR'
  | 'HEARTBEAT';

/**
 * Message Content
 */
export interface MessageContent {
  action: string;
  data: Record<string, any>;
  metadata?: Record<string, any>;
}

/**
 * Message Context
 */
export interface MessageContext {
  thread_id?: string;
  conversation_id?: string;
  correlation_id?: string;
  parent_message_id?: string;
}

/**
 * ACP Message
 */
export interface ACPMessage {
  protocol_version: string;
  message_id: string;
  message_type: ACPMessageType;
  sender_id: string;
  recipient_id: string;
  timestamp: string;
  content: MessageContent;
  context?: MessageContext;
  priority?: number;
  ttl?: number;
}

/**
 * Agent Registry Entry
 */
export interface AgentRegistryEntry {
  agent_id: string;
  agent_name: string;
  agent_type: string;
  status: string;
  capabilities: string[];
  metadata: Record<string, any>;
  registered_at: string;
  last_heartbeat: string;
}

/**
 * Parameters for sending a message
 */
export interface SendMessageParams {
  sender_id: string;
  recipient_id: string;
  action: string;
  data?: Record<string, any>;
  priority?: number;
  ttl?: number;
  context?: MessageContext;
}

/**
 * Parameters for broadcasting a message
 */
export interface BroadcastMessageParams {
  sender_id: string;
  action: string;
  data?: Record<string, any>;
  priority?: number;
}

/**
 * Parameters for sending a notification
 */
export interface NotificationParams {
  sender_id: string;
  recipient_id: string;
  action: string;
  data?: Record<string, any>;
}

/**
 * Agent status update
 */
export interface AgentStatusUpdate {
  agent_id: string;
  status: string;
  timestamp: string;
}

/**
 * Agent message event
 */
export interface AgentMessageEvent {
  event_type: 'message' | 'broadcast' | 'notification';
  message: ACPMessage;
  timestamp: string;
}

