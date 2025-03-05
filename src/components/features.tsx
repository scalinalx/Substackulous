"use client"

import { motion } from "framer-motion";
import { Wand2, LineChart, Users, Laptop2, Shield, LifeBuoy } from "lucide-react";
import { FeatureCard } from "./feature-card";

const features = [
  {
    icon: Wand2,
    title: "Smart Automation",
    description: "Our AI-powered content engine generates engaging newsletters  and viral notes in minutes, not hours. Stop staring at blank pages and start publishing content that captivates your audience every time."
  },
  {
    icon: LineChart,
    title: "PRO Content Analysis",
    description: "Unlock powerful insights into both your content and competitors' strategies. Identify winning patterns, understand what drives engagement, and leverage data to consistently outperform in your niche and attract more subscribers."
  },
  {
    icon: Users,
    title: "Viral Note Generator",
    description: "Experience subscriber growth on autopilot with Substack Notes that spread organically. Our custom-built AI engine analyzes viral content patterns to help you craft short-form & long-form notes that expand your reach and convert casual readers into loyal followers."
  },
  {
    icon: Laptop2,
    title: "Thumbnail Creator",
    description: "Stop losing potential readers with amateur images. Our AI-powered generator creates eye-catching thumbnails that drive 3x higher click rates, making your content stand out in crowded feeds and significantly increasing your visibility."
  },
  {
    icon: Shield,
    title: "Monetization Toolkit",
    description: "Transform your audience into a sustainable income with conversion-optimized offers and content that drips value. Build compelling paid tiers that showcase your value, with proven strategies that increase free-to-paid conversion rates by up to 5X."
  },
  {
    icon: LifeBuoy,
    title: "Intuitive Interface",
    description: "Replace your complex, multi-tool workflow with one seamless platform. Access everything from content creation to thumbnail design to offer building in a single dashboard, saving up to $300/month on subscriptions while cutting your production time by 75%."
  }
];

export function Features() {
  return (
    <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 1 }}
        viewport={{ once: true }}
        className="text-center max-w-3xl mx-auto mb-16"
      >
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
          Why <span className="text-primary">thousands</span> of writers use Substackulous
        </h2>
        <p className="text-muted-foreground text-lg">
          Our platform streamlines your workflow, eliminates repetitive tasks, and helps you focus on creating great content.
        </p>
      </motion.div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {features.map((feature, index) => (
          <FeatureCard
            key={feature.title}
            icon={feature.icon}
            title={feature.title}
            description={feature.description}
            delay={index * 0.1}
            index={index}
          />
        ))}
      </div>
    </section>
  );
} 