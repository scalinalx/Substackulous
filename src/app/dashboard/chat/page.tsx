'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';
import { Chat } from '@/app/components/Chat';

export default function ChatPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/');
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">AI Assistant</h1>
          <p className="mt-2 text-gray-600">
            Chat with our AI assistant trained on Substack best practices. Get help with content strategy, writing, and growing your newsletter.
          </p>
        </div>
        
        <Chat 
          sessionId={user.id} 
          initialContext="You are a helpful AI assistant trained on Substack best practices. Help the user with content strategy, writing, and growing their newsletter. Be specific and actionable in your advice."
        />
      </div>
    </div>
  );
} 