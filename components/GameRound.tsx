import React, { useState, useEffect } from 'react';
import { RoundData, RoundResult } from '../types';
import { GeminiService } from '../services/geminiService';
import { Send, Image as ImageIcon, Type, Loader2, CheckCircle2, ArrowRight, BarChart, Clock } from 'lucide-react';
import { RoundShowcase } from './RoundShowcase';
import SubRoundGame from './SubRoundGame';

interface GameRoundProps {
  round: RoundData;
  service: GeminiService;
  onComplete: (result: RoundResult) => void;
  isLastRound: boolean;
}

const GameRound: React.FC<GameRoundProps> = ({ round, service, onComplete, isLastRound }) => {
  // If round has sub-rounds, delegate to SubRoundGame component
  if (round.subRounds && round.subRounds.length > 0) {
    return (
      <SubRoundGame 
        round={round} 
        service={service} 
        onComplete={onComplete} 
        isLastRound={isLastRound} 
      />
    );
  }
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isJudging, setIsJudging] = useState(false);
  const [generatedOutput, setGeneratedOutput] = useState<string | null>(null);
  const [result, setResult] = useState<RoundResult | null>(null);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes in seconds
  const [isTimeUp, setIsTimeUp] = useState(false);

  // Timer effect
  useEffect(() => {
    if (result || isTimeUp) return; // Stop timer if round is complete or time is up

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setIsTimeUp(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [result, isTimeUp]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimerColor = () => {
    if (timeLeft <= 30) return 'text-red-500';
    if (timeLeft <= 60) return 'text-yellow-500';
    return 'text-green-500';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isGenerating || result) return;

    setIsGenerating(true);

    try {
      // 1. Generate Content
      let output = "";
      if (round.type === 'text') {
        output = await service.generateText(prompt);
      } else {
        output = await service.generateImage(prompt);
      }
      setGeneratedOutput(output);
      setIsGenerating(false);

      // 2. Judge Content
      setIsJudging(true);
      const judgment = await service.calculateSimilarity(round.targetContent, output, round.type);
      
      const roundResult: RoundResult = {
        roundId: round.id,
        userPrompt: prompt,
        generatedContent: output,
        score: judgment.score,
        reasoning: judgment.reasoning
      };
      
      setResult(roundResult);

    } catch (err: any) {
      console.error("Generation failed", err);
      const message = err?.message ? `Error during generation: ${err.message}` : "Error during generation. Please try again.";
      alert(message);
    } finally {
      setIsGenerating(false);
      setIsJudging(false);
    }
  };

  if (result) {
    // RESULTS VIEW
    return (
      <div className="flex flex-col h-full animate-in fade-in duration-500 bg-[#030303]">
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
          {/* Score Header */}
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-6 text-center">
            <h2 className="text-white/40 uppercase tracking-wider text-sm font-semibold mb-2">Similarity Score</h2>
            <div className={`text-6xl font-black ${
                result.score >= 80 ? 'text-green-500' :
                result.score >= 50 ? 'text-yellow-500' : 'text-red-500'
            }`}>
              {result.score}
            </div>
            <div className="mt-4 p-4 bg-black/30 rounded-lg text-left">
                <span className="text-white/30 text-xs uppercase font-bold">Judge's Reasoning:</span>
                <p className="text-white/70 mt-1">{result.reasoning}</p>
            </div>
          </div>

          {/* Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-indigo-400 font-semibold">
                 <CheckCircle2 size={18} /> Target
              </div>
              <div className="bg-white/[0.03] border border-white/[0.08] rounded-lg p-4 h-64 overflow-auto">
                {round.type === 'text' ? (
                  <pre className="text-xs text-white/70 whitespace-pre-wrap font-mono">{round.displayTarget || round.targetContent}</pre>
                ) : (
                  <img src={round.targetContent} alt="Target" className="w-full h-full object-contain" />
                )}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-rose-400 font-semibold">
                 <Type size={18} /> Your Output
              </div>
              <div className="bg-white/[0.03] border border-white/[0.08] rounded-lg p-4 h-64 overflow-auto">
                {round.type === 'text' ? (
                  <pre className="text-xs text-white/70 whitespace-pre-wrap font-mono">{result.generatedContent}</pre>
                ) : (
                  <img src={result.generatedContent} alt="Generated" className="w-full h-full object-contain" />
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-white/[0.08] bg-black/30 backdrop-blur-sm">
          <button
            onClick={() => onComplete(result)}
            className="w-full bg-gradient-to-r from-indigo-500 to-rose-500 hover:from-indigo-400 hover:to-rose-400 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-transform active:scale-[0.98]"
          >
            {isLastRound ? 'Finish Game' : 'Next Round'} <ArrowRight size={20} />
          </button>
        </div>
      </div>
    );
  }

  // GAMEPLAY VIEW
  return (
    <div className="flex flex-col h-full bg-[#030303]">
      {/* Top Bar: Target Info */}
      <div className="p-6 border-b border-white/[0.08] bg-black/30">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            Round {round.id}: {round.title}
          </h2>
          <div className="flex items-center gap-4">
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${round.type === 'text' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
              {round.type} Challenge
            </span>
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full font-bold ${
              isTimeUp ? 'bg-red-500/10 text-red-400' :
              timeLeft <= 30 ? 'bg-red-500/10 text-red-400' : 
              timeLeft <= 60 ? 'bg-yellow-500/10 text-yellow-400' : 
              'bg-green-500/10 text-green-400'
            }`}>
              <Clock size={16} />
              <span className="font-mono">{formatTime(timeLeft)}</span>
            </div>
          </div>
        </div>
        <p className="text-white/40 mb-4">{round.description}</p>
        
        {isTimeUp && (
          <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
            <p className="text-red-400 font-semibold">⏰ Time's up! You can still submit your answer.</p>
          </div>
        )}
        
        <div className="bg-black/40 border border-white/[0.08] rounded-lg p-4 max-h-48 overflow-y-auto">
          <div className="text-xs text-white/40 uppercase font-bold mb-2">Target Output</div>
          {round.type === 'text' ? (
             <pre className="text-sm text-white/70 font-mono whitespace-pre-wrap">{round.displayTarget || round.targetContent}</pre>
          ) : (
             <div className="flex justify-center">
                 <img src={round.targetContent} alt="Target" className="h-32 rounded-md border border-white/[0.1]" />
             </div>
          )}
        </div>
      </div>

      {/* Round Showcase - Interactive Cards for Round 1 */}
      {round.id === 1 && (
        <div className="px-6 py-4 border-b border-white/[0.05]">
          <RoundShowcase roundId={round.id} />
        </div>
      )}

      {/* Input Area */}
      <div className="flex-1 p-6 flex flex-col justify-end">
        <form onSubmit={handleSubmit} className="relative">
          <div className="absolute -top-10 left-0 text-white/40 text-sm font-medium">
             Your Prompt (1 Attempt Only)
          </div>
          <div className="relative group">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={isGenerating || isJudging}
              className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl p-4 pr-16 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all h-32 resize-none font-mono text-sm placeholder-white/20 disabled:opacity-50"
              placeholder={round.type === 'text' ? "Write a prompt to generate the text above..." : "Describe the image above to generate it..."}
            />
            <button
              type="submit"
              disabled={!prompt.trim() || isGenerating || isJudging}
              className="absolute bottom-4 right-4 bg-gradient-to-r from-indigo-500 to-rose-500 hover:from-indigo-400 hover:to-rose-400 text-white p-2 rounded-lg disabled:opacity-0 disabled:pointer-events-none transition-all duration-300 shadow-lg shadow-indigo-500/25"
            >
              <Send size={18} />
            </button>
          </div>
        </form>
      </div>

      {/* Loading Overlay */}
      {(isGenerating || isJudging) && (
        <div className="absolute inset-0 bg-[#030303]/90 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="text-center space-y-4">
            <Loader2 className="animate-spin text-indigo-500 mx-auto" size={48} />
            <div className="text-xl font-bold text-white">
              {isGenerating ? "Gemini is thinking..." : "The Judge is deciding..."}
            </div>
            <p className="text-white/40 text-sm">
                {isGenerating ? "Generating content based on your prompt." : "Calculating cosine similarity & semantic match."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameRound;