'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { toast } from 'sonner';
import { darkModeClasses } from '@/lib/utils/darkModeClasses';

type PrimaryIntent = 'Growth' | 'Educational' | 'Entertain' | 'Personal Story';

export default function ViralNoteGenerator() {
  const { user, credits, updateCredits } = useAuth();
  const [theme, setTheme] = useState('');
  const [coreTopics, setCoreTopics] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [primaryIntent, setPrimaryIntent] = useState<PrimaryIntent>('Growth');
  const [subject, setSubject] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState<string[]>([]);
  const [rawResponse, setRawResponse] = useState<string>('');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [showResults, setShowResults] = useState(false);

  // Add state persistence
  useEffect(() => {
    if (notes.length > 0 || rawResponse) {
      console.log("Persisting results to localStorage");
      localStorage.setItem('viralNotes', JSON.stringify({
        notes,
        rawResponse,
        showResults: true
      }));
    }
  }, [notes, rawResponse]);

  // Restore state on mount
  useEffect(() => {
    const savedState = localStorage.getItem('viralNotes');
    if (savedState) {
      console.log("Restoring results from localStorage");
      const { notes: savedNotes, rawResponse: savedResponse, showResults: savedShowResults } = JSON.parse(savedState);
      setNotes(savedNotes);
      setRawResponse(savedResponse);
      setShowResults(savedShowResults);
    }
  }, []);

  const handleCopyToClipboard = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      toast.success('Note copied to clipboard!');
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const handleGenerate = async () => {
    if (!user) {
      toast.error('Please sign in to generate notes');
      return;
    }

    if (!theme || !primaryIntent) {
      toast.error('Please fill in at least the theme and primary intent');
      return;
    }

    if (credits === null || credits < 2) {
      toast.error('Insufficient credits. You need 2 credits to generate notes.');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setNotes([]);
    setRawResponse('');
    setShowResults(false);
    localStorage.removeItem('viralNotes'); // Clear previous results

    try {
      const response = await fetch('/api/groq/generate-notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          theme,
          coreTopics,
          targetAudience,
          primaryIntent,
          userId: user.id,
        }),
      });

      const data = await response.json();
      console.log("API Response:", data);
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate notes');
      }

      // Update credits after successful generation
      if (credits !== null) {
        await updateCredits(credits - 2);
      }

      // Set raw response first
      const rawJson = JSON.stringify(data, null, 2);
      console.log("Setting raw response:", rawJson);
      setRawResponse(rawJson);

      // Handle array of notes or single result
      let notesToDisplay: string[] = [];
      if (data.notes && Array.isArray(data.notes)) {
        notesToDisplay = data.notes;
        console.log("Found array of notes:", notesToDisplay);
      } else if (data.result) {
        notesToDisplay = [data.result];
        console.log("Found single result:", notesToDisplay);
      }

      console.log("Setting notes with:", notesToDisplay);
      setNotes(notesToDisplay);
      setShowResults(true);
      toast.success('Notes generated successfully!');
    } catch (error) {
      console.error('Generation error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to generate notes');
      setError(error instanceof Error ? error.message : 'Failed to generate notes');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateModel2 = async () => {
    if (!user) {
      toast.error('Please sign in to generate notes');
      return;
    }

    if (!subject) {
      toast.error('Please enter a subject');
      return;
    }

    if (credits === null || credits < 1) {
      toast.error('Insufficient credits. You need 1 credit to generate a note.');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setNotes([]);

    try {
      const response = await fetch('/api/groq/generate-single-note', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subject,
          userId: user.id,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate note');
      }

      if (!data.note) {
        throw new Error('No note received from API');
      }

      // Update credits after successful generation
      if (credits !== null) {
        await updateCredits(credits - 1);
      }

      setNotes([data.note]);
      toast.success('Note generated successfully!');
    } catch (error) {
      console.error('Generation error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to generate note');
      setError(error instanceof Error ? error.message : 'Failed to generate note');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-6">
        <div className="mb-6 flex items-center justify-between bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg">
          <span className="text-amber-700 dark:text-amber-400">Credits required: 2</span>
          <span className="font-medium text-amber-700 dark:text-amber-400">Your balance: {credits ?? 0}</span>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="theme" className="flex items-center gap-1 text-[#181819] dark:text-gray-200 font-medium">
              Theme <span className="text-red-500">*</span>
            </Label>
            <Input
              id="theme"
              value={theme}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTheme(e.target.value)}
              placeholder="e.g., Personal Finance for Millennials"
              className="mt-1 bg-white dark:bg-gray-700 text-[#181819] dark:text-white border-gray-200 dark:border-gray-600 focus:bg-white dark:focus:bg-gray-600"
            />
          </div>
          <div>
            <Label htmlFor="coreTopics" className="text-[#181819] dark:text-gray-200 font-medium">Core Topics (optional)</Label>
            <Input
              id="coreTopics"
              value={coreTopics}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCoreTopics(e.target.value)}
              placeholder="e.g., INVESTING, BUDGETING, SIDE HUSTLES"
              className="mt-1 bg-white dark:bg-gray-700 text-[#181819] dark:text-white border-gray-200 dark:border-gray-600 focus:bg-white dark:focus:bg-gray-600"
            />
          </div>
          <div>
            <Label htmlFor="targetAudience" className="text-[#181819] dark:text-gray-200 font-medium">Target Audience (optional)</Label>
            <Input
              id="targetAudience"
              value={targetAudience}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTargetAudience(e.target.value)}
              placeholder="e.g., Tech-savvy Millennials interested in financial independence"
              className="mt-1 bg-white dark:bg-gray-700 text-[#181819] dark:text-white border-gray-200 dark:border-gray-600 focus:bg-white dark:focus:bg-gray-600"
            />
          </div>
          <div>
            <Label htmlFor="primaryIntent" className="flex items-center gap-1 text-[#181819] dark:text-gray-200 font-medium">
              Primary Intent <span className="text-red-500">*</span>
            </Label>
            <select
              id="primaryIntent"
              value={primaryIntent}
              onChange={(e) => setPrimaryIntent(e.target.value as PrimaryIntent)}
              className="mt-1 block w-full rounded-md border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm 
                       text-[#181819] dark:text-white focus:bg-white dark:focus:bg-gray-600
                       focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <option value="Growth">Growth (2 credits)</option>
              <option value="Educational">Educational (2 credits)</option>
              <option value="Entertain">Entertain (2 credits)</option>
              <option value="Personal Story">Personal Story (2 credits)</option>
            </select>
          </div>
          <Button 
            onClick={handleGenerate} 
            disabled={isGenerating || !theme || !primaryIntent || (credits ?? 0) < 2}
            className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white"
            size="lg"
          >
            {isGenerating ? 'Generating...' : 'Generate Notes (2 credits)'}
          </Button>
        </div>

        <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-6 space-y-4">
          <div>
            <Label htmlFor="subject" className="flex items-center gap-1 text-[#181819] dark:text-gray-200 font-medium">
              Subject (for single note generation) <span className="text-red-500">*</span>
            </Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSubject(e.target.value)}
              placeholder="Enter a subject for a viral note"
              className="mt-1 bg-white dark:bg-gray-700 text-[#181819] dark:text-white border-gray-200 dark:border-gray-600 focus:bg-white dark:focus:bg-gray-600"
            />
          </div>
          <Button 
            onClick={handleGenerateModel2} 
            disabled={isGenerating || !subject || (credits ?? 0) < 1}
            className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white"
            size="lg"
          >
            {isGenerating ? 'Generating...' : 'Generate Note (1 credit)'}
          </Button>
        </div>
      </div>

      {/* Results Section */}
      <div className="mt-8 space-y-8">
        {/* Debug Info */}
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Status: {isGenerating ? 'Generating...' : showResults ? 'Results Ready' : 'Waiting'}
          {notes.length > 0 && ` (${notes.length} notes)`}
        </div>

        {/* Raw Response */}
        {showResults && rawResponse && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-[#181819] dark:text-white">Raw API Response:</h3>
            <textarea
              readOnly
              value={rawResponse}
              className="w-full h-48 p-4 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 font-mono text-xs text-[#181819] dark:text-gray-200"
              style={{ resize: 'vertical' }}
            />
          </div>
        )}

        {/* Processed Notes */}
        {showResults && notes.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-[#181819] dark:text-white">Generated Notes ({notes.length}):</h3>
            <textarea
              readOnly
              value={notes.join('\n\n---\n\n')}
              className="w-full h-96 p-4 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 font-mono text-sm text-[#181819] dark:text-gray-200"
              style={{ resize: 'vertical' }}
            />
          </div>
        )}
      </div>
    </div>
  );
} 