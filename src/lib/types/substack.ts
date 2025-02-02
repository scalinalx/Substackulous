export interface SubstackAnalysis {
  url: string;
  metrics: {
    subscribers: number;
    openRate: number;
    clickRate: number;
    conversionRate: number;
  };
  engagement: {
    commentFrequency: number;
    shareRate: number;
    averageReadTime: number;
  };
  recommendations: {
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
  }[];
  growthOpportunities: {
    title: string;
    description: string;
    potentialImpact: 'high' | 'medium' | 'low';
  }[];
}

export interface SubstackOptimization {
  url: string;
  optimizations: {
    category: string;
    suggestions: {
      title: string;
      description: string;
      implementation: string;
      expectedImpact: 'high' | 'medium' | 'low';
    }[];
  }[];
}

export interface SubstackError {
  message: string;
  code: string;
  details?: unknown;
} 