'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Input } from '@/app/components/ui/input';
import { Button } from '@/app/components/ui/button';
import { Textarea } from '@/app/components/ui/textarea';
import supabase from '@/lib/supabase';

export default function NotesRagContent() {
  const { user } = useAuth();
  const [credits, setCredits] = useState(0);
  const router = useRouter();
  const [topic, setTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  useEffect(() => {
    const fetchCredits = async () => {
      if (user?.id) {
        const { data } = await supabase
          .from('profiles')
          .select('credits')
          .eq('id', user.id)
          .single();
        setCredits(data?.credits || 0);
      }
    };
    fetchCredits();
  }, [user]);

  // Handle authentication
  if (!user) {
    router.replace('/');
    return null;
  }

  const handleGenerate = async (model: 'llama' | 'deepseek') => {
    if (!topic.trim() || isGenerating) return;
    
    console.log('Current credits:', credits); // Debug log
    
    if (credits < 1) {
      setError('Not enough credits. Please purchase more credits to continue.');
      return;
    }
    
    setIsGenerating(true);
    setError(null);
    setResult(null);
    
    try {
      const response = await fetch('/api/notes-rag/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          userTopic: topic.trim(),
          model,
          userId: user.id
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to generate notes');
      }

      if (data.logs) {
        console.log('API Logs:', data.logs);
      }

      setResult(data.result);
      
      // Immediately update credits in the UI
      setCredits(credits - 1);
      console.log('Credits updated, new credits:', credits); // Debug log
    } catch (error) {
      console.error('Generation error:', error); // Debug log
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-4">
          <Link
            href="/dashboard"
            className="text-black hover:text-gray-700 flex items-center gap-1"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Dashboard
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h1 className="text-2xl font-bold mb-4 text-black">RAG-Based Viral Note Generator</h1>
          <p className="text-black mb-6">
            Generate viral Substack notes using our RAG system trained on thousands of high-performing examples.
            Each generation costs 1 credit.
          </p>
          
          <div className="mb-6">
            <p className="text-black mb-2">
              Available Credits: <span className="font-semibold">{credits}</span>
            </p>
          </div>

          <div className="mb-6">
            <label htmlFor="topic" className="block text-black font-medium mb-2">
              Enter your topic
            </label>
            <Input
              id="topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., Building a successful newsletter, Growing on Substack"
              className="w-full bg-white text-black placeholder-gray-500 border-gray-300 focus:border-black focus:ring-black"
              disabled={isGenerating}
            />
          </div>

          <div className="flex gap-4 mb-6">
            <Button
              onClick={() => handleGenerate('llama')}
              disabled={isGenerating || !topic.trim() || credits < 1}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white disabled:bg-gray-300"
            >
              {isGenerating ? 'Generating...' : 'Generate Model1'}
            </Button>
            <Button
              onClick={() => handleGenerate('deepseek')}
              disabled={isGenerating || !topic.trim() || credits < 1}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-300"
            >
              {isGenerating ? 'Generating...' : 'Generate Model2'}
            </Button>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-md">
              {error}
            </div>
          )}

          {result && (
            <div className="mt-8">
              <h2 className="text-xl font-semibold mb-4 text-black">Generated Note</h2>
              <div className="bg-white text-black border border-gray-200 rounded-lg p-6 whitespace-pre-wrap">
                {result}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 