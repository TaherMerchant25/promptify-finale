import React, { useState, useEffect } from 'react';
import { RoundData, RoundResult, SubRoundResult } from '../types';
import { GeminiService } from '../services/geminiService';
import { Send, Loader2, CheckCircle2, ArrowRight, Clock, Target } from 'lucide-react';

interface SubRoundGameProps {
  round: RoundData;
  service: GeminiService;
  onComplete: (result: RoundResult) => void;
  isLastRound: boolean;
}

const SubRoundGame: React.FC<SubRoundGameProps> = ({ round, service, onComplete, isLastRound }) => {
  const [currentSubRoundIndex, setCurrentSubRoundIndex] = useState(0);
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isJudging, setIsJudging] = useState(false);
  const [subRoundResults, setSubRoundResults] = useState<SubRoundResult[]>([]);
  const [currentResult, setCurrentResult] = useState<SubRoundResult | null>(null);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes for all sub-rounds
  const [isTimeUp, setIsTimeUp] = useState(false);

  const subRounds = round.subRounds || [];
  const currentSubRound = subRounds[currentSubRoundIndex];
  const isAllComplete = subRoundResults.length === subRounds.length;

  // Timer effect
  useEffect(() => {
    if (isAllComplete || isTimeUp) return;

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
  }, [isAllComplete, isTimeUp]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isGenerating || currentResult) return;

    setIsGenerating(true);

    try {
      // Generate content
      const output = await service.generateText(prompt);
      setIsGenerating(false);

      // Judge content - compare with target phrase
      setIsJudging(true);
      const judgment = await service.calculatePhraseSimilarity(currentSubRound.targetPhrase, output);

      const result: SubRoundResult = {
        subRoundId: currentSubRound.id,
        userPrompt: prompt,
        generatedContent: output,
        score: judgment.score,
        flagged: false,
        flagReason: undefined
      };
      
      setCurrentResult(result);

    } catch (err: any) {
      console.error("Generation failed", err);
      alert(err?.message || "Error during generation. Please try again.");
    } finally {
      setIsGenerating(false);
      setIsJudging(false);
    }
  };

  const handleNextSubRound = () => {
    if (!currentResult) return;
    
    setSubRoundResults([...subRoundResults, currentResult]);
    setCurrentResult(null);
    setPrompt('');
    setCurrentSubRoundIndex(prev => prev + 1);
  };

  const handleFinishRound = () => {
    const allResults = [...subRoundResults, currentResult!];
    const totalScore = Math.round(allResults.reduce((sum, r) => sum + r.score, 0) / allResults.length);
    
    const roundResult: RoundResult = {
      roundId: round.id,
      userPrompt: allResults.map(r => r.userPrompt).join('\n---\n'),
      generatedContent: allResults.map(r => r.generatedContent).join('\n---\n'),
      score: totalScore,
      reasoning: `Completed ${allResults.length} sub-rounds with an average score of ${totalScore}.`,
      subRoundResults: allResults
    };
    
    onComplete(roundResult);
  };

  // Final Results View
  if (isAllComplete || (currentResult && currentSubRoundIndex === subRounds.length - 1 && currentResult)) {
    const allResults = currentResult ? [...subRoundResults, currentResult] : subRoundResults;
    const totalScore = Math.round(allResults.reduce((sum, r) => sum + r.score, 0) / allResults.length);

    return (
      <div className="flex flex-col h-full animate-in fade-in duration-500 bg-[#030303]">
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Score Header */}
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-6 text-center">
            <h2 className="text-white/40 uppercase tracking-wider text-sm font-semibold mb-2">Round 1 Complete</h2>
            <div className={`text-6xl font-black ${
                totalScore >= 80 ? 'text-green-500' :
                totalScore >= 50 ? 'text-yellow-500' : 'text-red-500'
            }`}>
              {totalScore}
            </div>
            <p className="text-white/50 mt-2">Average score across {allResults.length} challenges</p>
          </div>

          {/* Sub-round Results */}
          <div className="space-y-4">
            <h3 className="text-white/60 text-sm font-semibold uppercase tracking-wider">Results Breakdown</h3>
            {allResults.map((result, index) => (
              <div key={result.subRoundId} className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-white/40">#{index + 1}</span>
                    <span className="text-white/80 font-medium">"{subRounds[index].targetPhrase}"</span>
                  </div>
                  <span className={`text-2xl font-bold ${
                    result.score >= 80 ? 'text-green-500' :
                    result.score >= 50 ? 'text-yellow-500' : 'text-red-500'
                  }`}>
                    {result.score}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-white/30 text-xs uppercase">Your Prompt</span>
                    <p className="text-white/60 mt-1 font-mono text-xs">{result.userPrompt}</p>
                  </div>
                  <div>
                    <span className="text-white/30 text-xs uppercase">AI Output</span>
                    <p className="text-white/60 mt-1 font-mono text-xs line-clamp-3">{result.generatedContent}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 border-t border-white/[0.08] bg-black/30 backdrop-blur-sm">
          <button
            onClick={handleFinishRound}
            className="w-full bg-gradient-to-r from-indigo-500 to-rose-500 hover:from-indigo-400 hover:to-rose-400 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-transform active:scale-[0.98]"
          >
            {isLastRound ? 'Finish Game' : 'Next Round'} <ArrowRight size={20} />
          </button>
        </div>
      </div>
    );
  }

  // Sub-round Result View (before moving to next)
  if (currentResult) {
    return (
      <div className="flex flex-col h-full animate-in fade-in duration-500 bg-[#030303]">
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Progress */}
          <div className="flex items-center gap-2">
            {subRounds.map((_, idx) => (
              <div 
                key={idx} 
                className={`h-2 flex-1 rounded-full ${
                  idx < currentSubRoundIndex ? 'bg-green-500' :
                  idx === currentSubRoundIndex ? 'bg-indigo-500' : 'bg-white/10'
                }`} 
              />
            ))}
          </div>

          {/* Result Card */}
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-6 text-center">
            <h2 className="text-white/40 uppercase tracking-wider text-sm font-semibold mb-2">
              Sub-round {currentSubRoundIndex + 1} of {subRounds.length}
            </h2>
            <div className={`text-6xl font-black ${
                currentResult.score >= 80 ? 'text-green-500' :
                currentResult.score >= 50 ? 'text-yellow-500' : 'text-red-500'
            }`}>
              {currentResult.score}
            </div>
          </div>

          {/* Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white/[0.03] border border-white/[0.08] rounded-lg p-4">
              <div className="flex items-center gap-2 text-indigo-400 font-semibold mb-2">
                <Target size={16} /> Target Phrase
              </div>
              <p className="text-white/80 font-mono text-sm">"{currentSubRound.targetPhrase}"</p>
            </div>
            <div className="bg-white/[0.03] border border-white/[0.08] rounded-lg p-4">
              <div className="flex items-center gap-2 text-rose-400 font-semibold mb-2">
                <CheckCircle2 size={16} /> AI Generated
              </div>
              <p className="text-white/80 font-mono text-sm line-clamp-3">{currentResult.generatedContent}</p>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-white/[0.08] bg-black/30 backdrop-blur-sm">
          <button
            onClick={currentSubRoundIndex === subRounds.length - 1 ? handleFinishRound : handleNextSubRound}
            className="w-full bg-gradient-to-r from-indigo-500 to-rose-500 hover:from-indigo-400 hover:to-rose-400 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-transform active:scale-[0.98]"
          >
            {currentSubRoundIndex === subRounds.length - 1 ? 'See Final Results' : `Next Challenge (${currentSubRoundIndex + 2}/${subRounds.length})`} <ArrowRight size={20} />
          </button>
        </div>
      </div>
    );
  }

  // GAMEPLAY VIEW
  return (
    <div className="flex flex-col h-full bg-[#030303]">
      {/* Top Bar */}
      <div className="p-6 border-b border-white/[0.08] bg-black/30">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            Round {round.id}: {round.title}
          </h2>
          <div className="flex items-center gap-4">
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              Challenge {currentSubRoundIndex + 1} of {subRounds.length}
            </span>
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full font-bold ${
              isTimeUp ? 'bg-red-500/10 text-red-400' :
              timeLeft <= 60 ? 'bg-red-500/10 text-red-400' : 
              timeLeft <= 120 ? 'bg-yellow-500/10 text-yellow-400' : 
              'bg-green-500/10 text-green-400'
            }`}>
              <Clock size={16} />
              <span className="font-mono">{formatTime(timeLeft)}</span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="flex items-center gap-2 mb-4">
          {subRounds.map((_, idx) => (
            <div 
              key={idx} 
              className={`h-2 flex-1 rounded-full transition-all ${
                idx < currentSubRoundIndex ? 'bg-green-500' :
                idx === currentSubRoundIndex ? 'bg-indigo-500' : 'bg-white/10'
              }`} 
            />
          ))}
        </div>

        <p className="text-white/40 mb-4">{round.description}</p>
        
        {isTimeUp && (
          <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
            <p className="text-red-400 font-semibold">⏰ Time's up! You can still submit your answer.</p>
          </div>
        )}
        
        {/* Target Phrase */}
        <div className="bg-black/40 border border-white/[0.08] rounded-lg p-4">
          <div className="text-xs text-white/40 uppercase font-bold mb-2 flex items-center gap-2">
            <Target size={14} /> Target Phrase
          </div>
          <p className="text-2xl text-white font-bold text-center py-4">
            "{currentSubRound.targetPhrase}"
          </p>
        </div>
      </div>

      {/* Input Area */}
      <div className="flex-1 p-6 flex flex-col justify-end">
        <form onSubmit={handleSubmit} className="relative">
          <div className="text-white/40 text-sm font-medium mb-2">
            Your Prompt (make the AI say the target phrase)
          </div>
          <div className="relative group">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={isGenerating || isJudging}
              className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl p-4 pr-16 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all h-32 resize-none font-mono text-sm placeholder-white/20 disabled:opacity-50"
              placeholder="Write a creative prompt to make the AI output the target phrase..."
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
              {isGenerating ? "Gemini is thinking..." : "Checking similarity..."}
            </div>
            <p className="text-white/40 text-sm">
              {isGenerating ? "Generating response to your prompt." : "Comparing output with target phrase."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubRoundGame;
