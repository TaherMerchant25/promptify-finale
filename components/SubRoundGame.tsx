import React, { useState, useEffect } from 'react';
import { RoundData, RoundResult, SubRoundResult, AttemptResult } from '../types';
import { GeminiService } from '../services/geminiService';
import { calculateScore, calculateAsciiScore, ScoringResult } from '../lib/scoring';
import { Send, Loader2, CheckCircle2, ArrowRight, Clock, Target, RotateCcw, AlertTriangle, Star } from 'lucide-react';

interface SubRoundGameProps {
  round: RoundData;
  service: GeminiService;
  onComplete: (result: RoundResult) => void;
  isLastRound: boolean;
}

const MAX_ATTEMPTS = 3;

const SubRoundGame: React.FC<SubRoundGameProps> = ({ round, service, onComplete, isLastRound }) => {
  const [currentSubRoundIndex, setCurrentSubRoundIndex] = useState(0);
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [subRoundResults, setSubRoundResults] = useState<SubRoundResult[]>([]);
  const [currentAttempts, setCurrentAttempts] = useState<AttemptResult[]>([]);
  const [currentResult, setCurrentResult] = useState<AttemptResult | null>(null);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes for all sub-rounds
  const [isTimeUp, setIsTimeUp] = useState(false);
  const [showAttemptResult, setShowAttemptResult] = useState(false);
  const [uploadedHtml, setUploadedHtml] = useState<string>('');

  const subRounds = round.subRounds || [];
  const currentSubRound = subRounds[currentSubRoundIndex];
  const isAllComplete = subRoundResults.length === subRounds.length;
  const attemptsRemaining = MAX_ATTEMPTS - currentAttempts.length - (currentResult ? 1 : 0);
  const canTryAgain = attemptsRemaining > 0 && currentResult && !currentResult.flagged;
  const mustSubmit = attemptsRemaining === 0 || (currentResult?.score === 5);
  
  // Calculate cumulative score
  const cumulativeScore = subRoundResults.reduce((sum, r) => sum + r.score, 0);
  const currentTotalScore = currentResult ? cumulativeScore + currentResult.score : cumulativeScore;

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

  // Get best attempt from all attempts including current
  const getBestAttempt = (): { attempt: AttemptResult; index: number } => {
    const allAttempts = currentResult ? [...currentAttempts, currentResult] : currentAttempts;
    let bestIndex = 0;
    let bestScore = -1;
    
    allAttempts.forEach((attempt, idx) => {
      if (attempt.score > bestScore) {
        bestScore = attempt.score;
        bestIndex = idx;
      }
    });
    
    return { attempt: allAttempts[bestIndex], index: bestIndex };
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const htmlContent = event.target?.result as string;
      setUploadedHtml(htmlContent);
    };
    reader.readAsText(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // For HTML upload, check if file is uploaded
    if (round.type === 'html-upload' && !uploadedHtml.trim()) {
      alert('Please upload an HTML file first!');
      return;
    }
    
    // For text/image rounds, check if prompt is entered
    if (round.type !== 'html-upload' && !prompt.trim()) {
      return;
    }
    
    if (isGenerating || showAttemptResult) return;

    setIsGenerating(true);

    try {
      let output = '';
      let scoringResult: ScoringResult;
      
      if (round.type === 'html-upload') {
        // Round 3: HTML upload - No automatic scoring, store for manual review
        output = uploadedHtml;
        scoringResult = {
          score: 0, // Will be scored manually
          reasoning: 'Submitted for manual review',
          exactMatch: false,
          keywordsMatched: [],
          keywordsTotal: [],
          fuzzyMatched: [],
          flagged: false
        };
      } else {
        // Generate content using Gemini for text/image rounds
        output = await service.generateText(prompt);
        
        if (round.type === 'image') {
          // Round 2: ASCII art - No automatic scoring, store for manual review
          scoringResult = {
            score: 0, // Will be scored manually
            reasoning: 'Submitted for manual review',
            exactMatch: false,
            keywordsMatched: [],
            keywordsTotal: [],
            fuzzyMatched: [],
            flagged: false
          };
        } else if (round.title === "ASCII Art Master") {
          // Old text-based ASCII art scoring (if still needed)
          scoringResult = calculateAsciiScore(
            currentSubRound.targetPhrase,
            output,
            prompt
          );
        } else {
          // Round 1: Regular text scoring
          scoringResult = calculateScore(
            currentSubRound.targetPhrase,
            output,
            prompt
          );
        }
      }

      const attemptNumber = currentAttempts.length + 1;
      const result: AttemptResult = {
        attemptNumber,
        userPrompt: round.type === 'html-upload' ? 'HTML Upload' : prompt,
        generatedContent: output,
        score: scoringResult.score,
        reasoning: scoringResult.reasoning,
        flagged: scoringResult.flagged,
        flagReason: scoringResult.flagReason,
        keywordsMatched: scoringResult.keywordsMatched,
        keywordsTotal: scoringResult.keywordsTotal
      };
      
      setCurrentResult(result);
      setShowAttemptResult(true);

    } catch (err: any) {
      console.error("Generation failed", err);
      alert(err?.message || "Error during generation. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleTryAgain = () => {
    if (!currentResult || !canTryAgain) return;
    
    // Save current attempt to attempts list
    setCurrentAttempts([...currentAttempts, currentResult]);
    setCurrentResult(null);
    setShowAttemptResult(false);
    setPrompt('');
    setUploadedHtml(''); // Reset HTML upload for Round 3
  };

  const handleSubmitBest = () => {
    if (!currentResult) return;
    
    const allAttempts = [...currentAttempts, currentResult];
    const { attempt: bestAttempt, index: bestIndex } = getBestAttempt();
    
    const subRoundResult: SubRoundResult = {
      subRoundId: currentSubRound.id,
      userPrompt: bestAttempt.userPrompt,
      generatedContent: bestAttempt.generatedContent,
      score: bestAttempt.score,
      flagged: bestAttempt.flagged,
      flagReason: bestAttempt.flagReason,
      reasoning: bestAttempt.reasoning,
      attempts: allAttempts,
      bestAttemptIndex: bestIndex
    };
    
    setSubRoundResults([...subRoundResults, subRoundResult]);
    setCurrentAttempts([]);
    setCurrentResult(null);
    setShowAttemptResult(false);
    setPrompt('');
    
    if (currentSubRoundIndex < subRounds.length - 1) {
      setCurrentSubRoundIndex(prev => prev + 1);
    }
  };

  const handleFinishRound = () => {
    // Ensure current sub-round is submitted first
    if (currentResult && currentSubRoundIndex === subRounds.length - 1) {
      handleSubmitBest();
      return;
    }
    
    const totalScore = Math.round(
      (subRoundResults.reduce((sum, r) => sum + r.score, 0) / subRoundResults.length) * 20
    ); // Convert 0-5 to 0-100 scale for total
    
    const roundResult: RoundResult = {
      roundId: round.id,
      userPrompt: subRoundResults.map(r => r.userPrompt).join('\n---\n'),
      generatedContent: subRoundResults.map(r => r.generatedContent).join('\n---\n'),
      score: totalScore,
      reasoning: `Completed ${subRoundResults.length} sub-rounds with total score of ${totalScore}.`,
      subRoundResults: subRoundResults
    };
    
    onComplete(roundResult);
  };

  // Score display helper
  const renderScore = (score: number, large: boolean = false) => {
    const stars = [];
    for (let i = 0; i < 5; i++) {
      stars.push(
        <Star
          key={i}
          size={large ? 32 : 20}
          className={`${i < score ? 'text-yellow-400 fill-yellow-400' : 'text-white/20'}`}
        />
      );
    }
    return <div className="flex gap-1">{stars}</div>;
  };

  const getScoreColor = (score: number) => {
    if (score >= 4) return 'text-green-400';
    if (score >= 3) return 'text-yellow-400';
    if (score >= 2) return 'text-orange-400';
    return 'text-red-400';
  };

  // Final Results View
  if (isAllComplete) {
    const totalScore = Math.round(
      (subRoundResults.reduce((sum, r) => sum + r.score, 0) / subRoundResults.length) * 20
    );

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
            <p className="text-white/50 mt-2">Total score across {subRoundResults.length} challenges</p>
          </div>

          {/* Sub-round Results */}
          <div className="space-y-4">
            <h3 className="text-white/60 text-sm font-semibold uppercase tracking-wider">Results Breakdown</h3>
            {subRoundResults.map((result, index) => (
              <div key={result.subRoundId} className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-white/40">#{index + 1}</span>
                    <span className="text-white/80 font-medium">"{subRounds[index].targetPhrase}"</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {renderScore(result.score)}
                    <span className={`text-lg font-bold ${getScoreColor(result.score)}`}>
                      {result.score}/5
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-white/30 text-xs uppercase">Best Prompt (Attempt {result.bestAttemptIndex + 1}/{result.attempts.length})</span>
                    <p className="text-white/60 mt-1 font-mono text-xs">{result.userPrompt}</p>
                  </div>
                  <div>
                    <span className="text-white/30 text-xs uppercase">AI Output</span>
                    <p className="text-white/60 mt-1 font-mono text-xs line-clamp-3">{result.generatedContent}</p>
                  </div>
                </div>
                {result.reasoning && (
                  <p className="text-white/40 text-xs mt-2 italic">{result.reasoning}</p>
                )}
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

  // Attempt Result View
  if (showAttemptResult && currentResult) {
    const allAttempts = [...currentAttempts, currentResult];
    const { attempt: bestAttempt, index: bestIndex } = getBestAttempt();
    const isBestAttempt = bestIndex === allAttempts.length - 1;

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

          {/* Flagged Warning */}
          {currentResult.flagged && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-3">
              <AlertTriangle className="text-red-400 flex-shrink-0 mt-0.5" size={24} />
              <div>
                <h3 className="text-red-400 font-bold">Cheating Detected!</h3>
                <p className="text-red-300/70 text-sm mt-1">{currentResult.flagReason}</p>
                <p className="text-red-300/50 text-xs mt-2">Your score for this attempt is 0. Please try a different approach.</p>
              </div>
            </div>
          )}

          {/* Attempt Result Card */}
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-6 text-center">
            <h2 className="text-white/40 uppercase tracking-wider text-sm font-semibold mb-2">
              Attempt {currentResult.attemptNumber} of {MAX_ATTEMPTS}
            </h2>
            <div className="flex justify-center mb-2">
              {renderScore(currentResult.score, true)}
            </div>
            <div className={`text-4xl font-black ${getScoreColor(currentResult.score)}`}>
              {currentResult.score}/5
            </div>
            {currentResult.reasoning && (
              <p className="text-white/50 mt-3 text-sm">{currentResult.reasoning}</p>
            )}
          </div>

          {/* Best Score Indicator */}
          {allAttempts.length > 1 && (
            <div className={`rounded-xl p-4 ${isBestAttempt ? 'bg-green-500/10 border border-green-500/30' : 'bg-white/[0.03] border border-white/[0.08]'}`}>
              <div className="flex items-center justify-between">
                <span className="text-white/60 text-sm">Best Score So Far:</span>
                <div className="flex items-center gap-2">
                  {renderScore(bestAttempt.score)}
                  <span className={`font-bold ${getScoreColor(bestAttempt.score)}`}>
                    {bestAttempt.score}/5
                  </span>
                  {isBestAttempt && (
                    <span className="text-green-400 text-xs font-bold ml-2">NEW BEST!</span>
                  )}
                </div>
              </div>
            </div>
          )}

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
              <p className="text-white/80 font-mono text-sm line-clamp-4">{currentResult.generatedContent}</p>
            </div>
          </div>

          {/* Keywords Analysis */}
          {currentResult.keywordsTotal.length > 0 && (
            <div className="bg-white/[0.03] border border-white/[0.08] rounded-lg p-4">
              <h4 className="text-white/40 text-xs uppercase font-bold mb-2">Keywords Analysis</h4>
              <div className="flex flex-wrap gap-2">
                {currentResult.keywordsTotal.map((keyword, idx) => (
                  <span
                    key={idx}
                    className={`px-2 py-1 rounded text-xs font-mono ${
                      currentResult.keywordsMatched.includes(keyword)
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                        : 'bg-red-500/10 text-red-400/60 border border-red-500/20'
                    }`}
                  >
                    {keyword}
                  </span>
                ))}
              </div>
              <p className="text-white/40 text-xs mt-2">
                {currentResult.keywordsMatched.length}/{currentResult.keywordsTotal.length} keywords matched
              </p>
            </div>
          )}

          {/* Attempts History */}
          {currentAttempts.length > 0 && (
            <div className="bg-white/[0.03] border border-white/[0.08] rounded-lg p-4">
              <h4 className="text-white/40 text-xs uppercase font-bold mb-3">Previous Attempts</h4>
              <div className="space-y-2">
                {currentAttempts.map((attempt, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <span className="text-white/40">Attempt {attempt.attemptNumber}</span>
                    <div className="flex items-center gap-2">
                      {renderScore(attempt.score)}
                      <span className={`font-mono ${getScoreColor(attempt.score)}`}>{attempt.score}/5</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-white/[0.08] bg-black/30 backdrop-blur-sm space-y-3">
          {canTryAgain && !mustSubmit && (
            <button
              onClick={handleTryAgain}
              className="w-full bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.1] text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all"
            >
              <RotateCcw size={18} /> Try Again ({attemptsRemaining} {attemptsRemaining === 1 ? 'attempt' : 'attempts'} left)
            </button>
          )}
          <button
            onClick={handleSubmitBest}
            className="w-full bg-gradient-to-r from-indigo-500 to-rose-500 hover:from-indigo-400 hover:to-rose-400 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-transform active:scale-[0.98]"
          >
            {currentSubRoundIndex === subRounds.length - 1 
              ? 'Submit & See Final Results' 
              : `Submit Best Score & Continue (${currentSubRoundIndex + 2}/${subRounds.length})`
            } <ArrowRight size={20} />
          </button>
          {mustSubmit && currentResult?.score === 5 && (
            <p className="text-center text-green-400 text-sm">Perfect score! Moving to next challenge.</p>
          )}
          {mustSubmit && attemptsRemaining === 0 && currentResult?.score !== 5 && (
            <p className="text-center text-white/40 text-sm">No attempts remaining. Your best score will be submitted.</p>
          )}
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
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-orange-500/10 text-orange-400 border border-orange-500/20">
              Attempt {currentAttempts.length + 1}/{MAX_ATTEMPTS}
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

        {/* Cumulative Score Display */}
        <div className="mb-4 p-3 bg-gradient-to-r from-indigo-500/10 to-rose-500/10 border border-white/[0.08] rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-white/60 text-sm">Current Round Score:</span>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-white">{cumulativeScore}</span>
              <span className="text-white/40 text-sm">/ {subRounds.length * 5}</span>
            </div>
          </div>
          <div className="mt-1 text-xs text-white/40">
            Completed: {subRoundResults.length}/{subRounds.length} challenges
          </div>
        </div>

        <p className="text-white/40 mb-4">{round.description}</p>
        
        {isTimeUp && (
          <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
            <p className="text-red-400 font-semibold">⏰ Time's up! You can still submit your answer.</p>
          </div>
        )}

        {/* Previous Attempts Summary */}
        {currentAttempts.length > 0 && (
          <div className="mb-4 p-3 bg-white/[0.03] border border-white/[0.08] rounded-lg">
            <div className="flex items-center justify-between text-sm">
              <span className="text-white/40">Previous attempts:</span>
              <div className="flex items-center gap-3">
                {currentAttempts.map((attempt, idx) => (
                  <span key={idx} className={`font-mono ${getScoreColor(attempt.score)}`}>
                    #{idx + 1}: {attempt.score}/5
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {/* Target Display */}
        <div className="bg-black/40 border border-white/[0.08] rounded-lg p-4">
          {round.type === 'image' ? (
            <>
              <div className="text-xs text-white/40 uppercase font-bold mb-2 flex items-center gap-2">
                <Target size={14} /> Target ASCII Art
              </div>
              <div className="flex justify-center">
                <img 
                  src={currentSubRound.targetPhrase} 
                  alt="ASCII Art Target" 
                  className="max-w-full max-h-96 rounded border border-white/10"
                />
              </div>
              <p className="text-center text-white/40 text-xs mt-2">
                Make the AI generate ASCII art matching this image
              </p>
            </>
          ) : round.type === 'html-upload' ? (
            <>
              <div className="text-xs text-white/40 uppercase font-bold mb-2 flex items-center gap-2">
                <Target size={14} /> Challenge
              </div>
              <p className="text-xl text-white font-bold text-center py-4">
                {currentSubRound.targetPhrase}
              </p>
            </>
          ) : (
            <>
              <div className="text-xs text-white/40 uppercase font-bold mb-2 flex items-center gap-2">
                <Target size={14} /> Target Phrase
              </div>
              <p className="text-2xl text-white font-bold text-center py-4">
                "{currentSubRound.targetPhrase}"
              </p>
            </>
          )}
        </div>

        {/* Scoring Info */}
        <div className="mt-4 p-3 bg-indigo-500/5 border border-indigo-500/10 rounded-lg">
          <p className="text-indigo-300/70 text-xs">
            <strong>Scoring:</strong> 5 = exact match, 4 = all keywords, 3 = most keywords, 2 = some keywords, 1 = few keywords, 0 = no match or flagged.
            <br />
            <strong>⚠️ Warning:</strong> Using the target phrase directly in your prompt will result in a score of 0!
          </p>
        </div>
      </div>

      {/* Input Area */}
      <div className="flex-1 p-6 flex flex-col justify-end">
        <form onSubmit={handleSubmit} className="relative">
          {round.type === 'html-upload' ? (
            <>
              <div className="text-white/40 text-sm font-medium mb-2">
                Upload Your HTML File
              </div>
              <div className="relative group">
                <div className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl p-8 text-center">
                  <input
                    type="file"
                    accept=".html"
                    onChange={handleFileUpload}
                    disabled={isGenerating}
                    className="hidden"
                    id="html-upload"
                  />
                  <label 
                    htmlFor="html-upload" 
                    className="cursor-pointer flex flex-col items-center gap-4"
                  >
                    <div className="bg-indigo-500/10 p-4 rounded-full">
                      <svg className="w-12 h-12 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    </div>
                    <div className="text-white">
                      {uploadedHtml ? (
                        <span className="text-green-400 font-semibold">✓ HTML File Uploaded ({uploadedHtml.length} characters)</span>
                      ) : (
                        <span className="text-white/60">Click to upload HTML file</span>
                      )}
                    </div>
                    <div className="text-white/40 text-xs">
                      Upload your HTML replication of dtu.ac.in
                    </div>
                  </label>
                </div>
                <button
                  type="submit"
                  disabled={!uploadedHtml.trim() || isGenerating}
                  className="mt-4 w-full bg-gradient-to-r from-indigo-500 to-rose-500 hover:from-indigo-400 hover:to-rose-400 text-white py-4 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg shadow-indigo-500/25 font-bold flex items-center justify-center gap-2"
                >
                  <Send size={18} /> Submit HTML
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="text-white/40 text-sm font-medium mb-2">
                {round.type === 'image' 
                  ? 'Your Prompt (make the AI generate ASCII art matching the image)' 
                  : 'Your Prompt (make the AI say the target phrase without using it directly)'}
              </div>
              <div className="relative group">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  disabled={isGenerating}
                  className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl p-4 pr-16 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all h-32 resize-none font-mono text-sm placeholder-white/20 disabled:opacity-50"
                  placeholder={round.type === 'image' 
                    ? "Write a prompt to make the AI generate ASCII art..." 
                    : "Write a creative prompt to make the AI output the target phrase..."}
                />
                <button
                  type="submit"
                  disabled={!prompt.trim() || isGenerating}
                  className="absolute bottom-4 right-4 bg-gradient-to-r from-indigo-500 to-rose-500 hover:from-indigo-400 hover:to-rose-400 text-white p-2 rounded-lg disabled:opacity-0 disabled:pointer-events-none transition-all duration-300 shadow-lg shadow-indigo-500/25"
                >
                  <Send size={18} />
                </button>
              </div>
            </>
          )}
        </form>
      </div>

      {/* Loading Overlay */}
      {isGenerating && (
        <div className="absolute inset-0 bg-[#030303]/90 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="text-center space-y-4">
            <Loader2 className="animate-spin text-indigo-500 mx-auto" size={48} />
            <div className="text-xl font-bold text-white">
              Gemini is thinking...
            </div>
            <p className="text-white/40 text-sm">
              Generating response to your prompt.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubRoundGame;
