import { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Viral Note Generator',
  description: 'Generate viral social media notes for your Substack newsletter',
};

export default function ViralPage() {
  // Redirect to dashboard
  redirect('/dashboard');

  // This won't be reached due to the redirect
  return null;
} 