"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Check } from "lucide-react"

const plans = [
  {
    name: "Starter",
    description: "FREE! One-time only",
    price: 0,
    features: [
      "One-time only",
      "Receive 100 credits",
      "All tools unlocked",
      "Experience the Substackulous magic",
    ],
  },
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
    popular: true,
  },
  {
    name: "Legend",
    description: "Pro plan, paid annually (2 months FREE)",
    price: 470,
    billingPeriod: "year",
    features: [
      "Everything in Pro plan +",
      "Get 2 Months FREE",
      "Basically UNLIMITED usage of all advanced features",
      "Priority support",
      "State of the art AI engine that generates Viral Notes, Catchy Headlines, eye-catching Thumbnails",
      "Understand your audience better than ever before",
      "Get 10x more replies, likes, and comments on your posts",
    ],
  },
]

interface PricingProps {
  onAuthModalOpen?: () => void;
}

export function Pricing({ onAuthModalOpen }: PricingProps = {}) {
  return (
    <section id="pricing" className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24 sm:pb-32 pt-0 mt-0">
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 1 }}
        viewport={{ once: true }}
        className="text-center max-w-3xl mx-auto mb-16"
      >
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
          Simple, <span className="text-primary">transparent</span> pricing
        </h2>
        <p className="text-muted-foreground text-lg mb-8">
          Choose the perfect plan for your newsletter
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {plans.map((plan, index) => (
          <motion.div
            key={plan.name}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            viewport={{ once: true }}
          >
            <Card className={`relative flex flex-col h-full ${plan.popular ? "border-primary shadow-glow" : ""}`}>
              {plan.popular && (
                <div className="absolute -top-3 left-0 right-0 mx-auto w-fit px-4 py-1 rounded-full bg-primary text-primary-foreground text-sm font-medium">
                  Most Popular
                </div>
              )}

              <CardHeader className="flex flex-col gap-4 p-6">
                <div>
                  <h3 className="text-xl font-bold">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
                </div>
                <div className="flex items-baseline">
                  <span className="text-3xl font-bold">$</span>
                  <span className="text-4xl font-bold">{plan.price}</span>
                  {plan.name === 'Starter' ? (
                    <span className="text-muted-foreground ml-1"> - One Time Only</span>
                  ) : (
                    <span className="text-muted-foreground ml-1">/{plan.billingPeriod || 'month'}</span>
                  )}
                </div>
                {plan.name === 'Legend' && (
                  <div className="text-sm text-primary-foreground bg-primary/80 rounded-full px-3 py-1 w-fit">
                    Save $94 with annual billing
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
                  variant={plan.popular ? "default" : "outline"}
                  onClick={plan.name === 'Starter' && onAuthModalOpen ? onAuthModalOpen : undefined}
                >
                  {plan.name === 'Starter' ? 'START Today' : 
                   plan.name === 'Pro' ? 'Become a PRO' : 
                   'You Go, LEGEND'}
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        ))}
      </div>
    </section>
  )
} 