import { motion } from "framer-motion";
import { 
  Satellite, 
  Zap, 
  BarChart3, 
  Map, 
  Brain, 
  Download,
  Globe,
  Shield,
  Gauge,
  TrendingUp,
  Upload
} from "lucide-react";
import { cn } from "@/lib/utils";

interface FeatureCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
  stats?: string;
  delay?: number;
}

function FeatureCard({ icon: Icon, title, description, stats, delay = 0 }: FeatureCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      viewport={{ once: true }}
      className="group relative p-6 rounded-2xl bg-white/[0.02] backdrop-blur-sm border border-white/[0.05] hover:border-white/[0.1] transition-all duration-300"
    >
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/[0.05] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <div className="relative">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-green-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
          <Icon className="h-6 w-6 text-blue-400" />
        </div>
        
        <h3 className="text-xl font-semibold text-white mb-3">{title}</h3>
        <p className="text-white/60 text-sm leading-relaxed mb-3">{description}</p>
        
        {stats && (
          <div className="text-2xl font-bold text-green-400">{stats}</div>
        )}
      </div>
    </motion.div>
  );
}

function StatsGrid() {
  const stats = [
    { value: "95%+", label: "Detection Accuracy", icon: Gauge },
    { value: "<3s", label: "Processing Time", icon: Zap },
    { value: "10MB", label: "Max File Size", icon: Upload },
    { value: "24/7", label: "System Uptime", icon: Shield },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      viewport={{ once: true }}
      className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-16"
    >
      {stats.map((stat, index) => (
        <div
          key={stat.label}
          className="text-center p-6 rounded-xl bg-white/[0.02] border border-white/[0.05]"
        >
          <stat.icon className="h-8 w-8 text-blue-400 mx-auto mb-3" />
          <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
          <div className="text-sm text-white/60">{stat.label}</div>
        </div>
      ))}
    </motion.div>
  );
}

function FeaturesSection({ onGetStarted }: { onGetStarted?: () => void }) {
  const features = [
    {
      icon: Brain,
      title: "AI-Powered Analysis",
      description: "Advanced machine learning algorithms powered by GPT-4 Vision API detect and classify environmental changes with high precision.",
      stats: "90%+ Accuracy",
    },
    {
      icon: BarChart3,
      title: "Comprehensive Reports",
      description: "Generate detailed environmental reports with executive summaries, predictions, and actionable recommendations for authorities.",
      stats: "15+ Metrics",
    },
    {
      icon: Map,
      title: "Zone-wise Analysis",
      description: "Spatial analysis across multiple zones with detailed breakdowns of most and least affected areas using advanced algorithms.",
      stats: "5 Zones",
    },
    {
      icon: TrendingUp,
      title: "Future Predictions",
      description: "Multi-timeframe predictions (3-6 months, 1-2 years, 5-10 years) with trend analysis and critical threshold identification.",
      stats: "3 Timeframes",
    },
    {
      icon: Download,
      title: "PDF Export",
      description: "Professional PDF reports with comprehensive analysis, visualizations, and actionable recommendations ready for stakeholders.",
      stats: "One-Click",
    },
    {
      icon: Globe,
      title: "Environmental Focus",
      description: "Specialized for environmental monitoring including deforestation, urbanization, water changes, and natural disaster assessment.",
      stats: "6 Categories",
    },
  ];

  return (
    <section className="relative py-20 bg-[#030303]">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-500/[0.02] to-transparent" />
      
      <div className="relative container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.03] border border-white/[0.08] mb-6">
            <Satellite className="h-4 w-4 text-blue-400" />
            <span className="text-sm text-white/60">Advanced Technology</span>
          </div>
          
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
            Powerful Features for
            <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-green-400">
              Environmental Analysis
            </span>
          </h2>
          
          <p className="text-lg text-white/60 max-w-2xl mx-auto">
            Comprehensive satellite image analysis with AI-powered insights, 
            professional reporting, and actionable environmental recommendations.
          </p>
        </motion.div>

        <StatsGrid />

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {features.map((feature, index) => (
            <FeatureCard
              key={feature.title}
              {...feature}
              delay={index * 0.1}
            />
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <div className="p-8 rounded-2xl bg-gradient-to-r from-blue-500/[0.1] to-green-500/[0.1] border border-white/[0.1]">
            <h3 className="text-2xl font-bold text-white mb-4">
              Ready to Analyze Your Satellite Images?
            </h3>
            <p className="text-white/60 mb-6 max-w-md mx-auto">
              Upload your before and after satellite images to get started with comprehensive environmental analysis.
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onGetStarted}
              className="px-8 py-3 bg-gradient-to-r from-blue-500 to-green-500 text-white font-semibold rounded-xl hover:shadow-lg transition-all duration-300"
            >
              Get Started
            </motion.button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export { FeaturesSection };