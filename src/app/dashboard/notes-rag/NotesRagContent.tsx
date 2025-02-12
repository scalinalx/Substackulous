'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';
import Link from 'next/link';
import { Button } from '@/app/components/ui/button';
import { Textarea } from '@/app/components/ui/textarea';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { toast } from 'sonner';

type GeneratedResult = {
  shortNotes: string[];
  longFormNote: string;
};

export default function NotesRagContent() {
  const [mounted, setMounted] = useState(false);
  const { user, profile, isLoading: authLoading, updateProfile } = useAuth();
  const router = useRouter();
  const [notes, setNotes] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedContent, setGeneratedContent] = useState<GeneratedResult | null>(null);
  const [selectedExamples, setSelectedExamples] = useState<string | null>(null);
  const creditCost = 1;
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Create a stable reference for the setNotes function
  const setNotesStable = useCallback((value: string) => {
    setNotes(value);
  }, []);

  // Debounced note update using useCallback with proper timeout handling
  const debouncedSetNotes = useCallback((value: string) => {
    const timeoutId = setTimeout(() => setNotesStable(value), 300);
    return () => clearTimeout(timeoutId);
  }, [setNotesStable]);

  const handleNoteChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNotes(value); // Update immediately for UI
    debouncedSetNotes(value); // Debounce for processing
  }, [debouncedSetNotes]);

  // Memoize handlers
  const handleCopyToClipboard = useCallback(async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      toast.success('Note copied to clipboard!');
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      toast.error('Failed to copy to clipboard');
    }
  }, []);

  const handleGenerate = useCallback(async (model: 'deepseek') => {
    if (!notes.trim()) {
      setError('Please enter some notes to generate from');
      return;
    }

    if ((profile?.credits || 0) < creditCost) {
      setError(`Not enough credits. You need ${creditCost} credits to generate content.`);
      return;
    }

    setError(null);
    setIsGenerating(true);
    setGeneratedContent(null);
    setSelectedExamples(null);

    try {
      const response = await fetch('/api/notes-rag/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userTopic: notes,
          userId: user?.id,
          model
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate content');
      }

      const data = await response.json();
      if (!data.result) {
        throw new Error('No content received from the API');
      }

      // Update the profile credits after successful generation
      if (profile) {
        const updatedProfile = {
          ...profile,
          credits: profile.credits - creditCost
        };
        await updateProfile(updatedProfile);
      }

      setGeneratedContent(data.result);
      setSelectedExamples(data.selectedExamples);
    } catch (err) {
      console.error('Error generating content:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate content. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  }, [notes, profile, user, updateProfile, creditCost]);

  const handleGenerateLongForm = useCallback(async () => {
    if (!notes.trim()) {
      setError('Please enter some notes to generate from');
      return;
    }

    if ((profile?.credits || 0) < creditCost) {
      setError(`Not enough credits. You need ${creditCost} credits to generate content.`);
      return;
    }

    setError(null);
    setIsGenerating(true);
    setGeneratedContent(null);
    setSelectedExamples(null);

    try {
      // First update the credits
      if (profile) {
        const updatedCredits = profile.credits - creditCost;
        await updateProfile({
          ...profile,
          credits: updatedCredits
        });
      }

      const response = await fetch('/api/notes-rag/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userTopic: notes,
          userId: user?.id,
          isLongForm: true
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate content');
      }

      const data = await response.json();
      console.log("Long-form response:", data);

      setGeneratedContent(data.result);
      setSelectedExamples(data.selectedExamples);
      
    } catch (err) {
      console.error('Error generating long-form content:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate content. Please try again.');
      
      // If there was an error, try to restore the credits
      if (profile) {
        try {
          await updateProfile({
            ...profile,
            credits: profile.credits // Restore original credits
          });
        } catch (creditError) {
          console.error('Error restoring credits:', creditError);
        }
      }
    } finally {
      setIsGenerating(false);
    }
  }, [notes, profile, user, updateProfile, creditCost]);

  // Add a recovery mechanism for loading state
  useEffect(() => {
    const loadingTimeout = setTimeout(() => {
      if (isGenerating) {
        setIsGenerating(false);
        console.log('Forced loading state reset after timeout');
      }
    }, 10000); // Reset loading state after 10 seconds

    return () => clearTimeout(loadingTimeout);
  }, [isGenerating]);

  // Add an error boundary effect
  useEffect(() => {
    const errorTimeout = setTimeout(() => {
      if (error) {
        setError(null);
        console.log('Cleared error state after timeout');
      }
    }, 5000); // Clear error after 5 seconds

    return () => clearTimeout(errorTimeout);
  }, [error]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !authLoading && !user) {
      router.replace('/');
    }
  }, [mounted, authLoading, user, router]);

  // Split the content into individual notes
  const splitNotes = useCallback((content: string): string[] => {
    return content.split(/Note \d+:\n/).filter(note => note.trim());
  }, []);

  // Loading state
  if (!mounted || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  // Auth check
  if (!user || !profile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <Link
              href="/dashboard"
              className="text-amber-600 hover:text-amber-500 flex items-center gap-1"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Dashboard
            </Link>
            <h1 className="mt-4 text-3xl font-bold text-gray-900">Notes with RAG</h1>
            <p className="mt-2 text-gray-600">
              Generate content from your notes using different AI models
            </p>
          </div>
        </div>

        <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl p-8">
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

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Your Topic
              </label>
              <input
                type="text"
                defaultValue={notes}
                onChange={handleNoteChange}
                placeholder="Enter a topic to generate notes about..."
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-gray-900 transform-gpu"
              />
            </div>

            <div className="flex gap-4">
              <Button
                onClick={() => handleGenerate('deepseek')}
                disabled={isGenerating || !notes.trim() || (profile?.credits || 0) < creditCost}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700"
              >
                {isGenerating ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generating...
                  </span>
                ) : (
                  'Generate 5 Notes'
                )}
              </Button>
            </div>
          </div>

          <div className="mt-8">
            {error && (
              <div className="text-red-500 mb-4">{error}</div>
            )}
            {isGenerating && (
              <div className="text-amber-600 mb-4">Generating content...</div>
            )}

            {/* Generated Content */}
            {generatedContent && (
              <>
                {/* Short Notes */}
                {generatedContent.shortNotes.length > 0 && (
                  <div className="mt-8">
                    <h3 className="text-lg font-semibold text-[#181819] mb-4">Generated Notes:</h3>
                    <div className="grid gap-4">
                      {generatedContent.shortNotes.map((note, index) => (
                        <div
                          key={index}
                          className="relative group rounded-lg border border-gray-200 p-4 bg-white shadow-sm hover:shadow-md transition-shadow"
                        >
                          <div 
                            className="whitespace-pre-wrap font-sans text-[#181819] pr-12"
                            dangerouslySetInnerHTML={{ __html: note }}
                          />
                          <button
                            onClick={() => handleCopyToClipboard(note, index)}
                            className={`absolute top-4 right-4 p-2 rounded-md transition-all duration-200 ${
                              copiedIndex === index
                                ? 'text-green-600 bg-green-50'
                                : 'text-gray-400 hover:text-gray-600 bg-white opacity-0 group-hover:opacity-100'
                            }`}
                          >
                            {copiedIndex === index ? (
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            ) : (
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                              </svg>
                            )}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Long Form Notes */}
                {generatedContent.longFormNote && (
                  <div className="mt-8">
                    <h3 className="text-lg font-semibold text-[#181819] mb-4">Generated Long-Form Notes:</h3>
                    <div className="grid gap-4">
                      {generatedContent.longFormNote.split('###---###').map((note, index) => (
                        <div
                          key={index}
                          className="relative group rounded-lg border border-gray-200 p-4 bg-white shadow-sm hover:shadow-md transition-shadow"
                        >
                          <pre className="whitespace-pre-wrap font-sans text-[#181819] pr-12">{note.trim()}</pre>
                          <button
                            onClick={() => handleCopyToClipboard(note.trim(), index)}
                            className={`absolute top-4 right-4 p-2 rounded-md transition-all duration-200 ${
                              copiedIndex === index
                                ? 'text-green-600 bg-green-50'
                                : 'text-gray-400 hover:text-gray-600 bg-white opacity-0 group-hover:opacity-100'
                            }`}
                          >
                            {copiedIndex === index ? (
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            ) : (
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                              </svg>
                            )}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 