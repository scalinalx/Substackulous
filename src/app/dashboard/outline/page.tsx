'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface OutlineRequest {
  topic: string;
  keyPoints: string;
  targetAudience: string;
  objective: 'Brand awareness' | 'Lead generation' | 'Thought leadership' | 'Community building' | 'Product promotion';
  format: 'How-to guide' | 'Listicle' | 'Case study' | 'Opinion piece' | 'Interview/Q&A' | 'Data-driven analysis';
  knowledgeLevel: 'Beginner' | 'Intermediate' | 'Advanced';
  tone: string[];
  wordCount: number;
}

export default function OutlineGenerator() {
  const { profile, updateProfile } = useAuth();
  const [formData, setFormData] = useState<OutlineRequest>({
    topic: '',
    keyPoints: '',
    targetAudience: '',
    objective: 'Thought leadership',
    format: 'How-to guide',
    knowledgeLevel: 'Intermediate',
    tone: ['Professional'],
    wordCount: 1500
  });
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [outline, setOutline] = useState<string | null>(null);
  const creditCost = 2;

  const handleToneToggle = (tone: string) => {
    setFormData(prev => ({
      ...prev,
      tone: prev.tone.includes(tone)
        ? prev.tone.filter(t => t !== tone)
        : [...prev.tone, tone]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.topic.trim()) {
      setError('Topic is required');
      return;
    }

    if ((profile?.credits || 0) < creditCost) {
      setError(`Not enough credits. You need ${creditCost} credits to generate an outline.`);
      return;
    }

    setError(null);
    setGenerating(true);
    setOutline(null);

    try {
      const response = await fetch('/api/deepseek/generate-outline', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to generate outline');
      }

      const data = await response.json();
      setOutline(data.outline);

      // Update credits only after successful completion
      if (profile) {
        const updatedProfile = {
          ...profile,
          credits: (profile.credits || 0) - creditCost,
        };
        await updateProfile(updatedProfile);
      }
    } catch (err) {
      setError((err as Error).message);
      setOutline(null);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center mb-8">
        <Link
          href="/dashboard"
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <svg
            className="w-5 h-5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Back to Dashboard
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Generate Outline</h1>
        <p className="text-gray-600 mb-8">
          Create a structured outline for your next viral post
        </p>

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

        <div className="mb-6 flex items-center justify-between bg-amber-50 p-4 rounded-lg">
          <span className="text-amber-700">Credits required: {creditCost}</span>
          <span className="font-medium text-amber-700">Your balance: {profile?.credits ?? 0}</span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Topic <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.topic}
              onChange={(e) => setFormData(prev => ({ ...prev, topic: e.target.value }))}
              placeholder="What's your post about?"
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
              value={formData.keyPoints}
              onChange={(e) => setFormData(prev => ({ ...prev, keyPoints: e.target.value }))}
              placeholder="Key points you want to cover in your post"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-gray-900"
              rows={4}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Target Audience <span className="text-gray-500">(optional)</span>
            </label>
            <textarea
              value={formData.targetAudience}
              onChange={(e) => setFormData(prev => ({ ...prev, targetAudience: e.target.value }))}
              placeholder="Who are you writing for?"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-gray-900"
              rows={2}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Primary Objective
            </label>
            <select
              value={formData.objective}
              onChange={(e) => setFormData(prev => ({ ...prev, objective: e.target.value as OutlineRequest['objective'] }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-gray-900"
            >
              <option value="Brand awareness">Brand awareness</option>
              <option value="Lead generation">Lead generation</option>
              <option value="Thought leadership">Thought leadership</option>
              <option value="Community building">Community building</option>
              <option value="Product promotion">Product promotion</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Content Format
            </label>
            <select
              value={formData.format}
              onChange={(e) => setFormData(prev => ({ ...prev, format: e.target.value as OutlineRequest['format'] }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-gray-900"
            >
              <option value="How-to guide">How-to guide</option>
              <option value="Listicle">Listicle</option>
              <option value="Case study">Case study</option>
              <option value="Opinion piece">Opinion piece</option>
              <option value="Interview/Q&A">Interview/Q&A</option>
              <option value="Data-driven analysis">Data-driven analysis</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Knowledge Level
            </label>
            <select
              value={formData.knowledgeLevel}
              onChange={(e) => setFormData(prev => ({ ...prev, knowledgeLevel: e.target.value as OutlineRequest['knowledgeLevel'] }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-gray-900"
            >
              <option value="Beginner">Beginner (100% new to topic)</option>
              <option value="Intermediate">Intermediate (Some familiarity)</option>
              <option value="Advanced">Advanced (Seeking deep insights)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tone Selection
            </label>
            <div className="flex flex-wrap gap-2">
              {['Professional', 'Conversational', 'Authoritative', 'Friendly', 'Technical'].map((tone) => (
                <button
                  key={tone}
                  type="button"
                  onClick={() => handleToneToggle(tone)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors
                    ${formData.tone.includes(tone)
                      ? 'bg-amber-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                  {tone}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Target Word Count: {formData.wordCount} words
            </label>
            <input
              type="range"
              min="800"
              max="2500"
              step="100"
              value={formData.wordCount}
              onChange={(e) => setFormData(prev => ({ ...prev, wordCount: parseInt(e.target.value) }))}
              className="w-full"
            />
          </div>

          <button
            type="submit"
            disabled={generating || (profile?.credits ?? 0) < creditCost}
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
                Generating Outline...
              </span>
            ) : 'Generate Outline'}
          </button>
        </form>

        {outline && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8"
          >
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Generated Outline</h2>
            <div className="whitespace-pre-wrap text-gray-900 bg-gray-50 p-6 rounded-lg border border-gray-200">
              {outline}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
} 