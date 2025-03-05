import { motion } from "framer-motion";
import { Clock, TrendingUp, DollarSign, BarChart } from "lucide-react";

interface AchievementCardProps {
  icon: React.ReactNode;
  value: string;
  description: string;
  delay: number;
}

const AchievementCard = ({ icon, value, description, delay }: AchievementCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      className="flex-1 bg-card rounded-xl p-6 shadow-lg border border-border flex flex-col items-center text-center"
    >
      <div className="flex items-center gap-2 mb-2">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: delay + 0.2, type: "spring" }}
          className="p-2 rounded-full bg-primary/10 text-primary"
        >
          {icon}
        </motion.div>
        <motion.h3
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: delay + 0.3 }}
          className="text-4xl font-bold gradient-text"
        >
          {value}
        </motion.h3>
      </div>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: delay + 0.4 }}
        className="text-muted-foreground"
      >
        {description}
      </motion.p>
    </motion.div>
  );
};

export function CreatorAchievements() {
  return (
    <section className="py-24 w-full">
      <div className="container mx-auto px-4 md:px-6">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-3xl md:text-4xl font-bold text-center mb-12"
        >
          What Our Creators Achieve
        </motion.h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <AchievementCard
            icon={<Clock className="h-5 w-5" />}
            value="83%"
            description="Less time spent creating content"
            delay={0.1}
          />
          <AchievementCard
            icon={<TrendingUp className="h-5 w-5" />}
            value="347%"
            description="Average subscriber growth in 6 months"
            delay={0.2}
          />
          <AchievementCard
            icon={<DollarSign className="h-5 w-5" />}
            value="$4,300"
            description="Average monthly revenue increase"
            delay={0.3}
          />
          <AchievementCard
            icon={<BarChart className="h-5 w-5" />}
            value="5x"
            description="Higher engagement rates"
            delay={0.4}
          />
        </div>
      </div>
    </section>
  );
} 