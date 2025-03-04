import { Metadata } from 'next';
import TitlesContent from './TitlesContent';

export const metadata: Metadata = {
  title: '🔥 Click-Worthy Title Maker',
  description: 'Turn any idea into a scroll-stopping, must-click headlines that grab attention.',
};

export default function TitlesPage() {
  return <TitlesContent />;
} 