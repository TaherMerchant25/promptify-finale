import React, { useState, useEffect, useRef } from 'react';
import { User, GameState, RoundResult } from './types';
import { ROUNDS } from './constants';
import { GeminiService } from './services/geminiService';
import { leaderboardService, GameSession, SubRoundData, RoundData as SupabaseRoundData } from './services/supabaseService';
import Auth from './components/Auth';
import GameRound from './components/GameRound';
import LandingPage from './components/LandingPage';
import Leaderboard from './components/Leaderboard';
import HowToPlay from './components/HowToPlay';
import { Trophy, LogOut, LayoutGrid, Activity, Wifi, RefreshCw } from 'lucide-react';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [geminiService, setGeminiService] = useState<GeminiService | null>(null);
  const [view, setView] = useState<'landing' | 'auth' | 'dashboard' | 'game' | 'leaderboard' | 'how-to-play'>('landing');
  
  const initialGameState: GameState = {
    currentRoundId: 1,
    completedRounds: [],
    results: {},
    totalScore: 0,
  };

  const [gameState, setGameState] = useState<GameState>(() => {
    const saved = localStorage.getItem('gameState');
    return saved ? JSON.parse(saved) : initialGameState;
  });

  // Supabase leaderboard state
  const [leaderboard, setLeaderboard] = useState<GameSession[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(() => {
    return sessionStorage.getItem('sessionId');
  });
  const [isConnected, setIsConnected] = useState(false);
  
  // Track game start time for total time calculation
  const gameStartTime = useRef<number>(Date.now());
  const roundStartTime = useRef<number>(Date.now());

  // Restore user and service from sessionStorage
  useEffect(() => {
    const savedUser = sessionStorage.getItem('user');
    const savedApiKey = sessionStorage.getItem('apiKey');
    
    if (savedUser && savedApiKey) {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      setGeminiService(new GeminiService(savedApiKey));
      setView('dashboard');
    }
  }, []);

  // Subscribe to real-time leaderboard updates
  useEffect(() => {
    const unsubscribe = leaderboardService.subscribeToLeaderboard((sessions) => {
      setLeaderboard(sessions);
      setIsConnected(true);
    });

    return () => unsubscribe();
  }, []);

  // Save gameState to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('gameState', JSON.stringify(gameState));
  }, [gameState]);

  const handleLogin = async (user: User, service: GeminiService) => {
    setUser(user);
    setGeminiService(service);
    setView('dashboard');
    
    // Save user and API key to sessionStorage for page refresh recovery
    sessionStorage.setItem('user', JSON.stringify(user));
    sessionStorage.setItem('apiKey', (service as any).apiKey || '');

    // Create a new session in Supabase (only if no existing session)
    if (!sessionId) {
      const apiKey = (service as any).apiKey || '';
      const session = await leaderboardService.createSession(user.username, user.avatarUrl, apiKey);
      if (session?.id) {
        setSessionId(session.id);
        sessionStorage.setItem('sessionId', session.id);
      }
    }
  };

  const startRound = async () => {
    setView('game');
    roundStartTime.current = Date.now(); // Track when round starts
    
    // Update status in Supabase
    if (sessionId) {
      await leaderboardService.updateSession(sessionId, {
        current_round: gameState.currentRoundId,
        status: `Round ${gameState.currentRoundId}`,
      });
    }
  };

  const handleRoundComplete = async (result: RoundResult) => {
    const roundTime = Date.now() - roundStartTime.current;
    const totalGameTime = Date.now() - gameStartTime.current;
    
    const newTotal = gameState.totalScore + result.score;
    const completed = [...gameState.completedRounds, result.roundId];
    const nextRoundId = result.roundId + 1;
    const isFinished = completed.length === ROUNDS.length;

    setGameState(prev => ({
      ...prev,
      totalScore: newTotal,
      completedRounds: completed,
      currentRoundId: nextRoundId,
      results: { ...prev.results, [result.roundId]: result }
    }));

    // Save detailed round data to Supabase
    if (sessionId) {
      if (result.roundId === 1 && result.subRoundResults) {
        // Round 1 has sub-rounds with multiple attempts
        const subRoundsData: SubRoundData[] = result.subRoundResults.map((sr, idx) => ({
          subRoundId: sr.subRoundId,
          targetPhrase: ROUNDS[0].subRounds?.[idx]?.targetPhrase || '',
          prompt: sr.userPrompt,
          output: sr.generatedContent,
          score: sr.score, // Now 0-5 scale
          timeTaken: Math.round(roundTime / result.subRoundResults!.length),
          attempts: sr.attempts?.map(a => ({
            attemptNumber: a.attemptNumber,
            prompt: a.userPrompt,
            output: a.generatedContent,
            score: a.score,
            flagged: a.flagged,
            flagReason: a.flagReason,
            keywordsMatched: a.keywordsMatched,
          })),
          bestAttemptIndex: sr.bestAttemptIndex,
        }));
        
        await leaderboardService.saveRound1Data(sessionId, subRoundsData, result.score, roundTime);
      } else if (result.roundId === 2 && result.subRoundResults) {
        // Round 2: Submit all attempts for manual review
        if (user) {
          for (const sr of result.subRoundResults) {
            // Submit all attempts for this sub-round
            if (sr.attempts) {
              for (const attempt of sr.attempts) {
                await leaderboardService.submitForManualReview(
                  sessionId,
                  user.username,
                  2,
                  sr.subRoundId,
                  attempt.userPrompt,
                  attempt.generatedContent,
                  ROUNDS[1].subRounds?.find(s => s.id === sr.subRoundId)?.targetPhrase || '',
                  attempt.attemptNumber
                );
              }
            }
          }
        }
        
        // Save basic round data (score will be 0 until manually reviewed)
        const subRoundsData: SubRoundData[] = result.subRoundResults.map((sr, idx) => ({
          subRoundId: sr.subRoundId,
          targetPhrase: ROUNDS[1].subRounds?.[idx]?.targetPhrase || '',
          prompt: sr.userPrompt,
          output: sr.generatedContent,
          score: 0, // Manual scoring
          timeTaken: Math.round(roundTime / result.subRoundResults!.length),
          attempts: sr.attempts?.map(a => ({
            attemptNumber: a.attemptNumber,
            prompt: a.userPrompt,
            output: a.generatedContent,
            score: 0, // Manual scoring
            flagged: a.flagged,
            flagReason: a.flagReason,
            keywordsMatched: a.keywordsMatched,
          })),
          bestAttemptIndex: sr.bestAttemptIndex,
        }));
        
        await leaderboardService.saveRound2Data(
          sessionId, 
          subRoundsData, 
          0, // Score will be added manually
          roundTime, 
          gameState.totalScore
        );
      } else if (result.roundId === 3 && result.subRoundResults) {
        // Round 3: HTML upload - submit for manual review
        const htmlContent = result.subRoundResults[0]?.generatedContent || '';
        let htmlFileUrl = '';
        
        // Upload HTML file to storage
        if (htmlContent && user) {
          const url = await leaderboardService.uploadHtmlFile(user.username, htmlContent, sessionId);
          htmlFileUrl = url || '';
          
          // Submit all attempts for manual review
          if (result.subRoundResults[0].attempts) {
            for (const attempt of result.subRoundResults[0].attempts) {
              await leaderboardService.submitForManualReview(
                sessionId,
                user.username,
                3,
                result.subRoundResults[0].subRoundId,
                attempt.userPrompt,
                'HTML file uploaded',
                ROUNDS[2].subRounds?.[0]?.targetPhrase || '',
                attempt.attemptNumber,
                htmlFileUrl
              );
            }
          }
        }
        
        const subRoundsData: SubRoundData[] = result.subRoundResults.map((sr, idx) => ({
          subRoundId: sr.subRoundId,
          targetPhrase: ROUNDS[2].subRounds?.[idx]?.targetPhrase || '',
          prompt: sr.userPrompt,
          output: 'HTML file uploaded', // Don't store full HTML in DB
          score: 0, // Manual scoring
          timeTaken: roundTime,
          attempts: sr.attempts?.map(a => ({
            attemptNumber: a.attemptNumber,
            prompt: a.userPrompt,
            output: 'HTML file',
            score: 0, // Manual scoring
            flagged: a.flagged,
            flagReason: a.flagReason,
            keywordsMatched: a.keywordsMatched,
          })),
          bestAttemptIndex: sr.bestAttemptIndex,
        }));
        
        await leaderboardService.saveRound3Data(
          sessionId, 
          subRoundsData, 
          0, // Score will be added manually
          roundTime, 
          gameState.totalScore,
          totalGameTime
        );
      }
    }

    setView('dashboard');
  };

  const handleSignOut = () => {
    // Clear auth and stored state so the login screen shows again
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('apiKey');
    sessionStorage.removeItem('sessionId');
    localStorage.removeItem('gameState');
    setUser(null);
    setGeminiService(null);
    setSessionId(null);
    setGameState(initialGameState);
    setView('landing');
    // Hard reload to guarantee a clean slate
    window.location.reload();
  };

  const refreshLeaderboard = async () => {
    const sessions = await leaderboardService.getLeaderboard();
    setLeaderboard(sessions);
  };

  // Landing Page
  if (view === 'landing' && !user) {
    return <LandingPage 
      onGetStarted={() => setView('auth')} 
      onNavigate={(page) => setView(page)}
    />;
  }

  // How to Play Page
  if (view === 'how-to-play') {
    return <HowToPlay onBack={() => setView('landing')} />;
  }

  // Leaderboard Page
  if (view === 'leaderboard') {
    return <Leaderboard onBack={() => setView('landing')} />;
  }

  // Auth Guard
  if ((!user || !geminiService) && view === 'auth') {
    return <Auth onLogin={handleLogin} onBack={() => setView('landing')} />;
  }

  // If somehow in auth view but user exists, redirect to dashboard
  if (user && geminiService && (view === 'landing' || view === 'auth')) {
    setView('dashboard');
    return null;
  }

  const currentRoundData = ROUNDS.find(r => r.id === gameState.currentRoundId);
  const isGameComplete = gameState.completedRounds.length === ROUNDS.length;

  return (
    <div className="min-h-screen bg-[#030303] text-slate-200 flex flex-col md:flex-row font-sans">
      
      {/* Sidebar / Mobile Header */}
      <div className="w-full md:w-80 bg-black/40 backdrop-blur-md border-r border-white/[0.08] flex flex-col">
        <div className="p-8 border-b border-white/[0.05] flex items-center gap-4">
           <img 
             src="https://avatars.githubusercontent.com/u/53648600?s=200&v=4" 
             alt="ACM DTU" 
             className="w-12 h-12 rounded-xl shadow-lg shadow-indigo-500/20" 
           />
           <div>
             <h1 className="font-bold text-xl text-white tracking-tight">Promptify</h1>
             <p className="text-xs text-slate-500 font-medium">v1.0.0</p>
           </div>
        </div>

        {/* User Stats */}
        <div className="p-6">
            <div className="flex items-center gap-4 mb-8 bg-white/[0.03] p-4 rounded-2xl border border-white/[0.08]">
                <img src={user.avatarUrl} alt="Avatar" className="w-12 h-12 rounded-full border-2 border-white/[0.1]" />
                <div>
                    <div className="font-bold text-white text-lg">{user.username}</div>
                    <div className="text-xs font-mono text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20 inline-block mt-1">
                        SCORE: {gameState.totalScore}
                    </div>
                </div>
            </div>
            
            <div className="space-y-3">
                <div className="text-xs font-bold text-white/40 uppercase tracking-widest mb-4 pl-1">Campaign</div>
                {ROUNDS.map(round => {
                    const isCompleted = gameState.completedRounds.includes(round.id);
                    const isCurrent = round.id === gameState.currentRoundId;
                    const result = gameState.results[round.id];

                    return (
                        <div key={round.id} className={`p-4 rounded-xl border transition-all ${
                            isCurrent ? 'border-indigo-500/30 bg-indigo-500/10 shadow-[0_0_20px_-5px_rgba(99,102,241,0.3)]' : 
                            isCompleted ? 'border-white/[0.05] bg-white/[0.02]' : 'border-transparent opacity-40'
                        }`}>
                            <div className="flex justify-between items-center mb-1">
                                <span className={`text-sm font-bold ${isCurrent ? 'text-white' : 'text-slate-400'}`}>Round {round.id}</span>
                                {isCompleted && (
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${result.score > 75 ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                                        {result.score}
                                    </span>
                                )}
                            </div>
                            <div className="text-xs text-slate-500 truncate font-medium">{round.title}</div>
                        </div>
                    );
                })}
            </div>
        </div>
        
        <div className="mt-auto p-6 border-t border-white/[0.05]">
             <button onClick={handleSignOut} className="flex items-center gap-3 text-white/40 hover:text-white transition-colors text-sm font-medium w-full px-2 py-2 rounded-lg hover:bg-white/[0.05]">
                 <LogOut size={16} /> Sign Out
             </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 relative flex flex-col overflow-hidden">
        
        {view === 'dashboard' && (
            <div className="flex-1 p-6 md:p-12 overflow-y-auto">
                <div className="max-w-5xl mx-auto space-y-12">
                    
                    {/* Hero Action */}
                    <div className="bg-gradient-to-br from-white/[0.03] to-black border border-white/[0.08] rounded-3xl p-10 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none transition-all group-hover:bg-indigo-500/20"></div>
                        
                        <h2 className="text-4xl font-extrabold mb-4 text-white relative z-10">
                            {isGameComplete ? "Challenge Complete!" : `Ready for Round ${gameState.currentRoundId}?`}
                        </h2>
                        <p className="text-white/40 max-w-lg mb-8 text-lg relative z-10 leading-relaxed">
                            {isGameComplete 
                                ? `You finished with a total score of ${gameState.totalScore}. Check your rank on the leaderboard below.`
                                : "Analyze the target output. Craft the perfect prompt. One attempt per round. Precision is key."
                            }
                        </p>
                        
                        {!isGameComplete ? (
                            <button 
                                onClick={startRound}
                                className="px-8 py-4 bg-white text-slate-950 font-bold rounded-xl hover:bg-blue-50 transition-all shadow-xl shadow-white/5 flex items-center gap-3 relative z-10 group/btn"
                            >
                                <LayoutGrid size={20} className="group-hover/btn:rotate-180 transition-transform duration-500" /> 
                                Enter Round {gameState.currentRoundId}
                            </button>
                        ) : (
                             <div className="inline-flex items-center gap-2 px-6 py-3 bg-green-500/10 text-green-400 rounded-full border border-green-500/20 font-semibold relative z-10">
                                 <Trophy size={18} /> All Rounds Finished
                             </div>
                        )}
                    </div>

                    {/* Global Leaderboard */}
                    <div>
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-yellow-500/10 rounded-lg">
                                    <Trophy className="text-yellow-500" size={24} />
                                </div>
                                <h3 className="text-2xl font-bold text-white">Global Leaderboard</h3>
                            </div>
                            
                            <div className="flex items-center gap-3">
                                <button 
                                    onClick={refreshLeaderboard}
                                    className="p-2 hover:bg-white/[0.05] rounded-lg transition-colors"
                                    title="Refresh leaderboard"
                                >
                                    <RefreshCw size={18} className="text-white/40 hover:text-white" />
                                </button>
                                {isConnected ? (
                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-green-900/30 border border-green-500/30 rounded-full">
                                        <span className="relative flex h-2.5 w-2.5">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                                        </span>
                                        <span className="text-xs font-bold text-green-400 uppercase tracking-wide">Live</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-900/30 border border-yellow-500/30 rounded-full">
                                        <Activity size={12} className="text-yellow-400 animate-pulse" />
                                        <span className="text-xs font-bold text-yellow-400 uppercase tracking-wide">Connecting...</span>
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        {leaderboard.length === 0 ? (
                            <div className="p-12 text-center bg-white/[0.02] rounded-2xl border border-white/[0.08] border-dashed">
                                <Activity className="mx-auto text-white/30 mb-3" size={32} />
                                <p className="text-white/40">Loading leaderboard...</p>
                                <p className="text-white/20 text-xs mt-2">Be the first to play and get on the board!</p>
                            </div>
                        ) : (
                            <div className="bg-white/[0.02] backdrop-blur-sm border border-white/[0.08] rounded-2xl overflow-hidden shadow-2xl">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-black/30 text-white/40 text-xs uppercase font-bold tracking-wider">
                                        <tr>
                                            <th className="p-5 w-20 text-center">Rank</th>
                                            <th className="p-5">Player</th>
                                            <th className="p-5">Status</th>
                                            <th className="p-5 text-right">Score</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/[0.05]">
                                        {leaderboard.map((entry, index) => (
                                            <tr key={entry.id} className={`group hover:bg-white/[0.03] transition-colors ${entry.id === sessionId ? 'bg-indigo-500/5' : ''}`}>
                                                <td className="p-5 text-center font-mono text-white/40 group-hover:text-white font-medium">
                                                    #{index + 1}
                                                </td>
                                                <td className="p-5">
                                                    <div className="flex items-center gap-4">
                                                        <img src={entry.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${entry.player_name}`} alt="" className="w-10 h-10 rounded-full bg-white/[0.05] shadow-md border border-white/[0.1]" />
                                                        <div className="flex flex-col">
                                                            <span className={`font-semibold ${entry.id === sessionId ? 'text-indigo-400' : 'text-white/80'}`}>
                                                                {entry.player_name} {entry.id === sessionId && '(You)'}
                                                            </span>
                                                            <span className="text-[10px] text-white/30 font-mono">
                                                                {entry.rounds_completed}/{ROUNDS.length} rounds
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-5">
                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium border ${
                                                        entry.status === 'Finished' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                                        entry.status?.includes('Round') ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' :
                                                        'bg-white/[0.03] text-white/40 border-white/[0.08]'
                                                    }`}>
                                                        {entry.status === 'Playing' && <Activity size={10} className="animate-pulse" />}
                                                        {entry.status || 'Playing'}
                                                    </span>
                                                </td>
                                                <td className="p-5 text-right font-mono font-bold text-white/90 text-lg">
                                                    {entry.total_score}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                </div>
            </div>
        )}

        {view === 'game' && currentRoundData && (
            <div className="flex-1 relative">
                <GameRound 
                    round={currentRoundData} 
                    service={geminiService} 
                    onComplete={handleRoundComplete}
                    isLastRound={gameState.currentRoundId === ROUNDS.length}
                />
            </div>
        )}

      </div>
    </div>
  );
};

export default App;