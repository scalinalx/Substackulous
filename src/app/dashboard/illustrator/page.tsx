import { Metadata } from 'next';
import IllustratorContent from './IllustratorContent';

export const metadata: Metadata = {
  title: 'Idea Illustrator',
  description: 'Generate unique illustrations for your Substack posts',
};

export default function IllustratorPage() {
  return <IllustratorContent />;
} 