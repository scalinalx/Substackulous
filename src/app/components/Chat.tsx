'use client';

import { useChat } from 'ai/react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

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
    <div className="max-w-4xl mx-auto space-y-6 p-4 bg-white">
      <div className="grid gap-6">
        <div className="flex items-center mb-4">
          <Link 
            href="/dashboard" 
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
        </div>

        <div className="h-[500px] overflow-y-auto border border-gray-200 rounded-lg p-4 bg-white">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={
                  message.role === 'user'
                    ? 'ml-auto max-w-[80%] rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 p-4 text-white'
                    : 'max-w-[80%] rounded-lg border border-gray-200 p-4 bg-white shadow-sm'
                }
              >
                <div className="mb-1 text-xs opacity-70">
                  {message.role === 'user' ? 'You' : 'Assistant'}
                </div>
                <div className="whitespace-pre-wrap">{message.content}</div>
              </div>
            ))}
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex gap-4 mt-4"
        >
          <Input
            placeholder="Type your message..."
            value={input}
            onChange={handleInputChange}
            disabled={isLoading}
            className="flex-1 bg-white text-[#181819] border-gray-200"
          />
          <Button 
            type="submit" 
            disabled={isLoading || !input.trim()}
            className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white"
          >
            {isLoading ? 'Sending...' : 'Send'}
          </Button>
        </form>
      </div>
    </div>
  );
} 