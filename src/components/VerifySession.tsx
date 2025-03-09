'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/clients';

export default function VerifySession({ code }: { code: string }) {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    // Store the code in localStorage to prevent duplicate processing
    const processedCodes = JSON.parse(localStorage.getItem('processedCodes') || '[]');
    if (processedCodes.includes(code)) {
      console.log('Code already processed, redirecting to login');
      router.push('/login');
      return;
    }

    if (code && !isProcessing && attempts < 3) {
      const exchangeCode = async () => {
        setIsProcessing(true);
        try {
          console.log('Exchanging code for session (attempt ' + (attempts + 1) + '):', code);
          
          // Clear any existing sessions first
          await supabase.auth.signOut();
          
          // Exchange the code for a session
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          
          if (error) {
            console.error('Error exchanging code:', error);
            setError(error.message);
            setAttempts(prev => prev + 1);
          } else {
            console.log('Successfully exchanged code for session:', data);
            
            // Store the code in localStorage to prevent duplicate processing
            processedCodes.push(code);
            localStorage.setItem('processedCodes', JSON.stringify(processedCodes));
            
            // Redirect to dashboard after successful verification
            router.push('/dashboard');
          }
        } catch (err) {
          console.error('Exception during code exchange:', err);
          setError(err instanceof Error ? err.message : 'An unknown error occurred');
          setAttempts(prev => prev + 1);
        } finally {
          setIsProcessing(false);
        }
      };
      
      exchangeCode();
    } else if (attempts >= 3) {
      // After 3 attempts, give up and show an error
      setError('Failed to verify your account after multiple attempts. Please try again later.');
    }
  }, [code, router, isProcessing, attempts]);

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
              {attempts > 0 && (
                <p className="text-yellow-600 mt-2 text-sm">
                  Attempt {attempts + 1} of 3...
                </p>
              )}
            </div>
          ) : (
            <div className="text-red-500 mb-4">
              <p>{error}</p>
              <div className="mt-4 flex flex-col gap-2">
                {attempts < 3 && (
                  <button 
                    onClick={() => setAttempts(prev => prev + 1)}
                    className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
                  >
                    Try Again
                  </button>
                )}
                <button 
                  onClick={() => router.push('/login')}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
                >
                  Back to Login
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 