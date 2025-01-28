import { useState } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';

interface TitleGeneratorProps {
  onClose?: () => void;
}

export default function TitleGenerator({ onClose }: TitleGeneratorProps) {
  const { profile, updateProfile } = useAuth();
  const [theme, setTheme] = useState('');
  const [mainIdeas, setMainIdeas] = useState('');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [titles, setTitles] = useState<string[] | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!theme.trim()) {
      setError('Theme is required');
      return;
    }

    if ((profile?.credits || 0) < 1) {
      setError('Not enough credits. Please purchase more credits to continue.');
      return;
    }

    setError(null);
    setGenerating(true);

    try {
      const response = await fetch('/api/deepseek/generate-titles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          theme,
          mainIdeas: mainIdeas.trim() || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate titles');
      }

      const data = await response.json();
      setTitles(data.titles);

      // Update credits in profile
      if (profile) {
        await updateProfile({
          ...profile,
          credits: (profile.credits || 0) - 1,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate titles');
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

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between bg-amber-50 p-4 rounded-lg">
        <span className="text-amber-700">Credits required: 1</span>
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
            placeholder="Brief description of your post's theme..."
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
            rows={2}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Main Ideas <span className="text-gray-500">(optional)</span>
          </label>
          <textarea
            value={mainIdeas}
            onChange={(e) => setMainIdeas(e.target.value)}
            placeholder="3-4 brief sentences describing the main ideas in your post..."
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
            rows={4}
          />
        </div>

        <button
          type="submit"
          disabled={generating}
          className="w-full bg-gradient-to-r from-amber-500 to-amber-600 text-white px-4 py-2 rounded-md 
                   hover:from-amber-600 hover:to-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 
                   focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {generating ? (
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

      {titles && titles.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Generated Titles</h2>
          <div className="space-y-3">
            {titles.map((title, index) => (
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
                <button
                  onClick={() => copyToClipboard(title, index)}
                  className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-indigo-600 focus:outline-none focus:text-indigo-600 transition-colors"
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
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 