import React, { useState, useEffect } from 'react';
import { User, GameState, RoundResult, LeaderboardEntry } from './types';
import { ROUNDS } from './constants';
import { GeminiService } from './services/geminiService';
import Auth from './components/Auth';
import GameRound from './components/GameRound';
import LandingPage from './components/LandingPage';
import { Trophy, LogOut, LayoutGrid } from 'lucide-react';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [geminiService, setGeminiService] = useState<GeminiService | null>(null);
  const [view, setView] = useState<'landing' | 'auth' | 'dashboard' | 'game'>('landing');
  
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

  // Save gameState to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('gameState', JSON.stringify(gameState));
  }, [gameState]);

  const handleLogin = (user: User, service: GeminiService) => {
    setUser(user);
    setGeminiService(service);
    setView('dashboard');
    
    // Save user and API key to sessionStorage for page refresh recovery
    sessionStorage.setItem('user', JSON.stringify(user));
    sessionStorage.setItem('apiKey', (service as any).apiKey || '');
  };

  const startRound = () => {
    setView('game');
  };

  const handleRoundComplete = (result: RoundResult) => {
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

    setView('dashboard');
  };

  const handleSignOut = () => {
    // Clear auth and stored state so the login screen shows again
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('apiKey');
    localStorage.removeItem('gameState');
    setUser(null);
    setGeminiService(null);
    setGameState(initialGameState);
    setView('landing');
    // Hard reload to guarantee a clean slate
    window.location.reload();
  };

  // Landing Page
  if (view === 'landing' && !user) {
    return <LandingPage onGetStarted={() => setView('auth')} />;
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

                    {/* Score Summary */}
                    <div>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-yellow-500/10 rounded-lg">
                                <Trophy className="text-yellow-500" size={24} />
                            </div>
                            <h3 className="text-2xl font-bold text-white">Your Progress</h3>
                        </div>
                        
                        <div className="bg-white/[0.02] backdrop-blur-sm border border-white/[0.08] rounded-2xl overflow-hidden shadow-2xl p-8">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-white/[0.03] rounded-xl p-6 border border-white/[0.08] text-center">
                                    <div className="text-4xl font-bold text-white mb-2">{gameState.totalScore}</div>
                                    <div className="text-sm text-white/40 uppercase tracking-wide">Total Score</div>
                                </div>
                                <div className="bg-white/[0.03] rounded-xl p-6 border border-white/[0.08] text-center">
                                    <div className="text-4xl font-bold text-indigo-400 mb-2">{gameState.completedRounds.length}/{ROUNDS.length}</div>
                                    <div className="text-sm text-white/40 uppercase tracking-wide">Rounds Completed</div>
                                </div>
                                <div className="bg-white/[0.03] rounded-xl p-6 border border-white/[0.08] text-center">
                                    <div className="text-4xl font-bold text-green-400 mb-2">
                                        {gameState.completedRounds.length > 0 
                                            ? Math.round(gameState.totalScore / gameState.completedRounds.length) 
                                            : 0}
                                    </div>
                                    <div className="text-sm text-white/40 uppercase tracking-wide">Avg Score/Round</div>
                                </div>
                            </div>
                            
                            {isGameComplete && (
                                <div className="mt-8 text-center p-6 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-xl border border-yellow-500/20">
                                    <Trophy className="mx-auto text-yellow-500 mb-3" size={48} />
                                    <h4 className="text-xl font-bold text-white mb-2">🎉 Challenge Complete!</h4>
                                    <p className="text-white/60">You've conquered all rounds with a total score of <span className="text-yellow-400 font-bold">{gameState.totalScore}</span></p>
                                </div>
                            )}
                        </div>
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