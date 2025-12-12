import React from 'react';
import { motion } from 'motion/react';
import { BookOpen, Target, Star, Trophy, Clock, Zap, Brain, Code, ImageIcon, Sparkles } from 'lucide-react';

interface HowToPlayProps {
  onBack?: () => void;
}

const HowToPlay: React.FC<HowToPlayProps> = ({ onBack }) => {
  const sections = [
    {
      icon: <Target className="text-indigo-400" size={32} />,
      title: "Game Objective",
      description: "Master the art of prompt engineering by crafting creative prompts that make AI generate specific outputs. Your goal is to achieve the highest score across multiple challenging rounds.",
      color: "from-indigo-500/10 to-indigo-600/10 border-indigo-500/20"
    },
    {
      icon: <Brain className="text-rose-400" size={32} />,
      title: "How It Works",
      description: "You'll face different challenges where you need to write prompts that guide the AI to produce exact phrases, ASCII art, or specific content. The closer your output matches the target, the higher your score.",
      color: "from-rose-500/10 to-rose-600/10 border-rose-500/20"
    },
    {
      icon: <Zap className="text-yellow-400" size={32} />,
      title: "Multiple Attempts",
      description: "Get up to 3 attempts per challenge to refine your prompts and achieve the best possible score. Your highest-scoring attempt will be counted, so experiment freely!",
      color: "from-yellow-500/10 to-yellow-600/10 border-yellow-500/20"
    },
    {
      icon: <Star className="text-purple-400" size={32} />,
      title: "Scoring System",
      description: "Earn 0-5 stars per challenge based on accuracy. Exact matches earn 5 stars, while partial matches earn fewer stars based on keyword overlap and similarity. Cheating (using target text in prompts) results in 0 stars.",
      color: "from-purple-500/10 to-purple-600/10 border-purple-500/20"
    },
    {
      icon: <Code className="text-green-400" size={32} />,
      title: "Round Types",
      description: "Face diverse challenges including phrase matching, ASCII art generation, and creative text generation. Each round type tests different aspects of your prompt engineering skills.",
      color: "from-green-500/10 to-green-600/10 border-green-500/20"
    },
    {
      icon: <Clock className="text-orange-400" size={32} />,
      title: "Time Management",
      description: "You have 10 minutes per round to complete all challenges. Manage your time wisely to maximize your score while maintaining quality. Faster completion times can help you climb the leaderboard.",
      color: "from-orange-500/10 to-orange-600/10 border-orange-500/20"
    }
  ];

  const tips = [
    "Think creatively - indirect approaches often work better than direct instructions",
    "Use context and examples to guide the AI without revealing the exact answer",
    "Pay attention to keywords - matching key terms improves your score",
    "Experiment with different prompt styles across your 3 attempts",
    "Avoid using the target phrase directly in your prompt - it will be flagged!",
    "Practice makes perfect - learn from each round to improve your skills"
  ];

  return (
    <div className="min-h-screen bg-[#030303] text-white">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-b from-indigo-900/20 to-transparent border-b border-white/[0.08]">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-40"></div>
        
        <div className="relative max-w-6xl mx-auto px-6 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="flex items-center justify-center gap-3 mb-4">
              <BookOpen className="text-indigo-400" size={48} />
            </div>
            <h1 className="text-5xl font-black mb-3 bg-gradient-to-r from-indigo-400 to-rose-400 bg-clip-text text-transparent">
              How to Play
            </h1>
            <p className="text-white/60 text-lg max-w-2xl mx-auto">
              Master prompt engineering through creative challenges
            </p>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Game Mechanics */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {sections.map((section, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`bg-gradient-to-br ${section.color} backdrop-blur-sm border rounded-xl p-6 hover:scale-[1.02] transition-transform`}
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-14 h-14 flex items-center justify-center bg-black/30 rounded-lg">
                  {section.icon}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-2">{section.title}</h3>
                  <p className="text-white/70 leading-relaxed">{section.description}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Pro Tips Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-gradient-to-br from-yellow-500/10 to-amber-600/10 border border-yellow-500/20 rounded-xl p-8 mb-12"
        >
          <div className="flex items-center gap-3 mb-6">
            <Sparkles className="text-yellow-400" size={32} />
            <h2 className="text-2xl font-black text-white">Pro Tips</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {tips.map((tip, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 + index * 0.05 }}
                className="flex items-start gap-3"
              >
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-yellow-400/20 flex items-center justify-center mt-0.5">
                  <span className="text-yellow-400 text-xs font-bold">{index + 1}</span>
                </div>
                <p className="text-white/70 text-sm leading-relaxed">{tip}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Game Flow */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-8"
        >
          <h2 className="text-2xl font-black text-white mb-6 text-center">Game Flow</h2>
          <div className="flex flex-col md:flex-row items-center justify-center gap-4">
            {[
              { icon: <Code size={24} />, text: "Enter Game" },
              { icon: <Target size={24} />, text: "View Challenge" },
              { icon: <Brain size={24} />, text: "Write Prompt" },
              { icon: <Star size={24} />, text: "Get Score" },
              { icon: <Zap size={24} />, text: "Try Again (3x)" },
              { icon: <Trophy size={24} />, text: "Next Round" }
            ].map((step, index) => (
              <React.Fragment key={index}>
                <div className="flex flex-col items-center gap-2">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500/20 to-rose-500/20 border border-white/10 flex items-center justify-center text-indigo-400">
                    {step.icon}
                  </div>
                  <span className="text-sm text-white/60 font-medium">{step.text}</span>
                </div>
                {index < 5 && (
                  <div className="hidden md:block text-white/20">→</div>
                )}
              </React.Fragment>
            ))}
          </div>
        </motion.div>

        {/* Back Button */}
        {onBack && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="text-center mt-12"
          >
            <button
              onClick={onBack}
              className="px-8 py-3 bg-gradient-to-r from-indigo-500 to-rose-500 hover:from-indigo-400 hover:to-rose-400 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-500/25"
            >
              Start Playing Now
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default HowToPlay;
