'use client';

import { useAuth } from '@/lib/contexts/AuthContext';
import { redirect } from 'next/navigation';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useState } from 'react';
import { User } from '@supabase/supabase-js';

interface ExtendedUser extends User {
  subscription_plan?: string;
  credits_reset_date?: string;
}

export default function AccountPage() {
  const { user, credits, isLoading, isAuthenticated, isInitialized } = useAuth();
  const typedUser = user as ExtendedUser;
  const [isCancelling, setIsCancelling] = useState(false);

  if (!isInitialized || isLoading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    redirect('/login');
  }

  const handleCancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel your subscription? This will take effect at the end of your current billing period.')) {
      return;
    }

    try {
      setIsCancelling(true);
      const response = await fetch('/api/stripe/cancel-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error('Failed to cancel subscription');
      }

      toast.success('Subscription cancelled successfully. You will have access until the end of your current billing period.');
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      toast.error('Failed to cancel subscription. Please try again or contact support.');
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">My Account</h1>
      
      {/* Account Information */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden mb-8">
        <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Account Information</h2>
        </div>
        
        <div className="px-6 py-5">
          <div className="grid grid-cols-1 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Email</h3>
              <p className="mt-1 text-lg text-gray-900 dark:text-white">{user?.email || 'Not available'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Subscription Details */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden mb-8">
        <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Subscription Details</h2>
        </div>
        
        <div className="px-6 py-5">
          <div className="grid grid-cols-1 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Current Plan</h3>
              <p className="mt-1 text-lg text-gray-900 dark:text-white">
                {typedUser?.subscription_plan ? (
                  `${typedUser.subscription_plan.charAt(0).toUpperCase() + typedUser.subscription_plan.slice(1)} Plan`
                ) : 'Free Plan'}
              </p>
            </div>

            {typedUser?.subscription_plan && (
              <>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Billing Period</h3>
                  <p className="mt-1 text-lg text-gray-900 dark:text-white">
                    {typedUser.subscription_plan === 'legend' ? 'Yearly' : 'Monthly'}
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Next Billing Date</h3>
                  <p className="mt-1 text-lg text-gray-900 dark:text-white">
                    {typedUser.credits_reset_date ? new Date(typedUser.credits_reset_date).toLocaleDateString() : 'N/A'}
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Monthly Price</h3>
                  <p className="mt-1 text-lg text-gray-900 dark:text-white">
                    ${typedUser.subscription_plan === 'legend' ? '39.17' : '47'}/month
                  </p>
                </div>

                <div>
                  <Button
                    variant="destructive"
                    onClick={handleCancelSubscription}
                    disabled={isCancelling}
                  >
                    {isCancelling ? 'Cancelling...' : 'Cancel Subscription'}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Credits Information */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Credits</h2>
        </div>
        
        <div className="px-6 py-5">
          <div className="grid grid-cols-1 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Available Credits</h3>
              <p className="mt-1 text-lg text-gray-900 dark:text-white">{credits ?? 0}</p>
            </div>

            {typedUser?.subscription_plan && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Monthly Credit Allowance</h3>
                <p className="mt-1 text-lg text-gray-900 dark:text-white">
                  {typedUser.subscription_plan === 'legend' ? 'Unlimited' : '2,500'}
                </p>
              </div>
            )}

            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Next Credit Reset</h3>
              <p className="mt-1 text-lg text-gray-900 dark:text-white">
                {typedUser?.credits_reset_date ? new Date(typedUser.credits_reset_date).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 