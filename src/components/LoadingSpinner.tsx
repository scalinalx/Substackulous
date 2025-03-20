"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';

export default function LoadingSpinner() {
  const [showRecoveryOption, setShowRecoveryOption] = useState(false);
  const [isRecovering, setIsRecovering] = useState(false);
  const [loadingTime, setLoadingTime] = useState(0);
  const { recoverSession } = useAuth();

  useEffect(() => {
    // Show recovery button after 10 seconds
    const timeout = setTimeout(() => {
      setShowRecoveryOption(true);
    }, 10000);

    // Track loading time
    const interval = setInterval(() => {
      setLoadingTime(prev => prev + 1);
    }, 1000);

    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, []);

  const handleRecovery = async () => {
    try {
      setIsRecovering(true);
      await recoverSession();
    } catch (error) {
      console.error('Manual recovery failed:', error);
      // Last resort - force reload the page
      window.location.href = '/login';
    } finally {
      setIsRecovering(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
      <div className="space-y-4 text-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-muted-foreground text-sm">
          {isRecovering 
            ? "Recovering your session..." 
            : "Securing your session..."}
        </p>
        
        {/* Show the loading time if it's taking too long */}
        {loadingTime > 5 && (
          <p className="text-xs text-muted-foreground">
            Taking longer than expected ({loadingTime}s)
          </p>
        )}
        
        {/* Recovery option button */}
        {showRecoveryOption && !isRecovering && (
          <div className="mt-4 space-y-2">
            <p className="text-xs text-destructive">
              Session initialization is taking too long.
            </p>
            <button
              onClick={handleRecovery}
              className="px-4 py-2 bg-primary text-primary-foreground text-sm rounded-md hover:bg-primary/90 transition-colors"
            >
              Recover Session
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
