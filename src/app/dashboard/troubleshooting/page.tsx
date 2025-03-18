'use client';

import { useAuth } from '@/lib/contexts/AuthContext';
import { redirect } from 'next/navigation';
import LoadingSpinner from '@/components/LoadingSpinner';
import Link from 'next/link';

export default function TroubleshootingPage() {
  const { user, isLoading, isAuthenticated, isInitialized } = useAuth();

  if (!isInitialized || isLoading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    redirect('/login');
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <Link
            href="/dashboard"
            className="text-amber-600 hover:text-amber-500 dark:text-amber-500 dark:hover:text-amber-400 flex items-center gap-1"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Dashboard
          </Link>
          <h1 className="mt-4 text-3xl font-bold text-gray-900 dark:text-white">Troubleshooting</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-300">
            Find solutions to common issues and get help with your Substackulous experience.
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Common Issues</h2>
        </div>
        
        <div className="px-6 py-5">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Credits Not Updating</h3>
              <p className="mt-2 text-gray-600 dark:text-gray-300">
                If your credits are not updating after a purchase or usage, try refreshing the page. If the issue persists, contact support.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Generation Issues</h3>
              <p className="mt-2 text-gray-600 dark:text-gray-300">
                If you're experiencing issues with content generation, ensure you have sufficient credits and try again. If problems continue, check your internet connection.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Account Access</h3>
              <p className="mt-2 text-gray-600 dark:text-gray-300">
                Having trouble accessing your account? Try signing out and signing back in. If you're still experiencing issues, use the password reset option.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Need More Help?</h2>
        </div>
        
        <div className="px-6 py-5">
          <p className="text-gray-600 dark:text-gray-300">
            If you're still experiencing issues, please contact our support team at support@substackulous.com. We're here to help!
          </p>
        </div>
      </div>
    </div>
  );
} 