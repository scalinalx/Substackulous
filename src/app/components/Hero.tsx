"use client";

import { ArrowRight } from "lucide-react";
import Image from "next/image";

interface HeroProps {
  onGetStarted: () => void;
}

const Avatar = ({ src, className }: { src: string; className?: string }) => (
  <div className={`relative rounded-full overflow-hidden ${className}`}>
    <Image
      src={src}
      alt="Avatar"
      fill
      className="object-cover"
    />
  </div>
);

const Hero = ({ onGetStarted }: HeroProps) => {
  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-gray-100 via-gray-200 to-gray-100 pt-20">
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/2 left-0 w-64 h-64 bg-white/20 rounded-full filter blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute top-1/4 right-0 w-96 h-96 bg-white/10 rounded-full filter blur-3xl translate-x-1/2"></div>
      </div>

      <div className="container mx-auto px-4 flex flex-col items-center text-center pt-20 relative z-10">
        <h1 className="text-4xl md:text-6xl font-bold text-gray-900 max-w-4xl mb-6 leading-tight">
          Join 40,000+ Successful Substack Creators — Grow Smarter, Convert Faster
        </h1>
        <p className="text-xl md:text-2xl text-gray-700 max-w-2xl mb-8">
          Substackulous gives you AI-powered tools to supercharge your content,
          audience growth, and revenue
        </p>
        <button 
          onClick={onGetStarted}
          className="group bg-gray-900 hover:bg-gray-800 text-white px-8 py-4 rounded-full font-medium text-lg transition-all duration-300 flex items-center space-x-2 mb-12 shadow-lg hover:shadow-xl"
        >
          <span>Start Free Trial (Boost Subscribers in 30 Days!)</span>
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </button>
        <div className="flex flex-col items-center">
          <p className="text-gray-600 mb-4">Trusted by the best of Substack</p>
          <div className="flex flex-wrap justify-center gap-4 mb-4">
            <Avatar className="w-20 h-20 border-2 border-white/20" src="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158" />
            <Avatar className="w-20 h-20 border-2 border-white/20" src="https://images.unsplash.com/photo-1581090464777-f3220bbe1b8b" />
            <Avatar className="w-20 h-20 border-2 border-white/20" src="https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d" />
            <Avatar className="w-20 h-20 border-2 border-white/20" src="https://images.unsplash.com/photo-1518770660439-4636190af475" />
            <Avatar className="w-20 h-20 border-2 border-white/20" src="https://images.unsplash.com/photo-1649972904349-6e44c42644a7" />
            <Avatar className="w-20 h-20 border-2 border-white/20" src="https://images.unsplash.com/photo-1485827404703-89b55fcc595e" />
            <Avatar className="w-20 h-20 border-2 border-white/20" src="https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5" />
            <Avatar className="w-20 h-20 border-2 border-white/20" src="https://images.unsplash.com/photo-1581092795360-fd1ca04f0952" />
          </div>
          <p className="text-gray-600 text-lg">+40k more...</p>
        </div>
      </div>
    </div>
  );
};

export default Hero; 