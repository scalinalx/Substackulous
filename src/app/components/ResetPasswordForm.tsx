"use client";

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/clients';
import { useAuth } from '@/lib/contexts/AuthContext';

export default function ResetPasswordForm() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { session } = useAuth();

  // Clean up function to handle navigation interruption
  useEffect(() => {
    return () => {
      // If we're navigating away while loading, sign out to ensure clean state
      if (loading) {
        supabase.auth.signOut();
      }
    };
  }, [loading]);

  useEffect(() => {
    // Check if there's an error in the URL (like expired token)
    const errorDescription = searchParams.get('error_description');
    if (errorDescription) {
      setError(decodeURIComponent(errorDescription));
    }

    // Check if we're already authenticated
    if (session && !errorDescription) {
      // If we have a session and no error, redirect to dashboard
      router.replace('/dashboard');
    } else if (!session && !errorDescription && !searchParams.get('code')) {
      // If no session, no error, and no reset code, redirect to login
      router.replace('/');
    }
  }, [searchParams, router, session]);

  // Handle redirect after success
  useEffect(() => {
    if (success) {
      // Redirect after success
      const timer = setTimeout(() => {
        router.push('/');
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [success, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Don't allow multiple submissions
    if (loading) return;
    
    setError(null);
    setLoading(true);

    try {
      if (newPassword !== confirmPassword) {
        throw new Error('Passwords do not match');
      }

      if (newPassword.length < 6) {
        throw new Error('Password must be at least 6 characters long');
      }

      // Update the password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) throw updateError;

      // Sign out first
      await supabase.auth.signOut();

      // Then set success state
      setSuccess(true);
      setLoading(false);
    } catch (err) {
      console.error('Error in password reset:', err);
      setError(err instanceof Error ? err.message : 'Failed to reset password');
      setLoading(false);
      // Try to sign out on error
      try {
        await supabase.auth.signOut();
      } catch (signOutError) {
        console.error('Error signing out after error:', signOutError);
      }
    }
  };

  // If success, show only the success message
  if (success) {
    return (
      <div className="flex items-center justify-center px-4 h-screen">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-xl shadow-2xl p-8">
            <div className="p-4 bg-green-50 border-l-4 border-green-500 text-green-700 text-center">
              <p className="font-medium">Password successfully reset!</p>
              <p className="text-sm mt-1">Redirecting to login page...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center px-4 h-screen">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-xl shadow-2xl p-8 space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Reset Your Password
            </h2>
            <p className="text-gray-600">
              Please enter your new password below
            </p>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700">
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                New Password
              </label>
              <input
                id="newPassword"
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={loading}
                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm shadow-sm 
                         placeholder-gray-400 text-gray-900
                         focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500
                         transition-all duration-200
                         disabled:bg-gray-50 disabled:text-gray-500"
                placeholder="Enter your new password"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm New Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm shadow-sm 
                         placeholder-gray-400 text-gray-900
                         focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500
                         transition-all duration-200
                         disabled:bg-gray-50 disabled:text-gray-500"
                placeholder="Confirm your new password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md 
                       shadow-sm text-sm font-medium text-white 
                       bg-gradient-to-r from-amber-500 to-amber-600
                       hover:from-amber-600 hover:to-amber-700 
                       focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 
                       disabled:opacity-50 transform transition-all duration-200 hover:scale-[1.02]"
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </span>
              ) : (
                'Reset Password'
              )}
            </button>
          </form>

          {!loading && (
            <div className="text-center">
              <button
                onClick={() => router.push('/')}
                className="text-sm text-amber-600 hover:text-amber-500 transition-colors duration-200"
              >
                Back to Sign In
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 