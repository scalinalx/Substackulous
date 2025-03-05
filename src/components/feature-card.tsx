"use client"

import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  delay?: number;
  index: number;
}

export function FeatureCard({ icon: Icon, title, description, delay = 0, index }: FeatureCardProps) {
  const gradientColors = [
    'from-yellow-500/10 via-yellow-500/5 via-yellow-500/[0.01] to-transparent', // Yellow/gold
    'from-purple-400/10 via-purple-400/5 via-purple-400/[0.01] to-transparent', // Light purple
    'from-sky-300/10 via-sky-300/5 via-sky-300/[0.01] to-transparent',    // Baby blue
    'from-green-400/10 via-green-400/5 via-green-400/[0.01] to-transparent',  // Mint
    'from-orange-400/10 via-orange-400/5 via-orange-400/[0.01] to-transparent', // Orange/amber
    'from-blue-400/10 via-blue-400/5 via-blue-400/[0.01] to-transparent',    // Blue
  ];

  const borderColors = [
    'group-hover:border-yellow-500', // Yellow/gold
    'group-hover:border-purple-400', // Light purple
    'group-hover:border-sky-300',   // Baby blue
    'group-hover:border-green-400',  // Mint
    'group-hover:border-orange-400', // Orange/amber
    'group-hover:border-blue-400',   // Blue
  ];

  const shadowColors = [
    'hover:shadow-yellow-500', // Yellow/gold
    'hover:shadow-purple-400', // Light purple
    'hover:shadow-sky-300',   // Baby blue
    'hover:shadow-green-400',  // Mint
    'hover:shadow-orange-400', // Orange/amber
    'hover:shadow-blue-400',   // Blue
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      viewport={{ once: true }}
    >
      <Card className={`group relative overflow-hidden transition-all hover:-translate-y-1 border border-transparent ${borderColors[index]} ${shadowColors[index]} hover:shadow-[0_8px_30px_rgb(var(--tw-shadow-color)_/_0.4)]`}>
        <div className={`absolute -top-[200%] -right-[200%] h-[500%] w-[500%] bg-gradient-radial ${gradientColors[index]} opacity-0 transition-opacity duration-300 ease-in-out group-hover:opacity-60 transform rotate-12 blur-xl`} />
        <CardContent className="p-6 relative">
          <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
            <Icon className="h-6 w-6" />
          </div>
          <h3 className="mb-2 font-semibold tracking-tight">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </CardContent>
      </Card>
    </motion.div>
  );
} 