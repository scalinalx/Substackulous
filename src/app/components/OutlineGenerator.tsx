'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import supabase from '@/lib/supabase';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function OutlineGenerator() {
  const router = useRouter();
  const { profile, updateProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [generatedOutline, setGeneratedOutline] = useState<string | null>(null);
  const [topic, setTopic] = useState('');
  const [keyPoints, setKeyPoints] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [objective, setObjective] = useState('');
  const [format, setFormat] = useState('detailed');
  const [knowledgeLevel, setKnowledgeLevel] = useState('intermediate');
  const [tone, setTone] = useState<string[]>(['professional', 'engaging']);
  const [wordCount, setWordCount] = useState('1500');
  const [error, setError] = useState<string | null>(null);
  const creditCost = 2;

  useEffect(() => {
    console.log('OutlineGenerator component mounted');
    return () => {
      console.log('OutlineGenerator component unmounted');
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!profile) {
      setError('User profile not found');
      return;
    }

    if (profile.credits < creditCost) {
      setError(`Not enough credits. You need ${creditCost} credits to generate an outline.`);
      return;
    }

    try {
      setLoading(true);
      console.log('Starting outline generation...');
      console.log('Profile:', profile);

      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      console.log('Getting session...');
      console.log('Session result:', { session, error: sessionError });
      
      if (sessionError || !session) {
        setError('Authentication error. Please try again.');
        return;
      }

      console.log('Making API request...');
      const response = await fetch('/api/outline', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          userId: profile.id,
          prompt: `Act as a master content architect and Pulitzer-winning editorial director. The best in the world at writing viral, engaging Substack posts.
Create a ${format} outline using:

**Strategic Foundation**
- Primary Goal: ${objective}
- Audience Profile: ${knowledgeLevel} | Target Audience: ${targetAudience || 'General audience'}
${keyPoints ? `- Key Points to Address:\n${keyPoints}` : ''}

**Content Core**
- Central Theme: "${topic}"
- Target Length: ${wordCount} words
- Content Style: ${tone.join(', ')}

**Output Requirements**
1. Title Options (3 viral headline variants)
2. Meta Description (160 chars)
3. Detailed Section Framework
   - Introduction (Hook + Context)
   - Main Body (3-5 key sections)
   - Conclusion + Call to Action
4. Key Data Points to Include
5. Engagement Hooks (Open Loops/Story Elements)
6. SEO Optimization Notes

Format the outline with clear hierarchical structure using markdown.`
        }),
        signal: AbortSignal.timeout(250000)
      });

      console.log('API response received, status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(e => ({
          error: response.statusText,
          details: 'Could not parse error response'
        }));
        
        if (response.status === 504) {
          throw new Error('The outline generation is taking longer than usual. Please try again. Your credits have not been deducted.');
        }
        
        throw new Error(
          errorData.details 
            ? `${errorData.error}: ${errorData.details}`
            : errorData.error || 'Failed to generate outline'
        );
      }

      const data = await response.json();
      console.log('API Response Data:', data);

      if (!data.content) {
        throw new Error('No outline was generated.');
      }

      // Set outline first
      setGeneratedOutline(data.content);
      console.log('Outline state updated');

      // Then update credits
      const updatedProfile = {
        ...profile,
        credits: profile.credits - creditCost,
      };

      try {
        await updateProfile(updatedProfile);
        console.log('Credits updated successfully');
      } catch (updateError) {
        console.error('Error updating credits:', updateError);
      }

      // Scroll to outline
      setTimeout(() => {
        const outlineElement = document.querySelector('.generated-outline');
        if (outlineElement) {
          outlineElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
          console.log('Scrolled to outline');
        }
      }, 100);

    } catch (err) {
      console.error('Error in outline generation:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      
      // Only attempt to refund credits if it's not a timeout or connection error
      if (profile && err instanceof Error && 
          !err.message.includes('timed out') && 
          !err.message.includes('Failed to connect')) {
        try {
          const refundProfile = {
            ...profile,
            credits: profile.credits,
          };
          await updateProfile(refundProfile);
        } catch (refundError) {
          console.error('Error refunding credits:', refundError);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClearForm = () => {
    setTopic('');
    setKeyPoints('');
    setTargetAudience('');
    setObjective('');
    setFormat('detailed');
    setKnowledgeLevel('intermediate');
    setTone(['professional', 'engaging']);
    setWordCount('1500');
    setGeneratedOutline(null);
    setError(null);
  };

  const formContent = useMemo(() => (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Topic <span className="text-red-500">*</span>
        </label>
        <textarea
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="e.g., Substack Growth Hacks"
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-gray-900"
          rows={2}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Key Points <span className="text-gray-500">(optional)</span>
        </label>
        <textarea
          value={keyPoints}
          onChange={(e) => setKeyPoints(e.target.value)}
          placeholder="e.g., Niche selection, Content strategy, Monetization"
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
          placeholder="e.g., Tech-savvy creators looking to grow their newsletter"
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-gray-900"
          rows={2}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Primary Objective <span className="text-red-500">*</span>
        </label>
        <select
          value={objective}
          onChange={(e) => setObjective(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-gray-900"
          required
        >
          <option value="">Select an objective</option>
          <option value="Educate">Educate</option>
          <option value="Entertain">Entertain</option>
          <option value="Inspire">Inspire</option>
          <option value="Persuade">Persuade</option>
          <option value="Solve a Problem">Solve a Problem</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Knowledge Level <span className="text-red-500">*</span>
        </label>
        <select
          value={knowledgeLevel}
          onChange={(e) => setKnowledgeLevel(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-gray-900"
          required
        >
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Word Count <span className="text-red-500">*</span>
        </label>
        <select
          value={wordCount}
          onChange={(e) => setWordCount(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-gray-900"
          required
        >
          <option value="1000">1,000 words</option>
          <option value="1500">1,500 words</option>
          <option value="2000">2,000 words</option>
          <option value="2500">2,500 words</option>
        </select>
      </div>

      <div className="flex gap-4">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-gradient-to-r from-amber-500 to-amber-600 text-white px-4 py-2 rounded-md 
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
          ) : 'Generate Outline'}
        </button>
        {!loading && (
          <button
            type="button"
            onClick={handleClearForm}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md 
                     hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
          >
            Clear Form
          </button>
        )}
      </div>
    </form>
  ), [topic, keyPoints, targetAudience, objective, format, knowledgeLevel, tone, wordCount, loading, handleSubmit]);

  const outlineContent = useMemo(() => {
    if (!generatedOutline) return null;
    return (
      <div className="mt-8 generated-outline">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Generated Outline</h2>
        <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200 prose prose-amber max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {generatedOutline}
          </ReactMarkdown>
        </div>
        <div className="mt-4 flex justify-end">
          <button
            onClick={() => setGeneratedOutline(null)}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Clear Outline
          </button>
        </div>
      </div>
    );
  }, [generatedOutline]);

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

      {formContent}
      {outlineContent}

      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full">
            <div className="flex flex-col items-center space-y-4">
              <svg className="animate-spin h-10 w-10 text-amber-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="text-gray-700 text-center">Generating your outline... This may take up to 4 minutes.</p>
              <p className="text-sm text-gray-500 text-center">Please keep this tab open.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 