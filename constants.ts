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
      }
    ]
  },
  {
    id: 2,
    title: "JSON Architect",
    description: "Make the model output this exact JSON structure for a user profile.",
    type: 'text',
    targetContent: `{"id":101,"active":true,"roles":["admin","editor"]}`,
    displayTarget: `{
  "id": 101,
  "active": true,
  "roles": ["admin", "editor"]
}`
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