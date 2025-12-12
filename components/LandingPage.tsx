import React from 'react';
import { motion } from 'framer-motion';
import { HeroGeometric } from '@/components/ui/shape-landing-hero';
import { AIMSFooter } from '@/components/ui/footer';
import { Navbar1 } from '@/components/ui/navbar-1';
import { Sparkles, Zap, Brain, Trophy, ArrowRight } from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
}

interface FeatureCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
  delay: number;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ 
  icon: Icon, 
  title, 
  description, 
  delay 
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6, delay }}
    className="relative group"
  >
    <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-rose-500/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    <div className="relative bg-white/[0.03] backdrop-blur-sm border border-white/[0.08] rounded-2xl p-6 hover:border-white/[0.15] transition-all duration-300">
      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/20 to-rose-500/20 flex items-center justify-center mb-4">
        <Icon className="w-6 h-6 text-white/80" />
      </div>
      <h3 className="text-lg font-semibold text-white/90 mb-2">{title}</h3>
      <p className="text-sm text-white/50 leading-relaxed">{description}</p>
    </div>
  </motion.div>
);

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted }) => {
  const features = [
    {
      icon: Brain,
      title: "AI-Powered Challenges",
      description: "Test your prompt engineering skills against Gemini AI in dynamic rounds"
    },
    {
      icon: Zap,
      title: "Real-time Competition",
      description: "Compete with players worldwide on the live leaderboard"
    },
    {
      icon: Trophy,
      title: "Climb the Ranks",
      description: "Earn points, unlock achievements, and become a prompt master"
    },
    {
      icon: Sparkles,
      title: "Creative Prompting",
      description: "Explore the art of crafting perfect prompts for AI interactions"
    }
  ];

  return (
    <div className="relative">
      {/* Navbar */}
      <Navbar1 onGetStarted={onGetStarted} />

      {/* Hero Section with Geometric Shapes */}
      <div className="relative">
        <HeroGeometric
          badge="AI Challenge Game"
          title1="Master the Art of"
          title2="Prompt Engineering"
        />
        
        {/* CTA Button Overlay */}
        <div className="absolute bottom-8 left-0 right-0 z-20 flex justify-center">
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.2 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            onClick={onGetStarted}
            className="group relative inline-flex items-center gap-3 px-8 py-4 rounded-full bg-gradient-to-r from-indigo-500 to-rose-500 text-white font-semibold text-lg shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all duration-300"
          >
            <span>Start Playing</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </motion.button>
        </div>
      </div>

      {/* Features Section */}
      <section className="relative bg-[#030303] py-24 px-4">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-indigo-500/[0.02] to-transparent" />
        
        <div className="relative container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white/90 mb-4">
              Why Play Promptify?
            </h2>
            <p className="text-white/50 text-lg max-w-2xl mx-auto">
              Challenge yourself, learn AI interaction, and compete with prompt enthusiasts worldwide
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <FeatureCard
                key={index}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
                delay={0.2 + index * 0.1}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA Section */}
      <section className="relative bg-[#030303] py-20 px-4">
        <div className="absolute inset-0 bg-gradient-to-t from-indigo-500/[0.05] to-transparent" />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative container mx-auto max-w-4xl text-center"
        >
          <div className="bg-gradient-to-r from-indigo-500/10 via-white/[0.03] to-rose-500/10 rounded-3xl border border-white/[0.08] p-12">
            <h2 className="text-2xl md:text-3xl font-bold text-white/90 mb-4">
              Ready to Test Your Skills?
            </h2>
            <p className="text-white/50 mb-8 max-w-xl mx-auto">
              Join thousands of players mastering the art of prompt engineering. 
              Your journey to becoming an AI whisperer starts now.
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              onClick={onGetStarted}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/10 border border-white/20 text-white font-medium hover:bg-white/15 transition-all duration-300"
            >
              <Sparkles className="w-4 h-4" />
              <span>Get Started Free</span>
            </motion.button>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <AIMSFooter />
    </div>
  );
};

export default LandingPage;
