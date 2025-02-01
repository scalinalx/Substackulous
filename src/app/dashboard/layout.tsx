'use client';

import DashboardNav from '@/app/components/DashboardNav';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !loading) {
      if (!user) {
        console.log('No user found in DashboardLayout, redirecting to home');
        router.replace('/');
      }
    }
  }, [mounted, loading, user, router]);

  // Show loading state only during initial mount
  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't show loading state for subsequent auth checks
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardNav />
        <main className="pt-16">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-amber-500"></div>
          </div>
        </main>
      </div>
    );
  }

  // If not authenticated, render nothing (redirect will happen)
  if (!user) {
    return null;
  }

  // Show dashboard layout if authenticated
  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNav />
      <main className="pt-16">
        {children}
      </main>
    </div>
  );
} 