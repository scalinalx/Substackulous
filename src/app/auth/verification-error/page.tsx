'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function VerificationErrorPage() {
  const router = useRouter();
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = () => {
    setIsRetrying(true);
    
    // Get the verification link from the URL if available
    const urlParams = new URLSearchParams(window.location.search);
    const originalUrl = urlParams.get('originalUrl');
    
    if (originalUrl) {
      // If we have the original URL, redirect back to it
      window.location.href = originalUrl;
    } else {
      // Otherwise, just reload the page which might help in some cases
      window.location.reload();
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md dark:bg-gray-800">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900">
            <svg
              className="h-8 w-8 text-red-500 dark:text-red-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold dark:text-white">Verification Failed</h2>
          <p className="mt-2 text-gray-600 dark:text-gray-300">
            We couldn&apos;t verify your email. The verification link may have expired or is invalid.
          </p>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Try clicking the link in your email again, or request a new verification email.
          </p>
        </div>
        <div className="flex flex-col space-y-4">
          <button
            onClick={handleRetry}
            disabled={isRetrying}
            className="w-full rounded-md bg-indigo-600 px-4 py-2 text-center text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {isRetrying ? 'Retrying...' : 'Try Again'}
          </button>
          
          <Link
            href="/login"
            className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-center text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
          >
            Back to Sign In
          </Link>
          
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