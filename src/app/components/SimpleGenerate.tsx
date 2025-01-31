'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import Image from 'next/image';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface SimpleGenerateProps {
  creditCost?: number;
}

export default function SimpleGenerate({ creditCost = 25 }: SimpleGenerateProps) {
  const supabase = createClientComponentClient();
  const { profile, updateProfile } = useAuth();
  const [mainIdea, setMainIdea] = useState('');
  const [theme, setTheme] = useState('');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [aspectRatio, setAspectRatio] = useState('3:2');
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!mainIdea.trim()) {
      setError('Main idea is required');
      return;
    }

    if (!theme.trim()) {
      setError('Theme is required');
      return;
    }

    if (!profile) {
      setError('User profile not found');
      return;
    }

    if ((profile?.credits || 0) < creditCost) {
      setError(`Not enough credits. You need ${creditCost} credits to generate illustrations.`);
      return;
    }

    setError(null);
    setGenerating(true);
    setGeneratedImages([]);
    setLoading(true);

    try {
      console.log('Getting session...');
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      console.log('Session result:', { sessionData, error: sessionError });
      
      if (sessionError) {
        setError(`Authentication error: ${sessionError.message}`);
        return;
      }
      
      if (!sessionData?.session) {
        setError('Not authenticated - no session found');
        return;
      }

      const prompt = `A viral image about ${mainIdea}. Clickbait, Eye-catchy, Engaging visuals. Viral. ${theme} theme. Inspiring.`;

      const response = await fetch('/api/replicate/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionData.session.access_token}`
        },
        body: JSON.stringify({
          prompt,
          model: 'flux',
          aspectRatio,
          userId: profile.id
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate images');
      }

      if (!response.body) {
        throw new Error('No response body received');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      const tempImages: string[] = [];
      let completionReceived = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(5));
              
              switch (data.status) {
                case 'generating':
                  setStatus(data.message);
                  break;
                case 'success':
                  tempImages[data.index] = data.imageUrl;
                  setGeneratedImages([...tempImages]);
                  // Deduct credits after first successful image generation
                  if (tempImages.length === 1) {
                    const updatedProfile = {
                      ...profile,
                      credits: (profile?.credits || 0) - creditCost,
                    };
                    await updateProfile(updatedProfile);
                  }
                  break;
                case 'error':
                  setError(data.message);
                  break;
                case 'complete':
                  if (data.imageUrls.length === 0) {
                    throw new Error('No images were generated successfully');
                  }
                  setGeneratedImages(data.imageUrls);
                  completionReceived = true;
                  break;
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
      setGeneratedImages([]);
    } finally {
      setGenerating(false);
      setLoading(false);
      setStatus('');
    }
  };

  const handleDownload = async (url: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `illustration-${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error('Failed to download image:', err);
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
            Main Idea <span className="text-red-500">*</span>
          </label>
          <textarea
            value={mainIdea}
            onChange={(e) => setMainIdea(e.target.value)}
            placeholder="e.g., Building Wealth Through Smart Investments"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-gray-900"
            rows={2}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Theme <span className="text-red-500">*</span>
          </label>
          <textarea
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            placeholder="e.g., Modern, Professional, Tech"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-gray-900"
            rows={2}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Aspect Ratio
          </label>
          <select
            value={aspectRatio}
            onChange={(e) => setAspectRatio(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-gray-900"
          >
            <option value="3:2">3:2 (Landscape)</option>
            <option value="2:3">2:3 (Portrait)</option>
            <option value="1:1">1:1 (Square)</option>
            <option value="16:9">16:9 (Widescreen)</option>
          </select>
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
              Generating Illustrations...
            </span>
          ) : 'Generate Illustrations'}
        </button>
      </form>

      {generatedImages.length > 0 && (
        <div className="mt-8 space-y-6">
          <h3 className="text-xl font-semibold mb-4">Generated Images</h3>
          
          {/* Large Preview */}
          <div className="relative w-[85%] mx-auto">
            <Image
              src={generatedImages[selectedImageIndex]}
              alt={`Generated image ${selectedImageIndex + 1}`}
              width={1200}
              height={800}
              className="rounded-lg shadow-xl"
            />
            <button
              onClick={() => handleDownload(generatedImages[selectedImageIndex])}
              className="absolute bottom-4 right-4 bg-gradient-to-r from-amber-500 to-amber-600 text-white px-6 py-3 rounded-lg shadow-lg hover:from-amber-600 hover:to-amber-700 transition-colors flex items-center space-x-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              <span>Download Image</span>
            </button>
          </div>

          {/* Thumbnails */}
          <div className="flex justify-center gap-4 mt-4">
            {generatedImages.map((url, index) => (
              <button
                key={index}
                onClick={() => setSelectedImageIndex(index)}
                className={`relative rounded-lg overflow-hidden transition-all ${
                  selectedImageIndex === index ? 'ring-4 ring-amber-500 ring-offset-2' : 'hover:ring-2 hover:ring-amber-300'
                }`}
              >
                <Image
                  src={url}
                  alt={`Thumbnail ${index + 1}`}
                  width={200}
                  height={150}
                  className="rounded-lg"
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 