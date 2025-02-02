'use client';

import { useState } from 'react';
import { useAuth, User } from '@/lib/hooks/useAuth';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { toast } from 'sonner';

export default function ViralNoteGenerator() {
  const { user } = useAuth();
  const [theme, setTheme] = useState('');
  const [coreTopics, setCoreTopics] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [primaryIntent, setPrimaryIntent] = useState('');
  const [subject, setSubject] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingModel2, setIsLoadingModel2] = useState(false);
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
          userId: user.uid,
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

  const handleGenerateModel2 = async () => {
    if (!user) {
      toast.error('Please sign in to generate notes');
      return;
    }

    if (!subject) {
      toast.error('Please enter a subject');
      return;
    }

    setIsLoadingModel2(true);
    try {
      const response = await fetch('/api/groq/generate-single-note', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subject,
          userId: user.uid,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate note');
      }

      setGeneratedNotes([data.note]); // Replace existing notes with the single note
      toast.success('Note generated successfully!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to generate note');
    } finally {
      setIsLoadingModel2(false);
    }
  };

  return (
    <div className="space-y-6 p-4">
      <div className="grid gap-4">
        <div>
          <Label htmlFor="theme">Theme</Label>
          <Input
            id="theme"
            value={theme}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTheme(e.target.value)}
            placeholder="Enter the main theme"
          />
        </div>
        <div>
          <Label htmlFor="coreTopics">Core Topics (optional)</Label>
          <Input
            id="coreTopics"
            value={coreTopics}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCoreTopics(e.target.value)}
            placeholder="Enter core topics"
          />
        </div>
        <div>
          <Label htmlFor="targetAudience">Target Audience (optional)</Label>
          <Input
            id="targetAudience"
            value={targetAudience}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTargetAudience(e.target.value)}
            placeholder="Enter target audience"
          />
        </div>
        <div>
          <Label htmlFor="primaryIntent">Primary Intent</Label>
          <Input
            id="primaryIntent"
            value={primaryIntent}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPrimaryIntent(e.target.value)}
            placeholder="Growth, Educational, or Entertain"
          />
        </div>
        <Button 
          onClick={handleGenerate} 
          disabled={isLoading || !theme || !primaryIntent}
          className="mt-4"
        >
          {isLoading ? 'Generating...' : 'Generate Notes (model 1)'}
        </Button>

        <div className="mt-8 border-t pt-6">
          <Label htmlFor="subject">Subject (for single note generation)</Label>
          <Input
            id="subject"
            value={subject}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSubject(e.target.value)}
            placeholder="Enter the subject for a single viral note"
          />
          <Button 
            onClick={handleGenerateModel2} 
            disabled={isLoadingModel2 || !subject}
            className="mt-4"
          >
            {isLoadingModel2 ? 'Generating...' : 'Generate Note (model 2)'}
          </Button>
        </div>
      </div>

      {generatedNotes.length > 0 && (
        <div className="mt-8 space-y-4">
          <h3 className="text-lg font-semibold">Generated Notes:</h3>
          {generatedNotes.map((note, index) => (
            <div key={index} className="rounded-lg border p-4">
              <pre className="whitespace-pre-wrap font-sans">{note}</pre>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 