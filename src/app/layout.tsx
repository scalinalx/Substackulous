import './globals.css';
import { Inter } from 'next/font/google';
import { AuthProvider } from '@/lib/contexts/AuthContext';
import { Metadata } from 'next';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    template: '%s | Substackulous',
    default: 'Substackulous - AI-Powered Tools for Substack Writers'
  },
  description: 'Enhance your Substack newsletter with AI-powered tools for content creation, analysis, and optimization.',
  keywords: ['Substack', 'Newsletter', 'AI', 'Content Creation', 'Writing Tools'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
