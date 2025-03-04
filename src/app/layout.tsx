import './globals.css';
import { Noto_Sans } from 'next/font/google';
import { AuthProvider } from '@/lib/contexts/AuthContext';
import { ThemeProvider } from '@/lib/contexts/ThemeContext';
import { Metadata } from 'next';

const notoSans = Noto_Sans({
  subsets: ['latin'],
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
  style: ['normal', 'italic'],
  variable: '--font-noto-sans',
});

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
    <html lang="en" className={notoSans.variable}>
      <body className={notoSans.className}>
        <AuthProvider>
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
