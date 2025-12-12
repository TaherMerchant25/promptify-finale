import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Trophy, Medal, Star, Clock, User, TrendingUp, Crown, Award } from 'lucide-react';
import { leaderboardService, GameSession } from '../services/supabaseService';

interface LeaderboardProps {
  onBack?: () => void;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ onBack }) => {
  const [leaderboard, setLeaderboard] = useState<GameSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'today' | 'week'>('all');

  useEffect(() => {
    loadLeaderboard();
    
    // Subscribe to real-time updates
    const unsubscribe = leaderboardService.subscribeToLeaderboard((sessions) => {
      setLeaderboard(sessions);
      setLoading(false);
    });

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  const loadLeaderboard = async () => {
    setLoading(true);
    const data = await leaderboardService.getLeaderboard();
    setLeaderboard(data);
    setLoading(false);
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="text-yellow-400" size={24} />;
    if (rank === 2) return <Award className="text-gray-300" size={22} />;
    if (rank === 3) return <Award className="text-amber-600" size={20} />;
    return <span className="text-white/40 text-lg font-bold">#{rank}</span>;
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'from-yellow-500/20 to-yellow-600/20 border-yellow-500/30';
    if (rank === 2) return 'from-gray-400/20 to-gray-500/20 border-gray-400/30';
    if (rank === 3) return 'from-amber-600/20 to-amber-700/20 border-amber-600/30';
    return 'from-white/[0.03] to-white/[0.03] border-white/[0.08]';
  };

  const formatTime = (ms: number | null) => {
    if (!ms) return '--:--';
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

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
              <Trophy className="text-yellow-400" size={48} />
            </div>
            <h1 className="text-5xl font-black mb-3 bg-gradient-to-r from-indigo-400 to-rose-400 bg-clip-text text-transparent">
              Leaderboard
            </h1>
            <p className="text-white/60 text-lg max-w-2xl mx-auto">
              Top players ranked by their prompt engineering skills
            </p>
          </motion.div>

          {/* Filter Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex justify-center gap-3 mt-8"
          >
            {(['all', 'today', 'week'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-6 py-2 rounded-full font-semibold text-sm transition-all ${
                  filter === f
                    ? 'bg-gradient-to-r from-indigo-500 to-rose-500 text-white'
                    : 'bg-white/[0.05] text-white/60 hover:text-white hover:bg-white/[0.1]'
                }`}
              >
                {f === 'all' ? 'All Time' : f === 'today' ? 'Today' : 'This Week'}
              </button>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Leaderboard Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent"></div>
            <p className="text-white/40 mt-4">Loading leaderboard...</p>
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="text-center py-20">
            <Trophy className="mx-auto text-white/20 mb-4" size={64} />
            <p className="text-white/40 text-lg">No players yet. Be the first to play!</p>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="space-y-3"
          >
            {leaderboard.map((player, index) => {
              const rank = index + 1;
              return (
                <motion.div
                  key={player.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`bg-gradient-to-r ${getRankColor(rank)} backdrop-blur-sm border rounded-xl p-5 hover:scale-[1.02] transition-transform`}
                >
                  <div className="flex items-center gap-4">
                    {/* Rank */}
                    <div className="w-12 h-12 flex items-center justify-center flex-shrink-0">
                      {getRankIcon(rank)}
                    </div>

                    {/* Avatar */}
                    <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 border-2 border-white/10">
                      <img 
                        src={player.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${player.player_name}`} 
                        alt={player.player_name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Player Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-white text-lg truncate">{player.player_name}</h3>
                      <div className="flex items-center gap-4 text-sm text-white/60 mt-1">
                        <span className="flex items-center gap-1">
                          <Star size={14} className="text-yellow-400" />
                          Rounds: {player.rounds_completed}/3
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={14} />
                          {formatTime(player.total_time)}
                        </span>
                      </div>
                    </div>

                    {/* Score */}
                    <div className="text-right flex-shrink-0">
                      <div className={`text-3xl font-black ${
                        rank === 1 ? 'text-yellow-400' :
                        rank === 2 ? 'text-gray-300' :
                        rank === 3 ? 'text-amber-600' :
                        'text-white'
                      }`}>
                        {player.total_score}
                      </div>
                      <div className="text-xs text-white/40 uppercase font-semibold">Points</div>
                    </div>
                  </div>

                  {/* Round Scores */}
                  {player.rounds_completed > 0 && (
                    <div className="flex gap-2 mt-4 pt-4 border-t border-white/10">
                      {[1, 2, 3].map((roundNum) => {
                        const score = player[`round${roundNum}_score` as keyof GameSession] as number | null;
                        const time = player[`round${roundNum}_time` as keyof GameSession] as number | null;
                        return (
                          <div key={roundNum} className="flex-1 bg-black/30 rounded-lg p-2 text-center">
                            <div className="text-xs text-white/40 mb-1">R{roundNum}</div>
                            {score !== null ? (
                              <>
                                <div className="text-lg font-bold text-white">{score}</div>
                                <div className="text-xs text-white/40">{formatTime(time)}</div>
                              </>
                            ) : (
                              <div className="text-white/20 text-sm">--</div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {/* Back Button */}
        {onBack && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-center mt-12"
          >
            <button
              onClick={onBack}
              className="px-8 py-3 bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.1] text-white font-semibold rounded-xl transition-all"
            >
              Back to Home
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;
