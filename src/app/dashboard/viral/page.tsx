import Link from 'next/link';
import { Metadata } from 'next';
import ViralNoteGenerator from '@/app/components/ViralNoteGenerator';

export const metadata: Metadata = {
  title: 'Viral Note Generator',
  description: 'Generate viral social media notes for your Substack newsletter',
};

export default function ViralPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <Link
              href="/dashboard"
              className="text-indigo-600 hover:text-indigo-500 flex items-center gap-1"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Dashboard
            </Link>
            <h1 className="mt-4 text-3xl font-bold text-gray-900">Viral Note Generator</h1>
            <p className="mt-2 text-gray-600">
              Generate viral social media notes for your Substack newsletter using AI.
            </p>
          </div>
        </div>

        <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl">
          <ViralNoteGenerator />
        </div>
      </div>
    </div>
  );
} 