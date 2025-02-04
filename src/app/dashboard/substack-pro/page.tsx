import { Metadata } from 'next';
import SubstackProContent from './SubstackProContent';

export const metadata: Metadata = {
  title: 'Substack PRO',
  description: 'Analyze and optimize your Substack newsletter for maximum growth and engagement',
};

export default function SubstackProPage() {
  return <SubstackProContent />;
} 