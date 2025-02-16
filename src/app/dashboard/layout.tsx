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
  const { user, isLoading, isAuthenticated, isInitialized, profile } = useAuth();
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    // Only redirect if we're fully initialized and not loading
    if (isInitialized && !isLoading) {
      if (!isAuthenticated || !user || !profile) {
        router.replace('/login');
      }
    }
  }, [mounted, isInitialized, isLoading, isAuthenticated, user, profile, router]);

  // Show loading state while initializing or loading
  if (!mounted || !isInitialized || isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  // If not authenticated, show minimal loading state (redirect will happen)
  if (!isAuthenticated || !user || !profile) {
    return (
      <div className="h-screen w-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
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