import { Metadata } from 'next';
import ThumbnailsContent from './ThumbnailsContent';

export const metadata: Metadata = {
  title: 'Advanced Post Thumbnail Generator',
  description: 'Create eye-catching thumbnails with AI-powered text overlay',
};

export default function ThumbnailsPage() {
  return <ThumbnailsContent />;
} 