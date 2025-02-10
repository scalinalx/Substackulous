import { CreativePricing } from "@/app/components/ui/creative-pricing"
import type { PricingTier } from "@/app/components/ui/creative-pricing"
import { Button } from "@/app/components/ui/button"
import { Check, Pencil, Star, Sparkles } from "lucide-react";

const sampleTiers: PricingTier[] = [
    {
        name: "Hobby Substacker",
        icon: <Pencil className="w-6 h-6" />,
        price: 7,
        description: "Perfect for beginners looking to jumpstart their Substack journey",
        color: "amber",
        features: [
            "Just Starting Out On Substack",
            "Boost your creativity and output",
            "AI Topic Generation",
            "Basic Analytics",
        ],
    },
    {
        name: "Pro Substacker",
        icon: <Star className="w-6 h-6" />,
        price: 47,
        description: "For serious content creators who want to master Substack and become the leaders of their catagory",
        color: "blue",
        features: [
            "Perfect if you're really serious about Substack",
            "5x growth on your Substack journey",
            "Improve your conversion rate by 100% and save up to 90h/month",
            "Credits are 50% cheaper (compared to Hobby Substacker)",
        ],
        popular: true,
    },
    {
        name: "Amateur Substacker",
        icon: <Sparkles className="w-6 h-6" />,
        price: 21,
        description: "For authors looking to fastrack their Substack virality and growth",
        color: "purple",
        features: [
            "2x growth on your Substack journey",
            "Perfect if you post a couple of times a week",
            "Improve your conversion rate by 50% and save up to 30h/month",
            "Credits are 25% cheaper (compared to Hobby Substacker)",
        ],
    },
];

function CreativePricingDemo() {
    return <CreativePricing tiers={sampleTiers} />
}

export { CreativePricingDemo } 