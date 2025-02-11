import { Metadata } from 'next';
import HomeRunContent from './HomeRunContent';

export const metadata: Metadata = {
  title: 'The Home Run | Substackulous',
  description: 'Generate viral content for your Substack with AI-powered brainstorming, notes, and posts.',
};

export default function HomeRunPage() {
  return <HomeRunContent />;
} 