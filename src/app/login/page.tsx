'use client';
import { useEffect } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import LoginForm from '@/components/LoginForm';
import LoadingSpinner from '@/components/LoadingSpinner';
import VerifySession from '@/components/VerifySession';
import { Suspense } from 'react';

// Wrapper component to handle search params
function LoginPageContent() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const hasCode = searchParams?.has('code');

  useEffect(() => {
    // If user is already logged in and there's no code, redirect to dashboard
    if (user && !hasCode && !isLoading) {
      router.push('/dashboard');
    }
  }, [user, router, hasCode, isLoading]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <>
      <LoginForm />
      {hasCode && <VerifySession />}
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <LoginPageContent />
    </Suspense>
  );
}
