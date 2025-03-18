'use client';

import { useAuth } from '@/lib/contexts/AuthContext';
import { redirect } from 'next/navigation';
import LoadingSpinner from '@/components/LoadingSpinner';
import Link from 'next/link';
import { useEffect } from 'react';

export default function TroubleshootingPage() {
  const { user, isLoading, isAuthenticated, isInitialized } = useAuth();

  useEffect(() => {
    // Add a note to the console about images
    console.log('Note: Make sure to add all troubleshooting guide images to the public/images directory');
  }, []);

  if (!isInitialized || isLoading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    redirect('/login');
  }

  // Function to fix image paths for Next.js public directory
  const fixImagePaths = (htmlContent: string) => {
    return htmlContent.replace(/src="images\//g, 'src="/images/');
  };

  const htmlContent = `
    <div class="doc-content">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-6">The No-BS Substackulous Quick-Start Guide</h1>
      <p class="text-lg text-gray-600 dark:text-gray-300 mb-6">(AKA How to Go from Zero to Growth Hero in 15 Minutes)</p>

      <div class="mb-10 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
        <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-3">Contents</h3>
        <ul class="space-y-2 list-none">
          <li><a href="#credit-system" class="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:underline">• First Things First: The Credit System</a></li>
          <li><a href="#your-options" class="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:underline">• Your Options</a></li>
          <li><a href="#growth-plan" class="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:underline">• Your First 15-Minute Growth Plan</a></li>
          <li><a href="#create-account" class="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:underline">• Create a New Account</a></li>
          <li><a href="#log-in" class="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:underline">• Log In</a></li>
          <li><a href="#app-stuck" class="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:underline">• App Gets Stuck - What to Do</a></li>
        </ul>
      </div>

      <h2 id="credit-system" class="text-2xl font-bold text-gray-900 dark:text-white mt-10 mb-4">First Things First: The Credit System</h2>
      <p class="mb-4">You have 100 free credits to start. Here's what different features cost:</p>
      <ul class="list-disc ml-8 mb-6 space-y-2">
        <li>Viral Notes Generator: 1 credit</li>
        <li>Click-Worthy Title Maker: 1 credit</li>
        <li>Effortless Post Outline: 2 credits</li>
        <li>Create Your 6-Figure Offer: 3 credits</li>
        <li>Instant Post Image Generator: 30 credits (for thumbnail images)</li>
      </ul>
      <p class="mb-8">You can always get more credits by purchasing them directly in the app. $19 will get you 1,000 new credits to play with (they never expire, btw).</p>
      <p class="mb-8">Now let's dive into what each tool actually does and how to use it for maximum impact.</p>

      <h2 id="your-options" class="text-2xl font-bold text-gray-900 dark:text-white mt-10 mb-4">Your options</h2>

      <h3 class="text-xl font-bold text-gray-900 dark:text-white mt-8 mb-3">🎨 Instant Post Image Generator</h3>
      <p class="mb-3"><strong>What it actually does:</strong> Creates 3 eye-catching images with text overlay specifically designed for Substack posts (not generic AI art).</p>
      <p class="mb-3"><strong>How to use it like a pro:</strong></p>
      <ol class="list-decimal ml-8 mb-4 space-y-2">
        <li>Click "Instant Post Image Generator" in the sidebar</li>
        <li>Enter a title for your image</li>
        <li>Specify a theme (dark, modern, vibrant, etc.)</li>
        <li>Choose an aspect ratio (landscape 3:2 recommended)</li>
        <li>Click "Generate Thumbnails"</li>
      </ol>
      <p class="mb-8"><strong>Pro tip:</strong> Create images that summarize your key points - they get 38% more shares than decorative images.</p>

      <h3 class="text-xl font-bold text-gray-900 dark:text-white mt-8 mb-3">🚀 The Home Run</h3>
      <p class="mb-3"><strong>What it actually does:</strong> Analyzes any Substack to generate viral post titles and high-engagement Notes ideas by finding patterns in successful content.</p>
      <p class="mb-3"><strong>How to use it like a pro:</strong></p>
      <ol class="list-decimal ml-8 mb-4 space-y-2">
        <li>Enter any Substack URL (yours or a competitor's)</li>
        <li>Click "Brainstorm Ideas" for post concepts or "Generate Notes" for Substack Notes</li>
        <li>Each analysis costs 3 credits, so choose targets strategically</li>
      </ol>
      <p class="mb-3"><strong>Pro tip:</strong> Analyze your 3 biggest competitors to find gaps in their content that you can fill.</p>
      <p class="mb-8">Here's a little video we've made on how to use this feature: <a href="https://www.youtube.com/watch?v=bwvNeyo-YLE" class="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">Unlock 10X Growth: The #1 Substack Feature You're Missing in 2025</a></p>

      <h3 class="text-xl font-bold text-gray-900 dark:text-white mt-8 mb-3">📝 Viral Notes Generator</h3>
      <p class="mb-3"><strong>What it actually does:</strong> Creates high-potential Notes designed specifically to boost visibility, engagement and growth on Substack's Notes platform.</p>
      <p class="mb-3"><strong>How to use it like a pro:</strong></p>
      <ol class="list-decimal ml-8 mb-4 space-y-2">
        <li>Enter a topic for your Notes</li>
        <li>Click "Generate Notes"</li>
        <li>Get multiple options designed for maximum shareability</li>
      </ol>
      <p class="mb-8"><strong>Pro tip:</strong> Notes work best when they provide a single, sharp insight that makes readers think "huh, I never thought about it that way."</p>

      <h3 class="text-xl font-bold text-gray-900 dark:text-white mt-8 mb-3">✍️ Click-Worthy Title Maker</h3>
      <p class="mb-3"><strong>What it actually does:</strong> Transforms any topic into must-click headlines that grab attention and drive opens.</p>
      <p class="mb-3"><strong>How to use it like a pro:</strong></p>
      <ol class="list-decimal ml-8 mb-4 space-y-2">
        <li>Enter your post topic</li>
        <li>Click "Generate Titles"</li>
        <li>Get multiple headline options optimized for clicks</li>
      </ol>
      <p class="mb-8"><strong>Pro tip:</strong> The most effective titles create curiosity gaps ("The Weird Reason Most Newsletters Fail") or make counterintuitive claims ("Why Posting Less Actually Grew My List Faster").</p>

      <h3 class="text-xl font-bold text-gray-900 dark:text-white mt-8 mb-3">📄 Effortless Post Outline Builder</h3>
      <p class="mb-3"><strong>What it actually does:</strong> Creates customized post structures with sections and prompts - just fill in the blanks and publish.</p>
      <p class="mb-3"><strong>How to use it like a pro:</strong></p>
      <ol class="list-decimal ml-8 mb-4 space-y-2">
        <li>Enter your topic</li>
        <li>Add optional key points you want to cover</li>
        <li>Specify target audience and objective</li>
        <li>Choose format (Blog Post) and knowledge level</li>
        <li>Select your preferred tone from 7 options</li>
        <li>Click "Generate Outline"</li>
      </ol>
      <p class="mb-8"><strong>Pro tip:</strong> The "Conversational" and "Humorous" tones tend to perform best for building connection with readers.</p>

      <h3 class="text-xl font-bold text-gray-900 dark:text-white mt-8 mb-3">💰 Create Your 6-Figure Offer</h3>
      <p class="mb-3"><strong>What it actually does:</strong> Helps you craft irresistible high-ticket offers engineered to convert subscribers into paying customers.</p>
      <p class="mb-3"><strong>How to use it like a pro:</strong></p>
      <ol class="list-decimal ml-8 mb-4 space-y-2">
        <li>Define your target audience in detail</li>
        <li>Specify the transformation or results you help them achieve</li>
        <li>Click "Craft Irresistible Offer"</li>
      </ol>
      <p class="mb-8"><strong>Pro tip:</strong> The most successful offers solve a specific, urgent problem rather than general improvements.</p>

      <h2 id="growth-plan" class="text-2xl font-bold text-gray-900 dark:text-white mt-10 mb-4">Your First 15-Minute Growth Plan</h2>
      <ol class="list-decimal ml-8 mb-6 space-y-2">
        <li><strong>Minutes 0-5:</strong> Use The Home Run to analyze your Substack</li>
        <li><strong>Minutes 5-10:</strong> Use Click-Worthy Title Maker to craft your next headline</li>
        <li><strong>Minutes 10-15:</strong> Use Instant Post Image Generator to create a custom image</li>
      </ol>
      <p class="mb-4">That's it! No fluff, no BS - just the exact steps to get maximum value in minimum time.</p>
      <p class="mb-8">Questions? Email <a href="mailto:anaxcalin@gmail.com" class="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">anaxcalin@gmail.com</a> or reply directly to any of our emails.</p>
      <p class="mb-12">Now go build that newsletter empire! 🚀</p>

      <h2 id="troubleshooting" class="text-2xl font-bold text-gray-900 dark:text-white mt-10 mb-6">Troubleshooting</h2>
      
      <h3 id="create-account" class="text-xl font-bold text-gray-900 dark:text-white mt-8 mb-3">1. Create a new account</h3>
      <p class="mb-3">Go to: <a href="https://substackulous.vercel.app/" class="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">https://substackulous.vercel.app/</a></p>
      <p class="mb-3">Click on GET STARTED or FREE TRIAL</p>
      <p class="mb-5">
        <img alt="Homepage screenshot" src="images/image4.png" class="max-w-full h-auto rounded-lg shadow-md" />
      </p>
      <p class="mb-3">Enter your email & Password and click Sign up</p>
      <p class="mb-5">
        <img alt="Sign up form" src="images/image7.png" class="max-w-full h-auto rounded-lg shadow-md" />
      </p>
      <p class="mb-3">You will need now to confirm your account creation in your email. Open your email inbox and look for this message:</p>
      <p class="mb-5">
        <img alt="Email notification" src="images/image5.png" class="max-w-full h-auto rounded-lg shadow-md" />
        <img alt="Email confirmation" src="images/image2.png" class="max-w-full h-auto rounded-lg shadow-md mt-2" />
      </p>
      <p class="mb-3">Click on Confirm your email. That's it, now you have an account.</p>
      <p class="mb-3">The link might get you to login directly and sometimes it may freeze on this window:</p>
      <p class="mb-5">
        <img alt="Frozen window" src="images/image8.png" class="max-w-full h-auto rounded-lg shadow-md" />
      </p>
      <p class="mb-3">If this happens, take this one step:</p>
      <p class="mb-3">Go on your browser search bar and click the 2 lines icon, then select Cookies & site data:</p>
      <p class="mb-5">
        <img alt="Cookies menu" src="images/image10.png" class="max-w-full h-auto rounded-lg shadow-md" />
      </p>
      <p class="mb-3">Now click on Manage on-device site data:</p>
      <p class="mb-5">
        <img alt="Site data management" src="images/image6.png" class="max-w-full h-auto rounded-lg shadow-md" />
      </p>
      <p class="mb-3">And delete cookies only for Substackulous like this</p>
      <p class="mb-5">
        <img alt="Delete cookies" src="images/image1.png" class="max-w-full h-auto rounded-lg shadow-md" />
      </p>
      <p class="mb-3">Press done and then you might be asked to reload the page:</p>
      <p class="mb-5">
        <img alt="Reload prompt" src="images/image3.png" class="max-w-full h-auto rounded-lg shadow-md" />
      </p>
      <p class="mb-8">Reload it and login with your email and password already set.</p>
      <p class="mb-8">You may need to take this cookies deletion troubleshoot again if the app freezes and reload then the app. Our engineering team is working on fixing this bug permanently at the earliest.</p>

      <h3 id="log-in" class="text-xl font-bold text-gray-900 dark:text-white mt-8 mb-3">2. Log In</h3>
      <p class="mb-3">Once you enter your email and password, you will get to the your main dashboard:</p>
      <p class="mb-5">
        <img alt="Dashboard" src="images/image9.png" class="max-w-full h-auto rounded-lg shadow-md" />
      </p>
      <p class="mb-3">Enjoy your growth!</p>

      <h3 id="app-stuck" class="text-xl font-bold text-gray-900 dark:text-white mt-8 mb-3">3. App gets stuck - what to do</h3>
      <p class="mb-3">If your window is frozen during the app use for more than a few seconds, or after you left the app open without using it for a little while, you may need to take this cookies deletion troubleshoot.</p>
      <p class="mb-3">(Our engineering team is working on fixing this bug permanently at the earliest.)</p>
      <p class="mb-3">This only takes a few seconds to fix. Here are the steps</p>
      <p class="mb-5">
        <img alt="Frozen window" src="images/image8.png" class="max-w-full h-auto rounded-lg shadow-md" />
      </p>
      <p class="mb-3">Go on your browser search bar and click the 2 lines icon, then select Cookies & site data:</p>
      <p class="mb-5">
        <img alt="Cookies menu" src="images/image10.png" class="max-w-full h-auto rounded-lg shadow-md" />
      </p>
      <p class="mb-3">Now click on Manage on-device site data:</p>
      <p class="mb-5">
        <img alt="Site data management" src="images/image6.png" class="max-w-full h-auto rounded-lg shadow-md" />
      </p>
      <p class="mb-3">And delete cookies only for Substackulous like this</p>
      <p class="mb-5">
        <img alt="Delete cookies" src="images/image1.png" class="max-w-full h-auto rounded-lg shadow-md" />
      </p>
      <p class="mb-3">Press done and then you might be asked to reload the page:</p>
      <p class="mb-5">
        <img alt="Reload prompt" src="images/image3.png" class="max-w-full h-auto rounded-lg shadow-md" />
      </p>
      <p class="mb-3">Reload it and login with your email and password already set.</p>
    </div>
  `;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <Link
          href="/dashboard"
          className="text-amber-600 hover:text-amber-500 dark:text-amber-500 dark:hover:text-amber-400 flex items-center gap-1"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Dashboard
        </Link>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        <div className="px-6 py-8">
          <div dangerouslySetInnerHTML={{ __html: fixImagePaths(htmlContent) }} />
        </div>
      </div>
      
      <div className="mt-8 bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden p-6">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          <strong>Note:</strong> If images are not displaying correctly, please make sure they are correctly placed in the public/images directory.
        </p>
      </div>
    </div>
  );
} 