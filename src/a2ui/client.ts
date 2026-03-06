/**
 * Agent-to-UI (A2UI) WebSocket Client
 *
 * Provides real-time communication from agents to the UI using WebSockets.
 */

import type {
  A2UIMessage,
  A2UIMessageType,
  AgentStatusUpdate,
  AgentThinkingUpdate,
  ConnectionState,
} from './types';

export interface A2UIClientConfig {
  baseUrl: string;
  agentId?: string;
  authToken?: string;
  reconnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  debug?: boolean;
}

export type MessageHandler = (message: A2UIMessage) => void;
export type ErrorHandler = (error: Error) => void;
export type ConnectionHandler = (state: ConnectionState) => void;

/**
 * A2UI WebSocket Client
 */
export class A2UIClient {
  private config: Required<A2UIClientConfig>;
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private messageHandlers: Map<A2UIMessageType, MessageHandler[]> = new Map();
  private errorHandlers: ErrorHandler[] = [];
  private connectionHandlers: ConnectionHandler[] = [];
  private connectionState: ConnectionState = 'disconnected';
  private messageQueue: A2UIMessage[] = [];

  constructor(config: A2UIClientConfig) {
    this.config = {
      baseUrl: config.baseUrl,
      agentId: config.agentId || '*',
      authToken: config.authToken || '',
      reconnect: config.reconnect ?? true,
      reconnectInterval: config.reconnectInterval || 3000,
      maxReconnectAttempts: config.maxReconnectAttempts || 10,
      debug: config.debug || false,
    };
  }

  /**
   * Connect to the WebSocket server
   */
  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.log('Already connected');
      return;
    }

    const wsUrl = this.buildWebSocketUrl();
    this.log(`Connecting to ${wsUrl}`);
    this.setConnectionState('connecting');

    try {
      this.ws = new WebSocket(wsUrl);
      this.setupEventHandlers();
    } catch (error) {
      this.handleError(new Error(`Failed to create WebSocket: ${error}`));
      this.attemptReconnect();
    }
  }

  /**
   * Disconnect from the WebSocket server
   */
  disconnect(): void {
    this.log('Disconnecting');
    this.config.reconnect = false; // Prevent auto-reconnect

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.setConnectionState('disconnected');
  }

  /**
   * Subscribe to specific message types
   */
  on(messageType: A2UIMessageType, handler: MessageHandler): void {
    if (!this.messageHandlers.has(messageType)) {
      this.messageHandlers.set(messageType, []);
    }
    this.messageHandlers.get(messageType)!.push(handler);
  }

  /**
   * Unsubscribe from message type
   */
  off(messageType: A2UIMessageType, handler: MessageHandler): void {
    const handlers = this.messageHandlers.get(messageType);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  /**
   * Subscribe to errors
   */
  onError(handler: ErrorHandler): void {
    this.errorHandlers.push(handler);
  }

  /**
   * Subscribe to connection state changes
   */
  onConnectionChange(handler: ConnectionHandler): void {
    this.connectionHandlers.push(handler);
  }

  /**
   * Get current connection state
   */
  getConnectionState(): ConnectionState {
    return this.connectionState;
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.connectionState === 'connected';
  }

  /**
   * Build WebSocket URL
   */
  private buildWebSocketUrl(): string {
    // Convert http/https to ws/wss
    const url = this.config.baseUrl.replace(/^http/, 'ws');
    const agentId = this.config.agentId;

    // Build URL with optional auth token
    let wsUrl = `${url}/ws/agents/${agentId}`;

    if (this.config.authToken) {
      wsUrl += `?token=${encodeURIComponent(this.config.authToken)}`;
    }

    return wsUrl;
  }

  /**
   * Setup WebSocket event handlers
   */
  private setupEventHandlers(): void {
    if (!this.ws) return;

    this.ws.onopen = () => {
      this.log('Connected');
      this.reconnectAttempts = 0;
      this.setConnectionState('connected');
      this.flushMessageQueue();
    };

    this.ws.onmessage = (event) => {
      try {
        const message: A2UIMessage = JSON.parse(event.data);
        this.handleMessage(message);
      } catch (error) {
        this.handleError(new Error(`Failed to parse message: ${error}`));
      }
    };

    this.ws.onerror = (event) => {
      this.log('WebSocket error', event);
      this.handleError(new Error('WebSocket error occurred'));
    };

    this.ws.onclose = (event) => {
      this.log(`Connection closed: ${event.code} - ${event.reason}`);
      this.setConnectionState('disconnected');

      if (this.config.reconnect && !event.wasClean) {
        this.attemptReconnect();
      }
    };
  }

  /**
   * Handle incoming message
   */
  private handleMessage(message: A2UIMessage): void {
    this.log('Received message:', message);

    const handlers = this.messageHandlers.get(message.message_type);
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(message);
        } catch (error) {
          this.handleError(
            new Error(`Error in message handler: ${error}`)
          );
        }
      });
    }

    // Also trigger wildcard handlers
    const wildcardHandlers = this.messageHandlers.get('*' as A2UIMessageType);
    if (wildcardHandlers) {
      wildcardHandlers.forEach((handler) => handler(message));
    }
  }

  /**
   * Handle errors
   */
  private handleError(error: Error): void {
    this.log('Error:', error);
    this.errorHandlers.forEach((handler) => {
      try {
        handler(error);
      } catch (err) {
        console.error('Error in error handler:', err);
      }
    });
  }

  /**
   * Set connection state and notify handlers
   */
  private setConnectionState(state: ConnectionState): void {
    if (this.connectionState !== state) {
      this.connectionState = state;
      this.connectionHandlers.forEach((handler) => {
        try {
          handler(state);
        } catch (error) {
          console.error('Error in connection handler:', error);
        }
      });
    }
  }

  /**
   * Attempt to reconnect
   */
  private attemptReconnect(): void {
    if (!this.config.reconnect) {
      return;
    }

    if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
      this.log('Max reconnect attempts reached');
      this.handleError(new Error('Max reconnect attempts reached'));
      return;
    }

    this.reconnectAttempts++;
    this.setConnectionState('reconnecting');

    this.log(
      `Reconnecting in ${this.config.reconnectInterval}ms ` +
        `(attempt ${this.reconnectAttempts}/${this.config.maxReconnectAttempts})`
    );

    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, this.config.reconnectInterval);
  }

  /**
   * Queue message when disconnected
   */
  private queueMessage(message: A2UIMessage): void {
    this.messageQueue.push(message);
  }

  /**
   * Flush queued messages
   */
  private flushMessageQueue(): void {
    if (this.messageQueue.length > 0) {
      this.log(`Flushing ${this.messageQueue.length} queued messages`);
      // Process queued messages
      this.messageQueue.forEach((msg) => this.handleMessage(msg));
      this.messageQueue = [];
    }
  }

  /**
   * Log debug messages
   */
  private log(...args: any[]): void {
    if (this.config.debug) {
      console.log('[A2UI Client]', ...args);
    }
  }
}

/**
 * Create a new A2UI client instance
 */
export function createA2UIClient(config: A2UIClientConfig): A2UIClient {
  return new A2UIClient(config);
}

