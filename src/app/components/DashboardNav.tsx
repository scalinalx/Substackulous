'use client';

import { useAuth } from '@/lib/contexts/AuthContext';
import { useTheme } from '@/lib/contexts/ThemeContext';
import Link from 'next/link';
import { useState } from 'react';
import { Moon, Sun } from 'lucide-react';

export default function DashboardNav() {
  const { user, credits, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handlePurchaseCredits = async () => {
    if (!user?.email) {
      alert('Please sign in to purchase credits');
      return;
    }

    try {
      // Create a checkout session
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: user.email,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { url } = await response.json();
      window.open(url, '_blank');
    } catch (error) {
      console.error('Error creating checkout session:', error);
      alert('Failed to start checkout process. Please try again.');
    }
  };

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      await signOut();
      window.location.href = 'https://substackulous.vercel.app/';
    } catch (error) {
      console.error('Error signing out:', error);
      alert('Failed to sign out. Please try again.');
    } finally {
      setIsSigningOut(false);
    }
  };

  if (!user) return null;

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white dark:bg-gray-900 shadow-sm z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/dashboard" className="text-2xl font-bold text-gray-900 dark:text-white">
              SUBSTACKULOUS
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-600 dark:text-gray-300">
              <span className="font-medium">Welcome {user.email}</span>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300">
              <span className="font-medium">Available credits: {credits ?? 0}</span>
            </div>
            <div className="relative">
              <button
                onClick={handlePurchaseCredits}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 
                         transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 
                         focus:ring-offset-2"
              >
                Purchase Credits
              </button>
            </div>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none"
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? (
                <Sun className="h-5 w-5 text-gray-600 dark:text-gray-300" />
              ) : (
                <Moon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
              )}
            </button>
            <button
              onClick={handleSignOut}
              disabled={isSigningOut}
              className={`text-sm ${
                isSigningOut 
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {isSigningOut ? 'Signing Out...' : 'Sign Out'}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
} 