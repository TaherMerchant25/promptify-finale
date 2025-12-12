import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://wdbxvhjibcmwgpggiwgw.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndkYnh2aGppYmNtd2dwZ2dpd2d3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzMjc5NzMsImV4cCI6MjA3NjkwMzk3M30.TJ8Sh7eYOOsvtpiikPnHIi-JjUULJWw_3cYbUziWbWc';

export const supabase = createClient(supabaseUrl, supabaseKey);

// Types for round data storage
export interface SubRoundData {
  subRoundId: string;
  targetPhrase: string;
  prompt: string;
  output: string;
  score: number;
  timeTaken: number; // in milliseconds
}

export interface RoundData {
  prompt: string;
  output: string;
  score: number;
  timeTaken: number;
  targetContent?: string;
}

export interface GameSession {
  id?: string;
  player_name: string;
  avatar_url: string;
  total_score: number;
  rounds_completed: number;
  current_round: number;
  round1_score: number | null;
  round2_score: number | null;
  round3_score: number | null;
  round1_time: number | null;
  round2_time: number | null;
  round3_time: number | null;
  total_time: number | null;
  round1_data: SubRoundData[] | null;
  round2_data: RoundData[] | null;
  round3_data: RoundData[] | null;
  status: string;
  created_at?: string;
  updated_at?: string;
}

export const leaderboardService = {
  // Create a new game session
  async createSession(playerName: string, avatarUrl: string): Promise<GameSession | null> {
    const { data, error } = await supabase
      .from('game_sessions')
      .insert({
        player_name: playerName,
        avatar_url: avatarUrl,
        total_score: 0,
        rounds_completed: 0,
        current_round: 1,
        status: 'Playing',
        round1_data: [],
        round2_data: [],
        round3_data: [],
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating session:', error);
      return null;
    }
    return data;
  },

  // Update session with round results
  async updateSession(
    sessionId: string, 
    updates: Partial<GameSession>
  ): Promise<GameSession | null> {
    const { data, error } = await supabase
      .from('game_sessions')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', sessionId)
      .select()
      .single();

    if (error) {
      console.error('Error updating session:', error);
      return null;
    }
    return data;
  },

  // Save Round 1 data (sub-rounds with prompts and outputs)
  async saveRound1Data(
    sessionId: string,
    subRoundsData: SubRoundData[],
    totalScore: number,
    totalTime: number
  ): Promise<boolean> {
    const { error } = await supabase
      .from('game_sessions')
      .update({
        round1_data: subRoundsData,
        round1_score: totalScore,
        round1_time: totalTime,
        total_score: totalScore,
        rounds_completed: 1,
        current_round: 2,
        status: 'Round 2',
      })
      .eq('id', sessionId);

    if (error) {
      console.error('Error saving round 1 data:', error);
      return false;
    }
    return true;
  },

  // Save Round 2 data
  async saveRound2Data(
    sessionId: string,
    roundData: RoundData[],
    roundScore: number,
    roundTime: number,
    previousTotalScore: number
  ): Promise<boolean> {
    const newTotalScore = previousTotalScore + roundScore;
    const { error } = await supabase
      .from('game_sessions')
      .update({
        round2_data: roundData,
        round2_score: roundScore,
        round2_time: roundTime,
        total_score: newTotalScore,
        rounds_completed: 2,
        current_round: 3,
        status: 'Round 3',
      })
      .eq('id', sessionId);

    if (error) {
      console.error('Error saving round 2 data:', error);
      return false;
    }
    return true;
  },

  // Save Round 3 data and mark as finished
  async saveRound3Data(
    sessionId: string,
    roundData: RoundData[],
    roundScore: number,
    roundTime: number,
    previousTotalScore: number,
    totalGameTime: number
  ): Promise<boolean> {
    const newTotalScore = previousTotalScore + roundScore;
    const { error } = await supabase
      .from('game_sessions')
      .update({
        round3_data: roundData,
        round3_score: roundScore,
        round3_time: roundTime,
        total_score: newTotalScore,
        total_time: totalGameTime,
        rounds_completed: 3,
        current_round: 3,
        status: 'Finished',
      })
      .eq('id', sessionId);

    if (error) {
      console.error('Error saving round 3 data:', error);
      return false;
    }
    return true;
  },

  // Get leaderboard (top players by score)
  async getLeaderboard(limit: number = 50): Promise<GameSession[]> {
    const { data, error } = await supabase
      .from('game_sessions')
      .select('*')
      .order('total_score', { ascending: false })
      .order('total_time', { ascending: true, nullsFirst: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching leaderboard:', error);
      return [];
    }
    return data || [];
  },

  // Subscribe to real-time leaderboard updates
  subscribeToLeaderboard(callback: (sessions: GameSession[]) => void) {
    // Initial fetch
    this.getLeaderboard().then(callback);

    // Subscribe to changes
    const channel = supabase
      .channel('leaderboard-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'game_sessions',
        },
        () => {
          // Refetch leaderboard on any change
          this.getLeaderboard().then(callback);
        }
      )
      .subscribe();

    // Return unsubscribe function
    return () => {
      supabase.removeChannel(channel);
    };
  },

  // Get session by ID
  async getSession(sessionId: string): Promise<GameSession | null> {
    const { data, error } = await supabase
      .from('game_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (error) {
      console.error('Error fetching session:', error);
      return null;
    }
    return data;
  },

  // Get all sessions for a player (history)
  async getPlayerHistory(playerName: string): Promise<GameSession[]> {
    const { data, error } = await supabase
      .from('game_sessions')
      .select('*')
      .eq('player_name', playerName)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching player history:', error);
      return [];
    }
    return data || [];
  },
};
