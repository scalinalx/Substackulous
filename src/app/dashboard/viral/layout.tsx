import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Viral Note Generator',
  description: 'Generate viral social media notes for your Substack newsletter',
};

export default function ViralLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
} 