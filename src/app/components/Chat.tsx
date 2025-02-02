'use client';

import { Button } from './ui/button';
import { Input } from './ui/input';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ErrorResponse {
  error: string;
  type?: string;
}

interface ChatProps {
  sessionId: string;
  initialContext?: string;
}

export function Chat({ sessionId, initialContext }: ChatProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<Message[]>(() => {
    if (initialContext) {
      return [{
        id: 'context',
        role: 'system',
        content: initialContext
      }];
    }
    return [];
  });
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Math.random().toString(36).substring(7),
      role: 'user',
      content: input.trim()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/groq/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          sessionId
        }),
      });

      if (!response.ok) {
        const errorData: ErrorResponse = await response.json();
        throw new Error(errorData.error || 'Failed to send message');
      }

      const data: Message = await response.json();
      setMessages(prev => [...prev, data]);
    } catch (error) {
      console.error('Chat error:', error);
      // Reset input so user can try again
      setInput(userMessage.content);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  return (
    <div style={{
      maxWidth: '4xl',
      margin: '0 auto',
      padding: '1rem',
      backgroundColor: 'white',
    }}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
      }}>
        <Link 
          href="/dashboard" 
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            fontSize: '0.875rem',
            color: '#666',
            textDecoration: 'none',
          }}
        >
          <ArrowLeft style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} />
          Back to Dashboard
        </Link>

        <div style={{
          height: '500px',
          overflowY: 'auto',
          border: '1px solid #e5e7eb',
          borderRadius: '0.5rem',
          padding: '1rem',
          backgroundColor: 'white',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {messages.filter(m => m.role !== 'system').map((message) => (
              <div
                key={message.id}
                style={{
                  maxWidth: '80%',
                  marginLeft: message.role === 'user' ? 'auto' : '0',
                  padding: '1rem',
                  borderRadius: '0.5rem',
                  ...(message.role === 'user' 
                    ? {
                        background: 'linear-gradient(to right, #f59e0b, #d97706)',
                        color: 'white',
                      }
                    : {
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                        color: 'black',
                      }
                  ),
                }}
              >
                <div style={{
                  marginBottom: '0.25rem',
                  fontSize: '0.75rem',
                  opacity: 0.7,
                }}>
                  {message.role === 'user' ? 'You' : 'Assistant'}
                </div>
                <div style={{
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}>
                  {message.content}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          style={{
            display: 'flex',
            gap: '1rem',
            marginTop: '1rem',
          }}
        >
          <Input
            placeholder="Type your message..."
            value={input}
            onChange={handleInputChange}
            disabled={isLoading}
            style={{
              flex: 1,
              backgroundColor: 'white',
              color: '#181819',
              border: '1px solid #e5e7eb',
              borderRadius: '0.375rem',
              padding: '0.5rem 1rem',
            }}
          />
          <Button 
            type="submit" 
            disabled={isLoading || !input.trim()}
            style={{
              background: 'linear-gradient(to right, #f59e0b, #d97706)',
              color: 'white',
              border: 'none',
              borderRadius: '0.375rem',
              padding: '0.5rem 1rem',
              cursor: 'pointer',
              minWidth: '100px',
            }}
          >
            {isLoading ? 'Sending...' : 'Send'}
          </Button>
        </form>
      </div>
    </div>
  );
} 