"use client"

import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Features } from "@/components/features";
import { Testimonials } from "@/components/testimonials";
import { Testimonials1 } from "@/components/testimonials1";
import { FAQ } from "@/components/faq";
import { Footer } from "@/components/footer";
import { Pricing } from "@/components/pricing";
import { PopupBuilder } from "@/components/popup-builder";
import { CreatorAchievements } from "@/components/creator-achievements";
import { AllInOneAdvantage } from "@/components/all-in-one-advantage";
import { ArrowRight, Sparkles, Lightbulb, Zap, Sun, Moon, Circle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useState } from "react";
import { VideoModal } from "@/components/video-modal";
import { AuthModal } from "@/components/auth-modal";
import { ComparisonSection } from "@/components/comparison-section";

export default function Home() {
  const { theme, setTheme } = useTheme();
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  return (
    <main className="flex min-h-screen flex-col items-center justify-between">
      <VideoModal isOpen={isVideoModalOpen} onClose={() => setIsVideoModalOpen(false)} />
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      {/* Announcement Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm dark:bg-[#1b002a] border-0">
        <div className="container mx-auto h-12 flex items-center justify-between relative">
          <div className="flex items-center gap-4 px-4">
            <div className="flex items-center -ml-10">
              <Image 
                src="/logow.png" 
                alt="Substackulous" 
                width={56} 
                height={56} 
                className="h-14 block dark:hidden" 
              />
              <Image 
                src="/logo2.png" 
                alt="Substackulous" 
                width={56} 
                height={56} 
                className="h-14 hidden dark:block" 
              />
            </div>
            <p className="text-[10px] md:text-xs text-gray-800 dark:text-gray-200">
              Supercharge your Substack! Boost your subscriber growth by up to 500% and double your conversion rate in less than 30 DAYS.
            </p>
            <Button
              size="sm"
              className="bg-orange-500 hover:bg-orange-600 text-white whitespace-nowrap text-[13px] h-8 px-4 rounded-[4px]"
              onClick={() => setIsAuthModalOpen(true)}
            >
              GET STARTED
            </Button>
          </div>
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
            <Button
              size="sm"
              variant="ghost"
              className="w-9 h-9 p-0"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full mt-12">
        {/* Hero Section */}
        <section className="relative w-full overflow-hidden pt-36 pb-24 gradient-bg">
          <motion.div 
            className="container mx-auto px-4 md:px-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex flex-col lg:flex-row items-center gap-12 relative z-10">
              {/* Text Content */}
              <div className="flex-1 text-center lg:text-left">
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary shadow-glow"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>The Future of Substack Publishing</span>
                </motion.div>
                <motion.h1 
                  className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl gradient-text max-w-3xl lg:max-w-2xl"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  Supercharge Your Growth with{" "}
                  <span className="relative inline-block">
                    Substackulous Magic
                    <motion.span 
                      className="absolute inset-x-0 bottom-0 h-3 bg-primary/20 -z-10 rounded"
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ delay: 0.5, duration: 0.5 }}
                    ></motion.span>
                  </span>
                </motion.h1>
                <motion.p 
                  className="mt-4 text-l text-muted-foreground md:text-xl max-w-[600px] font-['Poppins']"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  Substackulous helps you create engaging, viral content that converts. Powered by our custom, state of the art AI models, driven by results.
                </motion.p>
                <motion.div 
                  className="mt-8 flex flex-wrap gap-4 lg:justify-start justify-center"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <Button 
                    size="lg" 
                    className="group shadow-glow"
                    onClick={() => setIsAuthModalOpen(true)}
                  >
                    Start Free Trial
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                  <Button 
                    size="lg" 
                    variant="outline" 
                    className="group glass"
                    onClick={() => setIsVideoModalOpen(true)}
                  >
                    Watch Demo
                    <Zap className="ml-2 h-4 w-4 transition-transform group-hover:scale-110" />
                  </Button>
                </motion.div>
                <motion.p 
                  className="mt-6 text-sm text-muted-foreground flex items-center gap-2 lg:justify-start justify-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-primary"></span>
                  <strong>No credit card required</strong>
                  <span className="h-1.5 w-1.5 rounded-full bg-primary"></span>
                  <strong>14-day free trial</strong>
                  <span className="h-1.5 w-1.5 rounded-full bg-primary"></span>
                  <strong>Cancel anytime</strong>
                </motion.p>
              </div>

              {/* Image */}
              <div className="flex-1">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  className="relative aspect-[4/3]"
        >
          <Image
                    src="/imgs/wire1.png"
                    alt="Substackulous Dashboard"
                    fill
                    className="object-cover rounded-xl shadow-2xl dark:opacity-0 transition-opacity animate-float"
                    priority
                  />
                  <Image
                    src="/imgs/wire1.png"
                    alt="Substackulous Dashboard Dark"
                    fill
                    className="object-cover rounded-xl shadow-2xl opacity-0 dark:opacity-100 transition-opacity animate-float"
                    priority
                  />
                </motion.div>

                {/* Floating Elements */}
                <motion.div
                  className="absolute -right-8 top-1/4 animate-pulse-glow"
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.9 }}
                >
                  <div className="glass rounded-full p-4">
                    <Lightbulb className="w-6 h-6 text-primary" />
                  </div>
                </motion.div>
                <motion.div
                  className="absolute -left-8 bottom-1/4 animate-pulse-glow"
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1 }}
                >
                  <div className="glass rounded-full p-4">
                    <Sparkles className="w-6 h-6 text-primary" />
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
          
          {/* Background Elements */}
          <motion.div 
            className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-1/2 -z-10 h-[500px] w-[500px] rounded-full bg-primary/20 blur-3xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.3 }}
            transition={{ duration: 1 }}
          />
          <motion.div 
            className="absolute top-0 left-0 -translate-x-1/2 -z-10 h-[400px] w-[400px] rounded-full bg-primary/30 blur-3xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.3 }}
            transition={{ duration: 1, delay: 0.2 }}
          />
        </section>

        {/* Comparison Section */}
        <ComparisonSection />

        {/* Popup Builder Section */}
        <PopupBuilder />

        {/* Creator Achievements Section */}
        <CreatorAchievements />

        {/* Features Section */}
        <div className="w-full">
          <Features />
        </div>

        

        {/* Testimonials Section */}
        <div className="w-full bg-secondary/50">
          <Testimonials />
        </div>

        {/* All-in-One Advantage Section */}
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <AllInOneAdvantage />
        </div>

        {/* Testimonials1 Section */}
        <div className="w-full">
          <Testimonials1 />
        </div>

        {/* Pricing Section */}
        <div className="w-full">
          <Pricing onAuthModalOpen={() => setIsAuthModalOpen(true)} />
        </div>

        {/* FAQ Section */}
        <div className="w-full bg-secondary/50">
          <FAQ />
        </div>

        {/* Footer */}
        <div className="w-full">
          <Footer />
        </div>
    </div>
    </main>
  );
}
