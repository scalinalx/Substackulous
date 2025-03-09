'use client';
import { useEffect, useState } from 'react';
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
  const [code, setCode] = useState<string | null>(null);

  useEffect(() => {
    // Get the code from the URL
    const urlCode = searchParams?.get('code');
    if (urlCode) {
      setCode(urlCode);
    }

    // If user is already logged in and there's no code, redirect to dashboard
    if (user && !urlCode && !isLoading) {
      router.push('/dashboard');
    }
  }, [user, router, searchParams, isLoading]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <>
      <LoginForm />
      {code && <VerifySession code={code} />}
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
