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
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (mounted && !loading && !user) {
      console.log('No user found in DashboardLayout, redirecting to home');
      router.replace('/');
    }
  }, [mounted, loading, user, router]);

  if (!mounted || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
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