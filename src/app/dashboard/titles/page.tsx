import { Metadata } from 'next';
import TitlesContent from './TitlesContent';

export const metadata: Metadata = {
  title: 'Clickworthy Title Generator',
  description: 'Generate attention-grabbing titles that drive clicks and engagement',
};

export default function TitlesPage() {
  return <TitlesContent />;
} 