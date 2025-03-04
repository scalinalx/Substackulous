import { Metadata } from 'next';
import ThumbnailsContent from './ThumbnailsContent';

export const metadata: Metadata = {
  title: '📸 Instant Post Image Generator',
  description: 'Instantly create 3 eye-catching images for your post.',
};

export default function ThumbnailsPage() {
  return <ThumbnailsContent />;
} 