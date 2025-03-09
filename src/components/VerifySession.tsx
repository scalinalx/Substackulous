'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/clients';

export default function VerifySession() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams?.get('code');
    
    if (code && !isProcessing) {
      const exchangeCode = async () => {
        setIsProcessing(true);
        try {
          console.log('Exchanging code for session:', code);
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          
          if (error) {
            console.error('Error exchanging code:', error);
            setError(error.message);
          } else {
            console.log('Successfully exchanged code for session');
            // Redirect to dashboard after successful verification
            router.push('/dashboard');
          }
        } catch (err) {
          console.error('Exception during code exchange:', err);
          setError(err instanceof Error ? err.message : 'An unknown error occurred');
        } finally {
          setIsProcessing(false);
        }
      };
      
      exchangeCode();
    }
  }, [searchParams, router, isProcessing]);

  if (!searchParams?.get('code')) {
    return null;
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full dark:bg-gray-800">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4 dark:text-white">
            {error ? 'Verification Failed' : 'Verifying Your Account'}
          </h2>
          
          {!error ? (
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
              <p className="text-gray-600 dark:text-gray-300">
                Please wait while we verify your account...
              </p>
            </div>
          ) : (
            <div className="text-red-500 mb-4">
              <p>{error}</p>
              <button 
                onClick={() => router.push('/login')}
                className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
              >
                Back to Login
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 