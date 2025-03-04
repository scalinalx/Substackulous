"use client";

import { useAuth } from '@/lib/contexts/AuthContext';
import { redirect } from 'next/navigation';
import LoadingSpinner from '@/components/LoadingSpinner';
import Link from 'next/link';

const features = [
  {
    title: "📸 Instant Post Image Generator",
    description: "Instantly create 3 eye-catching images for your post.",
    icon: "🎨",
    href: "/dashboard/thumbnails",
    color: "from-pink-500 to-rose-500"
  },
  {
    title: "The Home Run",
    description: "Analyze any Substack, and get in seconds viral post titles, and high-engagement viral notes.",
    icon: "🚀",
    href: "/dashboard/home-run",
    color: "from-indigo-500 to-blue-500"
  },

  {
    title: "Viral Notes Generator",
    description: "Input an idea, get multiple high-potential Notes designed to boost visibility, engagement and growth.",
    icon: "🤖",
    href: "/dashboard/notes-rag",
    color: "from-cyan-500 to-blue-500"
  },

  // {
  //   title: "Idea Illustrator",
  //   description: "Transform your ideas into stunning visuals. No design skills needed.",
  //   icon: "✨",
  //   href: "/dashboard/illustrator",
  //   color: "from-purple-500 to-indigo-500"
  // },
  {
    title: "🔥 Click-Worthy Title Maker",
    description: "Turn any idea into a scroll-stopping, must-click headlines that grab attention.",
    icon: "✍️",
    href: "/dashboard/titles",
    color: "from-green-500 to-emerald-500"
  },
  {
    title: "📝 Effortless Post Outline Builder",
    description: "Drop in an idea, get a ready-to-use post structure—just fill in the blanks and hit publish.",
    icon: "📝",
    href: "/dashboard/outline",
    color: "from-amber-500 to-orange-500"
  },
  // {
  //   title: "AI Chat",
  //   description: "Chat with an AI assistant trained on Substack best practices.",
  //   icon: "💬",
  //   href: "/dashboard/chat",
  //   color: "from-red-500 to-pink-500"
  // },
  {
    title: "🚀 The Substack Growth Engine",
    description: "Analyze any Substack and get data-driven growth tips, find patterns behind the winners and single out the trends you need to double down on — just paste a link.",
    icon: "📈",
    href: "/dashboard/substack-pro",
    color: "from-emerald-500 to-teal-500"
  },
 
  {
    title: "Create Your 6-Figure Offer",
    description: "Make an irresistible high-ticket offer that converts subscribers into paying customers—engineered to hit $50K/month.",
    icon: "💰",
    href: "/dashboard/offer-builder",
    color: "from-yellow-500 to-amber-500"
  },
  // {
  //   title: "Topic/Niche Research",
  //   description: "Coming Soon - Discover trending topics and untapped niches for your Substack.",
  //   icon: "🔍",
  //   href: "#",
  //   color: "from-teal-500 to-green-500",
  //   comingSoon: true
  // },
  //  {
  //   title: "AI Coach",
  //   description: "Coming Soon - Get personalized guidance to grow your Substack audience.",
  //   icon: "🎯",
  //   href: "#",
  //   color: "from-violet-500 to-purple-500",
  //   comingSoon: true
  // }
];

export default function DashboardPage() {
  const { user, isLoading, isAuthenticated, isInitialized } = useAuth();

  if (!isInitialized || isLoading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Features Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-3xl font-bold text-gray-900 mb-8">Welcome to Your Dashboard</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <Link 
              key={feature.title} 
              href={feature.href}
              className={`group relative bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden `}
              onClick={undefined}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-5 transition-opacity`} />
              <div className="p-6">
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
} 