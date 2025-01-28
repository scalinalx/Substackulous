'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';

interface ViralNoteGeneratorProps {
  onClose?: () => void;
}

type PrimaryIntent = 'Growth' | 'Entertain' | 'Educate';

export default function ViralNoteGenerator({ onClose }: ViralNoteGeneratorProps) {
  const { profile, updateProfile } = useAuth();
  const [theme, setTheme] = useState('');
  const [coreTopics, setCoreTopics] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [primaryIntent, setPrimaryIntent] = useState<PrimaryIntent>('Growth');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState<string[] | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [generatedNote, setGeneratedNote] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!theme.trim()) {
      setError('Theme is required');
      return;
    }

    if ((profile?.credits || 0) < 2) {
      setError('Not enough credits. You need 2 credits to generate viral notes.');
      return;
    }

    setError(null);
    setGenerating(true);

    try {
      const response = await fetch('/api/deepseek/generate-notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          theme: theme.trim(),
          coreTopics: coreTopics.trim() || undefined,
          targetAudience: targetAudience.trim() || undefined,
          primaryIntent,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate notes');
      }

      const data = await response.json();
      setNotes(data.notes);

      // Update credits in profile (cost: 2 credits)
      if (profile) {
        await updateProfile({
          ...profile, // Maintain all existing fields
          credits: (profile.credits || 0) - 2,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate notes');
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const generateNote = async () => {
    if ((profile?.credits || 0) < 2) {
      setError('Not enough credits. You need 2 credits to generate a viral note.');
      return;
    }

    setError(null);
    setLoading(true);
    setGeneratedNote('');
    let completionReceived = false;

    try {
      const response = await fetch('/api/anthropic/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: `Write a viral note about ${theme}. Make it engaging, informative, and shareable. Use a ${primaryIntent} tone. Include relevant hashtags.`
            }
          ]
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate note');
      }

      if (!response.body) {
        throw new Error('No response body received');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedNote = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(5));
              
              if (data.type === 'completion') {
                accumulatedNote += data.content;
                setGeneratedNote(accumulatedNote);
              } else if (data.type === 'error') {
                throw new Error(data.message || 'Error generating note');
              } else if (data.type === 'done') {
                completionReceived = true;
                
                // Update credits only after successful completion
                if (profile) {
                  const updatedProfile = {
                    ...profile,
                    credits: (profile.credits || 0) - 2,
                  };
                  await updateProfile(updatedProfile);
                }
              }
            } catch (e) {
              console.error('Error parsing SSE message:', e);
            }
          }
        }
      }

      if (!completionReceived) {
        throw new Error('Generation did not complete successfully');
      }
    } catch (err) {
      setError((err as Error).message);
      setGeneratedNote('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between bg-amber-50 p-4 rounded-lg">
        <span className="text-amber-700">Credits required: 2</span>
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
            Theme <span className="text-red-500">*</span>
          </label>
          <textarea
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            placeholder="e.g., Personal Finance for Millennials"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-gray-900"
            rows={2}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Core Topics <span className="text-gray-500">(optional)</span>
          </label>
          <textarea
            value={coreTopics}
            onChange={(e) => setCoreTopics(e.target.value)}
            placeholder="e.g., INVESTING, BUDGETING, SIDE HUSTLES"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-gray-900"
            rows={2}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Target Audience <span className="text-gray-500">(optional)</span>
          </label>
          <textarea
            value={targetAudience}
            onChange={(e) => setTargetAudience(e.target.value)}
            placeholder="e.g., Tech-savvy Millennials interested in financial independence"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-gray-900"
            rows={2}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Primary Intent <span className="text-red-500">*</span>
          </label>
          <select
            value={primaryIntent}
            onChange={(e) => setPrimaryIntent(e.target.value as PrimaryIntent)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-gray-900"
            required
          >
            <option value="Growth">Growth</option>
            <option value="Entertain">Entertain</option>
            <option value="Educate">Educate</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={generating || (profile?.credits ?? 0) < 2}
          className="w-full bg-gradient-to-r from-amber-500 to-amber-600 text-white py-3 px-4 rounded-lg 
                   hover:from-amber-600 hover:to-amber-700 transition-all focus:outline-none focus:ring-2 
                   focus:ring-amber-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed 
                   disabled:hover:from-amber-500 disabled:hover:to-amber-600"
        >
          {generating ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Generating Notes...
            </span>
          ) : 'Generate Viral Notes'}
        </button>
      </form>

      {notes && notes.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Generated Notes</h2>
          <div className="space-y-4">
            {notes.map((note, index) => (
              <div
                key={index}
                className="group flex flex-col gap-2 p-4 bg-white border border-gray-200 rounded-lg hover:border-amber-200 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500">Note {index + 1}</span>
                  <button
                    onClick={() => copyToClipboard(note, index)}
                    className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-amber-600 focus:outline-none focus:text-amber-600 transition-colors"
                  >
                    {copiedIndex === index ? (
                      <span className="flex items-center">
                        <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Copied!
                      </span>
                    ) : (
                      <span className="flex items-center opacity-0 group-hover:opacity-100">
                        <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                        </svg>
                        Copy
                      </span>
                    )}
                  </button>
                </div>
                <div className="whitespace-pre-wrap text-gray-900 bg-gray-50 p-3 rounded">
                  {note}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {generatedNote && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Generated Note</h2>
          <div className="whitespace-pre-wrap text-gray-900 bg-gray-50 p-3 rounded">
            {generatedNote}
          </div>
        </div>
      )}
    </div>
  );
} 