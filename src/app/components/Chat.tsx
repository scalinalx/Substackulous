'use client';

import { useChat } from 'ai/react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { cn } from '@/lib/utils';

interface ChatProps {
  sessionId: string;
  initialContext?: string;
}

export function Chat({ sessionId, initialContext }: ChatProps) {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/groq/chat',
    id: sessionId,
    initialMessages: initialContext
      ? [
          {
            id: 'context',
            role: 'system',
            content: initialContext,
            createdAt: new Date(),
          },
        ]
      : [],
  });

  return (
    <div className="flex h-[600px] flex-col rounded-lg border bg-background">
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                'flex w-max max-w-[80%] flex-col gap-2 rounded-lg px-3 py-2 text-sm',
                message.role === 'user'
                  ? 'ml-auto bg-primary text-primary-foreground'
                  : 'bg-muted'
              )}
            >
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {message.role === 'user' ? 'You' : 'Assistant'}
                </span>
              </div>
              <p className="whitespace-pre-wrap">{message.content}</p>
            </div>
          ))}
        </div>
      </div>
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 border-t p-4"
      >
        <Input
          placeholder="Type your message..."
          value={input}
          onChange={handleInputChange}
          disabled={isLoading}
          className="flex-1"
        />
        <Button type="submit" disabled={isLoading || !input.trim()}>
          {isLoading ? 'Sending...' : 'Send'}
        </Button>
      </form>
    </div>
  );
} 