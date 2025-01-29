"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { signIn, signUp, resetPassword, error, loading, user } = useAuth();
  const router = useRouter();
  const [verificationMessage, setVerificationMessage] = useState('');

  const scrollToForm = () => {
    const formElement = document.getElementById('auth-form');
    formElement?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && user) {
      router.replace('/dashboard');
    }
  }, [mounted, user, router]);

  // Show loading state while checking auth
  if (!mounted || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  // If already authenticated, don't render login form
  if (user) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isForgotPassword) {
        const result = await resetPassword(email);
        if (result.success) {
          setVerificationMessage(result.message);
        }
      } else if (isSignUp) {
        const result = await signUp(email, password);
        if (result.success) {
          setVerificationMessage(result.message);
        }
      } else {
        await signIn(email, password);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-300 via-yellow-400 to-orange-400">
      {/* Hero Section */}
      <div className="relative w-full h-[90vh] mb-16">
        <Image
          src="/nq.png"
          alt="Substackulous Hero"
          fill
          className="object-cover"
          priority
        />
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 to-transparent" />
        
        {/* Hero Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
          <h1 className="text-6xl md:text-8xl font-bold text-white mb-4 animate-fade-in-down">
            SUBSTACKULOUS
          </h1>
          <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-2xl animate-fade-in-up">
            Generate viral thumbnails, engaging titles, and compelling outlines for your Substack posts
          </p>
        </div>

        {/* Get Started Button */}
        <button
          onClick={scrollToForm}
          className="absolute bottom-8 left-8 px-8 py-4 bg-black text-white rounded-full 
                   font-medium text-lg transform transition-all duration-300
                   hover:scale-105 hover:bg-amber-500 hover:shadow-xl
                   hover:rotate-2 focus:outline-none focus:ring-2 focus:ring-amber-500
                   group"
        >
          Get Started
          <span className="absolute inset-0 w-full h-full rounded-full bg-white/20 
                         group-hover:scale-150 group-hover:opacity-0 
                         transition-all duration-500"></span>
        </button>
      </div>

      {/* Auth Form Section */}
      <div id="auth-form" className="max-w-md mx-auto px-4 pb-16 scroll-mt-8">
        <div className="bg-white rounded-xl shadow-2xl p-8 space-y-6 
                      transform transition-all duration-300 hover:shadow-amber-200/50">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {isForgotPassword 
                ? 'Reset Your Password'
                : isSignUp 
                  ? 'Create your account' 
                  : 'Welcome back'}
            </h2>
          </div>

          {/* Verification Message */}
          {verificationMessage && (
            <div className="mb-6 p-4 bg-amber-50 border-l-4 border-amber-500 text-amber-700">
              <p className="font-medium">
                {isForgotPassword ? 'Password Reset Email Sent' : 'Email Verification Required'}
              </p>
              <p className="text-sm mt-1">{verificationMessage}</p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700">
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm shadow-sm 
                         placeholder-gray-400 text-gray-900
                         focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500
                         transition-all duration-200"
              />
            </div>

            {!isForgotPassword && (
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  required={!isForgotPassword}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm shadow-sm 
                           placeholder-gray-400 text-gray-900
                           focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500
                           transition-all duration-200"
                />
              </div>
            )}

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
                isForgotPassword 
                  ? 'Send Reset Instructions'
                  : isSignUp 
                    ? 'Create Account' 
                    : 'Sign In'
              )}
            </button>
          </form>

          <div className="text-center space-y-2">
            {!isForgotPassword && (
              <button
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-sm text-amber-600 hover:text-amber-500 transition-colors duration-200"
              >
                {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
              </button>
            )}
            
            {!isSignUp && (
              <div>
                <button
                  onClick={() => {
                    setIsForgotPassword(!isForgotPassword);
                    setVerificationMessage('');
                  }}
                  className="text-sm text-amber-600 hover:text-amber-500 transition-colors duration-200"
                >
                  {isForgotPassword ? 'Back to Sign In' : 'Forgot your password?'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
