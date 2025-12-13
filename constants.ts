import { RoundData, LeaderboardEntry } from './types';

export const ROUNDS: RoundData[] = [
  {
    id: 1,
    title: "Phrase Master",
    description: "Make the AI output these exact phrases. You can use any words EXCEPT the exact target sentence itself!",
    type: 'text',
    targetContent: "", // Not used for sub-round based challenges
    subRounds: [
      {
        id: "1a",
        targetPhrase: "The cage is out of the lion"
      },
      {
        id: "1b", 
        targetPhrase: "Don't use the exact words"
      },
      {
        id: "1c",
        targetPhrase: "That's what she said"
      },
      {
        id: "1d",
        targetPhrase: "Life is unfair"
      },
      {
        id: "1e",
        targetPhrase: "You won't always win, just give up"
      },
      {
        id: "1f",
        targetPhrase: "I see us written in the stars"
      },
      {
        id: "1g",
        targetPhrase: "pneumonoultramicroscopicsilicovolcanoconiosis"
      },
      {
        id: "1h",
        targetPhrase: "Antidisestablishmentarianism"
      },
      {
        id: "1i",
        targetPhrase: "Fred fed Ted bread, and Ted fed Fred bread"
      },
      {
        id: "1j",
        targetPhrase: "The quick brown fox jumps over the lazy dog"
      }
    ]
  },
  {
    id: 2,
    title: "ASCII Art Master",
    description: "Generate ASCII Art from images using Gemini's vision. Make the AI create ASCII art matching the target images! (10-15 minutes)",
    type: 'image',
    targetContent: "/ascii-art-hacker.jpg",
    subRounds: [
      {
        id: "2a",
        targetPhrase: "/ascii-art-hacker.jpg" // Level 1: Hacker image
      },
      {
        id: "2b",
        targetPhrase: "/images (1).png" // Level 2: Second image
      }
    ]
  },
  {
    id: 3,
    title: "Ditto My Buddy",
    description: "Replicate the frontend of dtu.ac.in with a different theme. Upload your single HTML file with embedded CSS. Bonus points for animations! (30 points)",
    type: 'html-upload',
    targetContent: "https://dtu.ac.in",
    displayTarget: "Create a website similar to DTU's homepage with your own creative theme",
    subRounds: [
      {
        id: "3a",
        targetPhrase: "Replicate the dtu.ac.in homepage frontend with HTML/CSS. Include structure, styling, and animations."
      }
    ]
  }
];

// Mock data removed in favor of Socket.io Server data
export const MOCK_LEADERBOARD: LeaderboardEntry[] = [];