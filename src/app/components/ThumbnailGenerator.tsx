"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import supabase from '@/lib/supabase';
import { toast } from 'sonner';

interface GenerationOptions {
  title: string;
  theme: string;
  aspectRatio: string;
}

export default function ThumbnailGenerator() {
  const router = useRouter();
  const { user, profile, updateProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<{ urls: string[] } | null>(null);
  const [options, setOptions] = useState<GenerationOptions>({
    title: '',
    theme: '',
    aspectRatio: '3:2'
  });
  const [mounted, setMounted] = useState(false);
  const creditCost = 30; // Fixed credit cost

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [status, setStatus] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Handle mounting to prevent hydration issues
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Don't render anything until mounted
  if (!mounted) {
    return null;
  }

  const handleGenerate = async () => {
    if (!user) {
      setError('User not found');
      return;
    }

    setLoading(true);
    setGeneratedImages(null);
    setError(null);

    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        setError('Authentication error. Please try again.');
        router.replace('/login');
        return;
      }

      const prompt = `A viral thumbnail about "${options.title}". Clickbait, Eye-catchy, Engaging visuals. Viral. ${options.theme} theme. Inspiring. CGI. Text Masking.`;

      const response = await fetch('/api/replicate/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          prompt,
          model: 'ideogram-ai/ideogram-v2-turbo',
          aspectRatio: options.aspectRatio,
          userId: user.id
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 401) {
          // Handle authentication error
          setError('Session expired. Please refresh the page or log in again.');
          router.replace('/login');
          return;
        }
        throw new Error(errorData.error || 'Failed to generate images');
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
                  setGeneratedImages({ urls: [...tempImages] });
                  // Deduct credits after first successful image generation
                  if (tempImages.length === 1 && profile) {
                    const updatedCredits = profile.credits - creditCost;
                    await updateProfile({
                      credits: updatedCredits
                    });
                  }
                  break;
                case 'error':
                  setError(data.message);
                  break;
                case 'complete':
                  if (data.imageUrls.length === 0) {
                    throw new Error('No images were generated successfully');
                  }
                  setGeneratedImages({ urls: data.imageUrls });
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

      toast.success('Images generated successfully!');
    } catch (err) {
      console.error('Error generating images:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate images. Please try again.';
      setError(errorMessage);
      
      if (errorMessage.includes('Not authenticated') || errorMessage.includes('Session expired')) {
        router.replace('/login');
      }
    } finally {
      setLoading(false);
      setStatus('');
    }
  };

  const handleDownload = async (url: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = 'thumbnail.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Error downloading image:', error);
      alert('Failed to download image. Please try again.');
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

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Title</label>
          <input
            type="text"
            value={options.title}
            onChange={(e) => setOptions({ ...options, title: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            placeholder="Enter your title"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Theme</label>
          <input
            type="text"
            value={options.theme}
            onChange={(e) => setOptions({ ...options, theme: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            placeholder="e.g., dark, modern, vibrant"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Aspect Ratio</label>
          <select
            value={options.aspectRatio}
            onChange={(e) => setOptions({ ...options, aspectRatio: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
          >
            <option value="3:2">Landscape (3:2)</option>
            <option value="1:1">Square (1:1)</option>
          </select>
        </div>

        <button
          onClick={handleGenerate}
          disabled={loading || !options.title || !options.theme || (profile?.credits || 0) < creditCost}
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
              {status || 'Generating...'}
            </span>
          ) : 'Generate Thumbnail'}
        </button>
      </div>

      {generatedImages && generatedImages.urls.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Generated Thumbnails</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {generatedImages.urls.map((url, index) => (
              <div key={index} className="relative group">
                <Image
                  src={url}
                  alt={`Generated thumbnail ${index + 1}`}
                  width={500}
                  height={300}
                  className="rounded-lg shadow-md hover:shadow-lg transition-shadow"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity rounded-lg" />
                <button
                  onClick={() => window.open(url, '_blank')}
                  className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 