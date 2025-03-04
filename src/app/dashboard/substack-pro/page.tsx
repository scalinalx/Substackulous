import { Metadata } from 'next';
import SubstackProContent from './SubstackProContent';

export const metadata: Metadata = {
  title: '🚀 The Substack Growth Engine',
  description: 'Analyze any Substack and get data-driven growth tips, find patterns behind the winners and single out the trends you need to double down on — just paste a link.',
};

export default function SubstackProPage() {
  return <SubstackProContent />;
} 