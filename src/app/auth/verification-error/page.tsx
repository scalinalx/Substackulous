'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// Create a client component that safely uses useSearchParams
function VerificationErrorContent() {
  const router = useRouter();
  const [isRetrying, setIsRetrying] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  
  // Get the original URL from query params safely
  useEffect(() => {
    // This is safe to use in useEffect
    const searchParams = new URLSearchParams(window.location.search);
    setOriginalUrl(searchParams.get('originalUrl'));
  }, []);
  
  // Auto-redirect after countdown
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      // Try the login page directly
      router.push('/login');
    }
  }, [countdown, router]);

  const handleRetry = () => {
    setIsRetrying(true);
    
    // If we have the original URL, try it again
    if (originalUrl) {
      window.location.href = originalUrl;
    } else {
      // Otherwise, just go to login
      router.push('/login');
    }
  };

  const handleGoToLogin = () => {
    router.push('/login');
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md dark:bg-gray-800">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900">
            <svg
              className="h-8 w-8 text-yellow-500 dark:text-yellow-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold dark:text-white">Verification In Progress</h2>
          <p className="mt-2 text-gray-600 dark:text-gray-300">
            Your email verification is being processed. Please proceed to the login page.
          </p>
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            Redirecting to login in {countdown} seconds...
          </p>
        </div>
        <div className="flex flex-col space-y-4">
          <button
            onClick={handleGoToLogin}
            className="w-full rounded-md bg-indigo-600 px-4 py-2 text-center text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            Go to Login
          </button>
          
          <button
            onClick={handleRetry}
            disabled={isRetrying}
            className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-center text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 disabled:opacity-50"
          >
            {isRetrying ? 'Retrying...' : 'Try Again'}
          </button>
          
          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            Need help?{' '}
            <Link href="/contact" className="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
              Contact Support
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

// Main component with Suspense boundary
export default function VerificationErrorPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md dark:bg-gray-800">
          <div className="text-center">
            <p>Loading...</p>
          </div>
        </div>
      </div>
    }>
      <VerificationErrorContent />
    </Suspense>
  );
} 