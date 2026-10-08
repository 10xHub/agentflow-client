import { useState, useRef, useEffect } from 'react';
import { TenxGraphClient, Message } from '10xgraph-client';
import './App.css';

// Create the 10xGraph client - connects to localhost:8000
const client = new TenxGraphClient({
  baseUrl: 'http://localhost:8000',
  debug: true,
});

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState('');
  const [useStreaming, setUseStreaming] = useState(true);
  const messagesEndRef = useRef(null);

  // Check connection on mount
  useEffect(() => {
    checkConnection();
  }, []);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingMessage]);

  const checkConnection = async () => {
    try {
      await client.ping();
      setIsConnected(true);
    } catch (error) {
      console.error('Connection failed:', error);
      setIsConnected(false);
    }
  };

  // Handle regular invoke (non-streaming)
  const handleInvoke = async (userMessage) => {
    try {
      const message = Message.text_message(userMessage, 'user');
      const result = await client.invoke([message]);

      // Extract assistant response from result
      if (result.messages && result.messages.length > 0) {
        const assistantMessages = result.messages.filter((m) => m.role === 'assistant');
        for (const msg of assistantMessages) {
          setMessages((prev) => [
            ...prev,
            {
              role: 'assistant',
              content: msg.text ? msg.text() : extractTextFromMessage(msg),
            },
          ]);
        }
      }
    } catch (error) {
      console.error('Invoke failed:', error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `Error: ${error.message}`,
        },
      ]);
    }
  };

  // Handle streaming invoke
  const handleStream = async (userMessage) => {
    try {
      const message = Message.text_message(userMessage, 'user');
      const stream = client.stream([message]);

      let fullText = '';

      for await (const chunk of stream) {
        console.log('Received chunk:', chunk);
        if (chunk.event === 'message' && chunk.message) {
          const text = extractTextFromMessage(chunk.message);
          if (text && chunk.message.role === 'assistant') {
            fullText += text;
            setStreamingMessage(fullText);
          }
        }
      }

      // Add the complete streamed message
      if (fullText) {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: fullText,
          },
        ]);
      }
      setStreamingMessage('');
    } catch (error) {
      console.error('Stream failed:', error);
      setStreamingMessage('');
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `Error: ${error.message}`,
        },
      ]);
    }
  };

  // Extract text content from a message object
  const extractTextFromMessage = (message) => {
    if (!message || !message.content) return '';

    return message.content
      .filter((block) => block.type === 'text')
      .map((block) => block.text)
      .join('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');

    // Add user message to chat
    setMessages((prev) => [
      ...prev,
      {
        role: 'user',
        content: userMessage,
      },
    ]);

    setIsLoading(true);

    if (useStreaming) {
      await handleStream(userMessage);
    } else {
      await handleInvoke(userMessage);
    }

    setIsLoading(false);
  };

  return (
    <div className="app">
      <header className="header">
        <h1>🤖 10xGraph Chat</h1>
        <div className="connection-status">
          <span className={`status-dot ${isConnected ? 'connected' : 'disconnected'}`}></span>
          {isConnected ? 'Connected' : 'Disconnected'}
          <button onClick={checkConnection} className="refresh-btn">
            ↻
          </button>
        </div>
      </header>

      <div className="controls">
        <label className="toggle">
          <input
            type="checkbox"
            checked={useStreaming}
            onChange={(e) => setUseStreaming(e.target.checked)}
          />
          <span>Use Streaming</span>
        </label>
      </div>

      <main className="chat-container">
        <div className="messages">
          {messages.length === 0 && (
            <div className="empty-state">
              <p>👋 Send a message to start chatting!</p>
              <p className="hint">
                Make sure your 10xGraph API server is running on localhost:8000
              </p>
            </div>
          )}

          {messages.map((msg, index) => (
            <div key={index} className={`message ${msg.role}`}>
              <div className="message-avatar">{msg.role === 'user' ? '👤' : '🤖'}</div>
              <div className="message-content">
                <div className="message-role">{msg.role}</div>
                <div className="message-text">{msg.content}</div>
              </div>
            </div>
          ))}

          {streamingMessage && (
            <div className="message assistant streaming">
              <div className="message-avatar">🤖</div>
              <div className="message-content">
                <div className="message-role">assistant</div>
                <div className="message-text">
                  {streamingMessage}
                  <span className="cursor">▊</span>
                </div>
              </div>
            </div>
          )}

          {isLoading && !streamingMessage && (
            <div className="message assistant loading">
              <div className="message-avatar">🤖</div>
              <div className="message-content">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </main>

      <footer className="input-container">
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            disabled={isLoading || !isConnected}
          />
          <button type="submit" disabled={isLoading || !isConnected || !input.trim()}>
            {isLoading ? '...' : 'Send'}
          </button>
        </form>
      </footer>
    </div>
  );
}

export default App;
