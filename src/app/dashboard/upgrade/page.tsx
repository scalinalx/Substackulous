'use client';

import { useEffect } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Check, Crown, Zap, Star } from 'lucide-react';

const plans = [
  {
    name: "Pro",
    description: "For growing newsletters with advanced features",
    price: 47,
    features: [
      "2500 credits/month",
      "Custom-built AI engine that generates Viral Substack content",
      "Save up to 90 hours of work per month",
      "Boost your subscriber growth rate with up to 347%",
      "5x Higher Engagement Rates",
    ],
    icon: Zap,
    popular: true,
  },
  {
    name: "Legend",
    description: "Pro plan, paid annually (2 months FREE)",
    price: 470,
    billingPeriod: "year",
    features: [
      "Everything in Pro plan +",
      "Save $94 with annual billing",
      "Basically UNLIMITED usage of all advanced features",
      "Priority support",
      "State of the art AI engine that generates Viral Substack content",
      "Brainstorm ideas in seconds and find viral inspiration for your posts/notes",
      "Iterate on winners with ease",
      "Understand your audience better than ever before",
      "Get 10x more replies, likes, and comments on your posts & notes",
    ],
    icon: Crown,
    highlight: true,
  },
];

export default function UpgradePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/');
    }
  }, [user, isLoading, router]);

  const handleUpgrade = async (planName: string) => {
    // TODO: Implement Stripe checkout
    console.log(`Upgrading to ${planName} plan`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header Section */}
        <div className="text-center mb-12">
          <motion.h1 
            className="text-4xl font-bold mb-4"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            Upgrade Your Substackulous Experience
          </motion.h1>
          <motion.p 
            className="text-muted-foreground text-lg max-w-2xl mx-auto"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            Choose the perfect plan to supercharge your newsletter growth and engagement
          </motion.p>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className={`relative flex flex-col h-full ${plan.highlight ? "border-primary shadow-glow" : ""}`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-0 right-0 mx-auto w-fit px-4 py-1 rounded-full bg-primary text-primary-foreground text-sm font-medium">
                    Most Popular
                  </div>
                )}

                <CardHeader className="flex flex-col gap-4 p-6">
                  <div className="flex items-center gap-2">
                    <plan.icon className="h-6 w-6 text-primary" />
                    <h3 className="text-2xl font-bold">{plan.name}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">{plan.description}</p>
                  <div className="flex items-baseline">
                    <span className="text-3xl font-bold">$</span>
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground ml-1">/{plan.billingPeriod || 'month'}</span>
                  </div>
                  {plan.name === 'Legend' && (
                    <div className="text-sm text-white bg-purple-700 rounded-full px-3 py-1 w-fit">
                      GET 2 MONTHS FREE
                    </div>
                  )}
                </CardHeader>

                <CardContent className="flex-grow p-6 pt-0">
                  <ul className="space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-primary shrink-0" />
                        <span className="text-muted-foreground text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>

                <CardFooter className="p-6 pt-0">
                  <Button 
                    className="w-full" 
                    variant={plan.highlight ? "default" : "outline"}
                    onClick={() => handleUpgrade(plan.name)}
                  >
                    {plan.name === 'Pro' ? 'Become a PRO' : 'Go LEGEND'}
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* FAQ or Additional Info */}
        <div className="mt-16 text-center">
          <p className="text-muted-foreground">
            Have questions about our plans? {' '}
            <a href="#" className="text-primary hover:underline">Contact our support team</a>
          </p>
        </div>
      </div>
    </div>
  );
} 