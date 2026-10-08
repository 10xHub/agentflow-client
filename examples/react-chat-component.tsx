/**
 * Example: Simple React Chat Component
 *
 * This example demonstrates:
 * 1. Setting up TenxGraphClient in React with Context
 * 2. Managing conversation state with useState
 * 3. Using invoke() for batch message processing
 * 4. Handling loading and error states
 * 5. Displaying chat messages with proper formatting
 *
 * To use this component:
 * 1. Wrap your app with <TenxGraphProvider>
 * 2. Use <SimpleChat /> anywhere in your component tree
 * 3. Customize styling as needed
 */

'use client'; // For Next.js App Router

import React, { useState, useMemo, createContext, useContext, ReactNode } from 'react';
import { TenxGraphClient, Message, InvokeResult } from '10xgraph-client';

// ============================================
// Context Setup
// ============================================

interface TenxGraphContextType {
  client: TenxGraphClient;
}

const TenxGraphContext = createContext<TenxGraphContextType | null>(null);

interface TenxGraphProviderProps {
  baseUrl: string;
  authToken?: string;
  children: ReactNode;
}

/**
 * Provider component that creates and shares the TenxGraphClient
 * Place this high in your component tree (e.g., in App or layout)
 */
export function TenxGraphProvider({ baseUrl, authToken, children }: TenxGraphProviderProps) {
  const client = useMemo(() => {
    return new TenxGraphClient({
      baseUrl,
      authToken,
      debug: true, // Enable for development
    });
  }, [baseUrl, authToken]);

  return <TenxGraphContext.Provider value={{ client }}>{children}</TenxGraphContext.Provider>;
}

/**
 * Hook to access the TenxGraphClient
 */
function useTenxGraph() {
  const context = useContext(TenxGraphContext);
  if (!context) {
    throw new Error('useTenxGraph must be used within TenxGraphProvider');
  }
  return context.client;
}

// ============================================
// Chat Component
// ============================================

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export function SimpleChat() {
  const client = useTenxGraph();

  // State management
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Send a message to the agent
   */
  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    // Add user message immediately
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setError(null);

    try {
      // Create Message objects for API
      const apiMessages = [
        ...messages.map((m) =>
          m.role === 'user'
            ? Message.text_message(m.content, 'user')
            : Message.text_message(m.content, 'assistant')
        ),
        Message.text_message(input, 'user'),
      ];

      // Invoke the agent
      const result: InvokeResult = await client.invoke({
        messages: apiMessages,
        granularity: 'full',
      });

      // Extract assistant response
      const assistantContent = result.messages
        .map((m) => {
          return m.content
            .filter((block: any) => block.type === 'text')
            .map((block: any) => block.text)
            .join('');
        })
        .join('');

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: assistantContent || 'No response',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Chat error:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Clear conversation
   */
  const handleClear = () => {
    setMessages([]);
    setError(null);
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>10xGraph Chat</h2>
        <button onClick={handleClear} style={styles.clearButton} disabled={messages.length === 0}>
          Clear
        </button>
      </div>

      {/* Messages Area */}
      <div style={styles.messagesContainer}>
        {messages.length === 0 && (
          <div style={styles.emptyState}>
            <p>👋 Start a conversation!</p>
            <p style={styles.emptyHint}>Ask me anything...</p>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            style={{
              ...styles.messageWrapper,
              justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
            }}
          >
            <div
              style={{
                ...styles.message,
                ...(message.role === 'user' ? styles.userMessage : styles.assistantMessage),
              }}
            >
              <div style={styles.messageContent}>{message.content}</div>
              <div style={styles.messageTime}>
                {message.timestamp.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div style={styles.messageWrapper}>
            <div style={{ ...styles.message, ...styles.assistantMessage }}>
              <div style={styles.loadingDots}>
                <span>●</span>
                <span>●</span>
                <span>●</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div style={styles.error}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Input Area */}
      <div style={styles.inputContainer}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Type your message..."
          style={styles.input}
          disabled={loading}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || loading}
          style={{
            ...styles.sendButton,
            ...((!input.trim() || loading) && styles.sendButtonDisabled),
          }}
        >
          {loading ? '...' : 'Send'}
        </button>
      </div>
    </div>
  );
}

// ============================================
// Styles
// ============================================

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '600px',
    maxWidth: '800px',
    margin: '0 auto',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    overflow: 'hidden',
    backgroundColor: '#ffffff',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    borderBottom: '1px solid #e0e0e0',
    backgroundColor: '#f8f9fa',
  },
  title: {
    margin: 0,
    fontSize: '20px',
    fontWeight: 600,
    color: '#333',
  },
  clearButton: {
    padding: '8px 16px',
    backgroundColor: '#ffffff',
    border: '1px solid #ddd',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    color: '#666',
    transition: 'all 0.2s',
  },
  messagesContainer: {
    flex: 1,
    overflowY: 'auto',
    padding: '20px',
    backgroundColor: '#fafafa',
  },
  emptyState: {
    textAlign: 'center',
    marginTop: '100px',
    color: '#999',
  },
  emptyHint: {
    fontSize: '14px',
    marginTop: '8px',
  },
  messageWrapper: {
    display: 'flex',
    marginBottom: '12px',
  },
  message: {
    maxWidth: '70%',
    padding: '12px 16px',
    borderRadius: '8px',
    fontSize: '14px',
    lineHeight: '1.5',
  },
  userMessage: {
    backgroundColor: '#007bff',
    color: '#ffffff',
  },
  assistantMessage: {
    backgroundColor: '#ffffff',
    color: '#333',
    border: '1px solid #e0e0e0',
  },
  messageContent: {
    marginBottom: '4px',
  },
  messageTime: {
    fontSize: '11px',
    opacity: 0.7,
    marginTop: '4px',
  },
  loadingDots: {
    display: 'flex',
    gap: '4px',
    fontSize: '18px',
    animation: 'pulse 1.5s ease-in-out infinite',
  },
  error: {
    padding: '12px 20px',
    backgroundColor: '#fee',
    borderTop: '1px solid #fcc',
    color: '#c33',
    fontSize: '14px',
  },
  inputContainer: {
    display: 'flex',
    gap: '8px',
    padding: '16px 20px',
    borderTop: '1px solid #e0e0e0',
    backgroundColor: '#ffffff',
  },
  input: {
    flex: 1,
    padding: '12px 16px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
    outline: 'none',
  },
  sendButton: {
    padding: '12px 24px',
    backgroundColor: '#007bff',
    color: '#ffffff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 600,
    transition: 'background-color 0.2s',
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
    cursor: 'not-allowed',
  },
};

// ============================================
// Usage Example
// ============================================

/**
 * Example usage in your app:
 *
 * import { TenxGraphProvider, SimpleChat } from './examples/react-chat-component';
 *
 * function App() {
 *   return (
 *     <TenxGraphProvider
 *       baseUrl="http://localhost:8000"
 *       authToken="your-token"
 *     >
 *       <SimpleChat />
 *     </TenxGraphProvider>
 *   );
 * }
 */

export default SimpleChat;
