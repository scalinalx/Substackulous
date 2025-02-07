import './globals.css';
import { useAuth } from '@/lib/contexts/AuthContext';
import LoadingSpinner from '@/components/LoadingSpinner';

export const metadata = {
  title: 'SUBSTACKULOUS - Grow Your Substack Revenue',
  description: '100x Your Substack Revenue in 90 Days',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
