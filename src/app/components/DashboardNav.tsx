'use client';

import { useAuth } from '@/lib/contexts/AuthContext';
import Link from 'next/link';

export default function DashboardNav() {
  const { user, profile, signOut } = useAuth();

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

  if (!user || !profile) return null;

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white shadow-sm z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/dashboard" className="text-2xl font-bold text-gray-900">
              SUBSTACKULOUS
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-600">
              Welcome <span className="font-medium">{user.email}</span>
            </div>
            <div className="text-sm text-gray-600">
              Credits: {profile?.credits ?? 0}
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
              onClick={() => signOut()}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
} 