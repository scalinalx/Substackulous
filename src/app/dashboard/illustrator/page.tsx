import { Metadata } from 'next';
import dynamic from 'next/dynamic';

const IllustratorContent = dynamic(() => import('./IllustratorContent'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
    </div>
  ),
});

export const metadata: Metadata = {
  title: 'Idea Illustrator',
  description: 'Transform your ideas into stunning visuals. No design skills needed.',
};

export default function IllustratorPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <IllustratorContent />
    </div>
  );
} 