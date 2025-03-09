'use client';

import Link from 'next/link';

export default function VerificationErrorPage() {
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
            We couldn't verify your email. The verification link may have expired or is invalid.
          </p>
        </div>
        <div className="flex flex-col space-y-4">
          <Link
            href="/login"
            className="w-full rounded-md bg-indigo-600 px-4 py-2 text-center text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
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