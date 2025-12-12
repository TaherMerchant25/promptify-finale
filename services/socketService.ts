import { io, Socket } from "socket.io-client";
import { LeaderboardEntry, User } from "../types";
import { BACKEND_URL } from "../config";

// Backend server URL - configurable via environment variable
const SERVER_URL = BACKEND_URL;

// API base URL for REST endpoints
const API_URL = `${SERVER_URL}/api`;

export class SocketService {
  private socket: Socket | null = null;
  private sessionId: string | null = null;

  connect(user: User, onLeaderboardUpdate: (data: LeaderboardEntry[]) => void, apiKey?: string) {
    if (this.socket?.connected) return;

    this.socket = io(SERVER_URL, {
      transports: ['websocket', 'polling'],
    });

    this.socket.on("connect", () => {
      console.log("Connected to leaderboard server", this.socket?.id);
      
      // Join game immediately upon connection
      this.socket?.emit("join", {
        username: user.username,
        avatarUrl: user.avatarUrl,
        apiKey: apiKey // Send API key to create session
      });
    });

    this.socket.on("session_created", (data: { sessionId: string }) => {
      this.sessionId = data.sessionId;
      console.log("Game session created:", this.sessionId);
    });

    this.socket.on("leaderboard_update", (data: LeaderboardEntry[]) => {
      onLeaderboardUpdate(data);
    });

    this.socket.on("disconnect", () => {
      console.log("Disconnected from server");
    });
  }

  updateProgress(score: number, status: string) {
    if (this.socket?.connected) {
      this.socket.emit("update_progress", { score, status });
    }
  }

  /**
   * Save round completion data to database
   */
  saveRoundData(roundNumber: number, data: {
    prompts: string[];
    outputs: string[];
    scores?: number[];
    score?: number;
    timeTaken: number;
  }) {
    if (this.socket?.connected) {
      this.socket.emit("round_complete", {
        roundNumber,
        ...data
      });
    }
  }

  /**
   * Mark game as complete with final score
   */
  completeGame(totalScore: number, totalTime: number) {
    if (this.socket?.connected) {
      this.socket.emit("game_complete", {
        totalScore,
        totalTime
      });
    }
  }

  getSessionId(): string | null {
    return this.sessionId;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.sessionId = null;
    }
  }
}

// REST API functions for direct database access
export const gameApi = {
  /**
   * Get leaderboard from database
   */
  async getLeaderboard(limit: number = 10): Promise<LeaderboardEntry[]> {
    try {
      const response = await fetch(`${API_URL}/leaderboard?limit=${limit}`);
      const data = await response.json();
      return data.leaderboard || [];
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      return [];
    }
  },

  /**
   * Get player's game history
   */
  async getPlayerHistory(playerName: string): Promise<any[]> {
    try {
      const response = await fetch(`${API_URL}/players/${encodeURIComponent(playerName)}/sessions`);
      const data = await response.json();
      return data.sessions || [];
    } catch (error) {
      console.error("Error fetching player history:", error);
      return [];
    }
  }
};

export const socketService = new SocketService();