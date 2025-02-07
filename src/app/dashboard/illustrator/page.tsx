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

export const metadata = {
  title: 'Idea Illustrator | Substackulous',
  description: 'Generate unique illustrations for your Substack posts using AI.',
};

export default function IllustratorPage() {
  return <IllustratorContent />;
} 