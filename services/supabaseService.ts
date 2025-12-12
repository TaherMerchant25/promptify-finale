import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://wdbxvhjibcmwgpggiwgw.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndkYnh2aGppYmNtd2dwZ2dpd2d3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzMjc5NzMsImV4cCI6MjA3NjkwMzk3M30.TJ8Sh7eYOOsvtpiikPnHIi-JjUULJWw_3cYbUziWbWc';

export const supabase = createClient(supabaseUrl, supabaseKey);

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

  // Get leaderboard (top players by score)
  async getLeaderboard(limit: number = 50): Promise<GameSession[]> {
    const { data, error } = await supabase
      .from('game_sessions')
      .select('*')
      .order('total_score', { ascending: false })
      .order('updated_at', { ascending: true })
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
};
