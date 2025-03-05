"use client"

import React from 'react';
import { Button } from '@/components/ui/button';

export function CTA() {
  return (
    <section className="py-20 bg-primary text-primary-foreground">
      <div className="container px-4 md:px-6">
        <div className="grid gap-6 lg:grid-cols-2 items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              Ready to transform your Substack newsletter?
            </h2>
            <p className="mt-4 text-primary-foreground/80 md:text-xl">
              Join thousands of creators who are growing their audience and income with Substackulous.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-end">
            <Button size="lg" variant="secondary" className="font-medium">
              Learn More
            </Button>
            <Button size="lg" variant="default" className="bg-background text-foreground hover:bg-background/90 font-medium">
              Start Free Trial
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
} 