-- Supabase SQL Schema for Promptify Leaderboard
-- Run this in your Supabase SQL Editor

-- Drop existing table if you want to start fresh (CAREFUL - this deletes data!)
-- DROP TABLE IF EXISTS game_sessions;

-- Create the game_sessions table for leaderboard
CREATE TABLE IF NOT EXISTS game_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Player Information
  player_name VARCHAR(255) NOT NULL,
  avatar_url TEXT,
  
  -- Score tracking
  total_score INTEGER DEFAULT 0,
  rounds_completed INTEGER DEFAULT 0,
  current_round INTEGER DEFAULT 1,
  
  -- Individual round scores
  round1_score INTEGER,
  round2_score INTEGER,
  round3_score INTEGER,
  
  -- Status for display
  status VARCHAR(50) DEFAULT 'Playing',
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_game_sessions_total_score ON game_sessions(total_score DESC);
CREATE INDEX IF NOT EXISTS idx_game_sessions_updated_at ON game_sessions(updated_at DESC);

-- Enable Row Level Security
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read (for leaderboard)
CREATE POLICY "Allow public read" ON game_sessions
  FOR SELECT TO anon, authenticated
  USING (true);

-- Allow anyone to insert (create new sessions)
CREATE POLICY "Allow public insert" ON game_sessions
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- Allow anyone to update (update their session)
CREATE POLICY "Allow public update" ON game_sessions
  FOR UPDATE TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Enable Realtime for this table (for live leaderboard updates)
ALTER PUBLICATION supabase_realtime ADD TABLE game_sessions;

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_game_sessions_updated_at ON game_sessions;
CREATE TRIGGER update_game_sessions_updated_at
  BEFORE UPDATE ON game_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
