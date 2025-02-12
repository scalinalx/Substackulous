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
  const { user, isLoading, isAuthenticated, isInitialized } = useAuth();
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !isInitialized) return;
    
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [mounted, isInitialized, isLoading, isAuthenticated, router]);

  // Show loading state until mounted and auth is initialized
  if (!mounted || !isInitialized || isLoading) {
    return <LoadingSpinner />;
  }

  // If not authenticated, render nothing (redirect will happen)
  if (!isAuthenticated) {
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