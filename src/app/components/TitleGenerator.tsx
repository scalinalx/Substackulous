'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';

export default function TitleGenerator() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const { profile, updateProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [generatedTitles, setGeneratedTitles] = useState<string[]>([]);
  const [topic, setTopic] = useState('');
  const [error, setError] = useState<string | null>(null);
  const creditCost = 1;

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        console.log('Initial session check:', { session, error });
        
        if (error || !session) {
          console.log('No session found, redirecting to login...');
          router.push('/');
          return;
        }
      } catch (err) {
        console.error('Error checking session:', err);
        router.push('/');
      }
    };

    checkSession();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session);
      if (event === 'SIGNED_OUT' || !session) {
        router.push('/');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!profile) {
      setError('User profile not found');
      return;
    }

    if (profile.credits < creditCost) {
      setError(`Not enough credits. You need ${creditCost} credits to generate titles.`);
      return;
    }

    try {
      setLoading(true);
      console.log('Getting session...');
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      console.log('Session result:', { session, error: sessionError });
      
      if (sessionError) {
        setError(`Authentication error: ${sessionError.message}`);
        return;
      }
      
      if (!session) {
        console.log('No session found, redirecting to login...');
        router.push('/');
        return;
      }

      const response = await fetch('/api/deepseek/generate-titles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          theme: topic,
          userId: profile.id
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate titles');
      }

      const data = await response.json();
      setGeneratedTitles(data.titles);
      
      // Update credits only after successful completion
      const updatedProfile = {
        ...profile,
        credits: profile.credits - creditCost,
      };
      await updateProfile(updatedProfile);
    } catch (err) {
      console.error('Error in title generation:', err);
      setError((err as Error).message);
      setGeneratedTitles([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between bg-amber-50 p-4 rounded-lg">
        <span className="text-amber-700">Credits required: {creditCost}</span>
        <span className="font-medium text-amber-700">Your balance: {profile?.credits ?? 0}</span>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Topic <span className="text-red-500">*</span>
          </label>
          <textarea
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Brief description of your post's topic..."
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
            rows={2}
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-amber-500 to-amber-600 text-white px-4 py-2 rounded-md 
                   hover:from-amber-600 hover:to-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 
                   focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Generating...
            </span>
          ) : 'Generate Titles'}
        </button>
      </form>

      {generatedTitles.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Generated Titles</h2>
          <div className="space-y-3">
            {generatedTitles.map((title, index) => (
              <div
                key={index}
                className="group flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg hover:border-indigo-200 transition-colors"
              >
                <span className="flex-none w-8 text-gray-400 text-sm">
                  {index + 1}.
                </span>
                <input
                  type="text"
                  value={title}
                  readOnly
                  className="flex-1 bg-transparent border-none focus:ring-0 text-gray-900"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 