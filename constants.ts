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
    description: "Generate ASCII Art that matches the target. Make the AI create ASCII art with similar symbols and structure! (10-15 minutes)",
    type: 'text',
    targetContent: "", // Not used for sub-round based challenges
    subRounds: [
      {
        id: "2a",
        targetPhrase: `
   ___ _         _ 
  / __| |_  _ __| |_____ _ _ 
 | (__| ' \\| '_ \\ / / -_) '_|
  \\___|_||_| .__/_\\_\\___|_|  
           |_|               
        `
      },
      {
        id: "2b",
        targetPhrase: `
    .---.
   /     \\
   \\.@-@./
   /\`\\_/\`\\
  //  _  \\\\
 | \\     )|_
/\`\\_\`>  <_/ \\
\\__/'---'\\__/
        `
      }
    ]
  },
  {
    id: 3,
    title: "Pixel Perfect: The Coffee",
    description: "Generate an image that matches this target visual description: A minimal latte art heart in a white ceramic cup on a wooden table, top-down view.",
    type: 'image',
    targetContent: "https://picsum.photos/id/425/512/512", // Coffee cup
  },
  {
    id: 4,
    title: "Cyberpunk City",
    description: "Generate a futuristic cyberpunk city street at night with neon blue and pink lights, rain on pavement, and no people.",
    type: 'image',
    targetContent: "https://picsum.photos/id/203/512/512",
  }
];

// Mock data removed in favor of Socket.io Server data
export const MOCK_LEADERBOARD: LeaderboardEntry[] = [];