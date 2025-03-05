"use client"

import React from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { VideoModal } from '@/components/video-modal';
import { useState } from "react"

export function Hero() {
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false)
  
  return (
    <div className="relative">
      <VideoModal isOpen={isVideoModalOpen} onClose={() => setIsVideoModalOpen(false)} />
      <section className="py-12 md:py-24 lg:py-32 xl:py-48">
        <div className="container px-4 md:px-6">
          <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
            <div className="flex flex-col justify-center space-y-4">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                  Supercharge Your Substack Newsletter with AI
                </h1>
                <p className="max-w-[600px] text-gray-500 md:text-xl dark:text-gray-400">
                  Generate better ideas, write compelling content, and grow your audience faster with our AI-powered tools built specifically for Substack creators.
                </p>
              </div>
              <div className="flex flex-col gap-2 min-[400px]:flex-row">
                <Button size="lg" className="font-medium">
                  Start Free Trial
                </Button>
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="font-medium"
                  onClick={() => setIsVideoModalOpen(true)}
                >
                  Watch Demo
                </Button>
              </div>
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center gap-1">
                  <CheckIcon className="h-4 w-4" />
                  <span className="text-gray-500 dark:text-gray-400">7-day free trial</span>
                </div>
                <div className="flex items-center gap-1">
                  <CheckIcon className="h-4 w-4" />
                  <span className="text-gray-500 dark:text-gray-400">No credit card required</span>
                </div>
                <div className="flex items-center gap-1">
                  <CheckIcon className="h-4 w-4" />
                  <span className="text-gray-500 dark:text-gray-400">Cancel anytime</span>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-center">
              <div className="relative aspect-video overflow-hidden rounded-xl border bg-muted/50 md:aspect-square lg:aspect-video">
                <Image
                  src="/hero-image.png"
                  alt="Substackulous Dashboard"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function CheckIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
} 