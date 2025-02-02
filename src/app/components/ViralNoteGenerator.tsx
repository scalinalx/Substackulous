'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { toast } from 'sonner';

type PrimaryIntent = 'Growth' | 'Educational' | 'Entertain' | 'Personal Story';

export default function ViralNoteGenerator() {
  const { user } = useAuth();
  const [theme, setTheme] = useState('');
  const [coreTopics, setCoreTopics] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [primaryIntent, setPrimaryIntent] = useState<PrimaryIntent>('Growth');
  const [isLoading, setIsLoading] = useState(false);
  const [generatedNotes, setGeneratedNotes] = useState<string[]>([]);

  const handleGenerate = async () => {
    if (!user) {
      toast.error('Please sign in to generate notes');
      return;
    }

    if (!theme || !primaryIntent) {
      toast.error('Please fill in at least the theme and primary intent');
      return;
    }

    setIsLoading(true);
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
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate notes');
      }

      setGeneratedNotes(data.notes);
      toast.success('Notes generated successfully!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to generate notes');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-4 bg-white dark:bg-gray-900">
      <div className="grid gap-6">
        <div className="mb-6 flex items-center justify-between bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg">
          <span className="text-amber-700 dark:text-amber-300">Credits required: {primaryIntent === 'Growth' ? 2 : 1}</span>
          <span className="font-medium text-amber-700 dark:text-amber-300">Your balance: {user?.credits ?? 0}</span>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="theme" className="flex items-center gap-1">
              Theme <span className="text-red-500">*</span>
            </Label>
            <Input
              id="theme"
              value={theme}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTheme(e.target.value)}
              placeholder="e.g., Personal Finance for Millennials"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="coreTopics">Core Topics (optional)</Label>
            <Input
              id="coreTopics"
              value={coreTopics}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCoreTopics(e.target.value)}
              placeholder="e.g., INVESTING, BUDGETING, SIDE HUSTLES"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="targetAudience">Target Audience (optional)</Label>
            <Input
              id="targetAudience"
              value={targetAudience}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTargetAudience(e.target.value)}
              placeholder="e.g., Tech-savvy Millennials interested in financial independence"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="primaryIntent" className="flex items-center gap-1">
              Primary Intent <span className="text-red-500">*</span>
            </Label>
            <select
              id="primaryIntent"
              value={primaryIntent}
              onChange={(e) => setPrimaryIntent(e.target.value as PrimaryIntent)}
              className="mt-1 block w-full rounded-md border border-input bg-white dark:bg-gray-800 px-3 py-2 text-sm 
                       text-gray-900 dark:text-gray-100
                       focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <option value="Growth">Growth</option>
              <option value="Educational">Educational</option>
              <option value="Entertain">Entertain</option>
              <option value="Personal Story">Personal Story</option>
            </select>
          </div>
          <Button 
            onClick={handleGenerate} 
            disabled={isLoading || !theme || !primaryIntent}
            className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white"
            size="lg"
          >
            {isLoading ? 'Generating...' : 'Generate Notes'}
          </Button>
        </div>
      </div>

      {generatedNotes.length > 0 && (
        <div className="mt-8 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Generated Notes:</h3>
          {generatedNotes.map((note, index) => (
            <div key={index} className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow">
              <pre className="whitespace-pre-wrap font-sans text-gray-900 dark:text-gray-100">{note}</pre>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 