import { Metadata } from 'next';
import OutlineContent from './OutlineContent';

export const metadata: Metadata = {
  title: '📝 Effortless Post Outline Builder',
  description: 'Drop in an idea, get a ready-to-use post structure—just fill in the blanks and hit publish.',
};

export default function OutlinePage() {
  return <OutlineContent />;
} 