"use client";

import { useState } from 'react';
import Image from 'next/image';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import supabase from '@/lib/supabase';

interface GenerationOptions {
  title: string;
  theme: string;
  aspectRatio: string;
}

export default function ThumbnailGenerator() {
  const router = useRouter();
  const { profile, updateProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<{ urls: string[] } | null>(null);
  const [options, setOptions] = useState<GenerationOptions>({
    title: '',
    theme: '',
    aspectRatio: '3:2'
  });
  const creditCost = 30; // Fixed credit cost

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [status, setStatus] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!profile) {
      setError('User profile not found');
      return;
    }

    if (profile.credits < creditCost) {
      setError(`Not enough credits. You need ${creditCost} credits to generate thumbnails.`);
      return;
    }

    setLoading(true);
    setGeneratedImages(null);
    setError(null);

    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        setError('Authentication error. Please try again.');
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
          userId: profile.id
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
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
                  setGeneratedImages({ urls: tempImages });
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
    } catch (err) {
      setError((err as Error).message);
      setGeneratedImages(null);
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
    <div className="container mx-auto p-4">
      {/* Advanced Generation Section */}
      <div className="p-6 bg-white rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-2">Advanced Post Thumbnail Generator</h2>
        <p className="text-gray-600 mb-4">Generates 3 unique thumbnails with text overlay</p>
        
        {/* Credit Cost Display */}
        <div className="mb-6 flex items-center justify-between bg-amber-50 p-4 rounded-lg">
          <span className="text-amber-700">Credits required: {creditCost}</span>
          <span className="font-medium text-amber-700">Your balance: {profile?.credits ?? 0}</span>
        </div>

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
            disabled={loading}
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
                Generating...
              </span>
            ) : 'Generate Thumbnails'}
          </button>
        </div>
      </div>

      {/* Generated Images Display */}
      {generatedImages && (
        <div className="mt-8 space-y-6">
          <h3 className="text-xl font-semibold mb-4">Generated Images</h3>
          
          {/* Large Preview */}
          <div className="relative w-[85%] mx-auto">
            <Image
              src={generatedImages.urls[selectedImageIndex]}
              alt={`Generated image ${selectedImageIndex + 1}`}
              width={1200}
              height={800}
              className="rounded-lg shadow-xl"
            />
            <button
              onClick={() => handleDownload(generatedImages.urls[selectedImageIndex])}
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
            {generatedImages.urls.map((url, index) => (
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