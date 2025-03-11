'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';
import { ChevronLeft, ChevronRight, Home, LogOut, User, Crown } from 'lucide-react';

// Define the feature interface
interface SidebarFeature {
  title: string;
  icon: string;
  href: string;
}

// Get features from the dashboard page
const sidebarFeatures: SidebarFeature[] = [
  {
    title: "Instant Post Image Generator",
    icon: "🎨",
    href: "/dashboard/thumbnails",
  },
  {
    title: "The Home Run",
    icon: "🚀",
    href: "/dashboard/home-run",
  },
  {
    title: "Viral Notes Generator",
    icon: "🤖",
    href: "/dashboard/notes-rag",
  },
  {
    title: "Click-Worthy Title Maker",
    icon: "✍️",
    href: "/dashboard/titles",
  },
  {
    title: "Effortless Post Outline Builder",
    icon: "📝",
    href: "/dashboard/outline",
  },
  {
    title: "The Substack Growth Engine",
    icon: "📈",
    href: "/dashboard/substack-pro",
  },
  {
    title: "Create Your 6-Figure Offer",
    icon: "💰",
    href: "/dashboard/offer-builder",
  },
];

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const pathname = usePathname();
  const { signOut } = useAuth();

  // Handle responsive behavior
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setIsCollapsed(true);
      }
    };

    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    
    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
      window.location.href = 'https://substackulous.vercel.app/';
    } catch (error) {
      console.error('Error signing out:', error);
      alert('Failed to sign out. Please try again.');
    }
  };

  return (
    <div 
      className={`fixed top-16 left-0 h-[calc(100vh-4rem)] bg-white dark:bg-gray-800 shadow-md transition-all duration-300 z-20 
        ${isCollapsed ? 'w-16' : 'w-64'}`}
    >
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-4 bg-white dark:bg-gray-800 rounded-full p-1 shadow-md z-30"
        aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {isCollapsed ? (
          <ChevronRight className="h-4 w-4 text-gray-600 dark:text-gray-300" />
        ) : (
          <ChevronLeft className="h-4 w-4 text-gray-600 dark:text-gray-300" />
        )}
      </button>

      <div className="flex flex-col h-full py-4">
        {/* Dashboard Home Link */}
        <Link 
          href="/dashboard" 
          className={`flex items-center px-4 py-3 mb-2 ${
            pathname === '/dashboard' 
              ? 'bg-gray-100 dark:bg-gray-700 text-blue-600 dark:text-blue-400' 
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          <Home className="h-5 w-5 mr-3" />
          {!isCollapsed && <span className="font-medium">Dashboard</span>}
        </Link>

        {/* Features Section */}
        <div className="px-4 py-2">
          {!isCollapsed && <h3 className="text-xs uppercase text-gray-500 dark:text-gray-400 font-semibold mb-2">Features</h3>}
          <div className="space-y-1">
            {sidebarFeatures.map((feature) => (
              <Link
                key={feature.href}
                href={feature.href}
                className={`flex items-center px-2 py-2 rounded-md ${
                  pathname === feature.href
                    ? 'bg-gray-100 dark:bg-gray-700 text-blue-600 dark:text-blue-400'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <span className="text-xl mr-3">{feature.icon}</span>
                {!isCollapsed && (
                  <span className="truncate">{feature.title}</span>
                )}
              </Link>
            ))}
          </div>
        </div>

        {/* Account Section - at the bottom */}
        <div className="mt-auto px-4 py-2">
          {!isCollapsed && <h3 className="text-xs uppercase text-gray-500 dark:text-gray-400 font-semibold mb-2">Account</h3>}
          <div className="space-y-1">
            <Link
              href="/dashboard/upgrade"
              className={`flex items-center justify-left px-2 py-2 rounded-md ${
                pathname === '/dashboard/upgrade'
                  ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
                  : 'text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20'
              }`}
            >
              <Crown className={`${isCollapsed ? 'h-8 w-8' : 'h-5 w-5'} ${isCollapsed ? '' : 'mr-3'} transition-all duration-200`} />
              {!isCollapsed && <span className="font-medium">Upgrade Plan</span>}
            </Link>
            <Link
              href="/dashboard/account"
              className={`flex items-center justify-left px-2 py-2 rounded-md ${
                pathname === '/dashboard/account'
                  ? 'bg-gray-100 dark:bg-gray-700 text-blue-600 dark:text-blue-400'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <User className={`${isCollapsed ? 'h-8 w-8' : 'h-5 w-5'} ${isCollapsed ? '' : 'mr-3'} transition-all duration-200`} />
              {!isCollapsed && <span>My Account</span>}
            </Link>
            <button
              onClick={handleSignOut}
              className="w-full flex items-center justify-left px-2 py-2 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <LogOut className={`${isCollapsed ? 'h-8 w-8' : 'h-5 w-5'} ${isCollapsed ? '' : 'mr-3'} transition-all duration-200`} />
              {!isCollapsed && <span>Sign Out</span>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 