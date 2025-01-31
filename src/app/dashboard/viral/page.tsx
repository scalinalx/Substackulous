import { Metadata } from 'next';
import ViralContent from './ViralContent';

export const metadata: Metadata = {
  title: 'Viral Note Generator',
  description: 'Generate viral social media notes for your Substack newsletter',
};

export default function ViralPage() {
  return <ViralContent />;
} 