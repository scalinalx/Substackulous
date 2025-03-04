'use client';

import DashboardNav from '@/app/components/DashboardNav';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  const { isInitialized, isLoading } = useAuth();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Wait for mounting and initial auth, but do not condition on isLoading.
  if (!mounted || !isInitialized) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 relative">
      <DashboardNav />
      <main className="pt-16">
        {children}
        {isLoading && (
          <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
            <LoadingSpinner />
          </div>
        )}
      </main>
    </div>
  );
} 