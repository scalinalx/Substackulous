'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useRouter } from 'next/navigation';

// Add these constants at the top of the file
// const STORAGE_KEY = 'titlegen_temp_titles';

export default function TitleGenerator() {
  const router = useRouter();
  const { user, profile, updateProfile, session } = useAuth();
  const [loading, setLoading] = useState(false);
  const [generatedTitles, setGeneratedTitles] = useState<string[]>([]); // Initialize to empty array, no localStorage
  const [topic, setTopic] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);
  const creditCost = 1;
  
  // Add a ref to persist titles through remounts
  const titlesRef = useRef<string[]>([]);
  // Add a mounted ref to track component mounted state
  const isMounted = useRef(true);

  // Track component lifecycle
  useEffect(() => {
    console.log("TitleGenerator mounted");
    isMounted.current = true;
    
    return () => {
      console.log("TitleGenerator unmounting");
      isMounted.current = false;
    };
  }, []);

  // Prevent hydration mismatch by only rendering after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (generatedTitles.length > 0) {
      console.log("generatedTitles for render:", generatedTitles);
      console.log("generatedTitles.length before render condition:", generatedTitles.length);
    }
    else {
      console.log("generatedTitles.length beba1:", generatedTitles.length);
    }
  }, [generatedTitles]);

  // Comment out localStorage sync effect
  // useEffect(() => {
  //   if (generatedTitles.length > 0) {
  //     window.localStorage.setItem(STORAGE_KEY, JSON.stringify(generatedTitles));
  //   } else {
  //     window.localStorage.removeItem(STORAGE_KEY);
  //   }
  // }, [generatedTitles]);

  // Comment out localStorage cleanup effect
  // useEffect(() => {
  //   return () => {
  //     window.localStorage.removeItem(STORAGE_KEY);
  //   };
  // }, []);

  const copyToClipboard = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleGenerateTitles = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setGeneratedTitles([]);

    if (!topic.trim()) {
      setError('Please enter a topic');
      return;
    }

    if (!session?.access_token) {
      setError('No valid session. Please sign in again.');
      return;
    }

    if (!user || !profile) {
      setError('Please sign in to continue');
      return;
    }

    if (profile.credits < creditCost) {
      setError(`Not enough credits. You need ${creditCost} credits to generate titles.`);
      return;
    }

    setLoading(true);
    let titles: string[] = [];

    try {
      const response = await fetch('/api/deepseek/generate-titles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          theme: topic,
          userId: user.id
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to generate titles: ${response.status}`);
      }

      const responseData = await response.json();
      
      if (!responseData.titles || !Array.isArray(responseData.titles)) {
        throw new Error('Invalid response format');
      }

      console.log("Raw titles received:", responseData.titles);

      titles = responseData.titles.map((title: string) => 
        title.replace(/^"|"$/g, '').replace(/\\"/g, '"')
      );
      
      // Update state with titles
      setGeneratedTitles(titles);
      console.log("State updated with titles");
      console.log("generatedTitles.length IMMEDIATELY after setState:", generatedTitles.length);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate titles. Please try again.');
      setGeneratedTitles([]);
      return; // Return early to prevent profile update on error
    } finally {
      setLoading(false);
    }

    // Only update profile if we successfully generated titles
    if (titles.length > 0) {
      await updateProfile({
        credits: profile.credits - creditCost,
      });
      // Add another check after profile update
      console.log("generatedTitles.length AFTER profile update:", generatedTitles.length);
    }
  }, [topic, session, user, profile, creditCost, updateProfile]);

  // Don't render until after mount to prevent hydration mismatch
  if (!mounted) {
    return null;
  }

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

      <form onSubmit={handleGenerateTitles} className="space-y-6">
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
            disabled={loading}
          />
        </div>

        <button
          type="submit"
          disabled={loading || !mounted}
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

      {/* Simplified test render */}
      <div className="mt-8">
        {generatedTitles.length > 0 ? (
          <>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Generated Titles (TEST)</h2>
            <div className="space-y-3">
              {generatedTitles.map((title, index) => (
                <div key={`title-${index}`}>
                  <p>Titles are here!</p> {/* VERY SIMPLE TEST RENDER */}
                </div>
              ))}
            </div>
          </>
        ) : loading ? (
          <div className="text-center text-gray-500">Generating titles...</div>
        ) : null}
      </div>
    </div>
  );
} 