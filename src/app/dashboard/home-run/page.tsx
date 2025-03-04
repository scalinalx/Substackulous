import { Metadata } from 'next';
import HomeRunContent from './HomeRunContent';

export const metadata: Metadata = {
  title: 'The Home Run | Substackulous',
  description: 'Analyze any Substack, and get in seconds viral post titles, and high-engagement viral notes.',
};

export default function HomeRunPage() {
  return <HomeRunContent />;
} 