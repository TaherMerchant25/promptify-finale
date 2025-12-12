import React from 'react';
import { FlippingCard } from '@/components/ui/flipping-card';
import { Brain, Sparkles, Target, Lightbulb, MessageCircle, Quote, Info } from 'lucide-react';

interface RoundShowcaseProps {
  roundId: number;
}

interface CardData {
  id: string;
  front: {
    icon: React.ReactNode;
    title: string;
    phrase: string;
  };
  back: {
    description: string;
    hint: string;
  };
}

const round1Cards: CardData[] = [
  {
    id: "phrase-1",
    front: {
      icon: <MessageCircle className="w-10 h-10 text-indigo-400" />,
      title: "Challenge 1",
      phrase: "The cage is out of the lion",
    },
    back: {
      description: "A reversed idiom! Make the AI output this exact phrase.",
      hint: "Think about reversing common sayings...",
    },
  },
  {
    id: "phrase-2",
    front: {
      icon: <Quote className="w-10 h-10 text-rose-400" />,
      title: "Challenge 2",
      phrase: "Don't use the exact words",
    },
    back: {
      description: "The ironic phrase! Can you make the AI say this?",
      hint: "Context about instructions or rules...",
    },
  },
  {
    id: "phrase-3",
    front: {
      icon: <Sparkles className="w-10 h-10 text-amber-400" />,
      title: "Challenge 3",
      phrase: "That's what she said",
    },
    back: {
      description: "The classic meme phrase! Get creative with context.",
      hint: "Think of double meanings...",
    },
  },
  {
    id: "phrase-4",
    front: {
      icon: <Target className="w-10 h-10 text-emerald-400" />,
      title: "Challenge 4",
      phrase: "Life is unfair",
    },
    back: {
      description: "A philosophical truth! Make the AI express this sentiment.",
      hint: "Consider situations of injustice...",
    },
  },
];

function CardFront({ data }: { data: CardData["front"] }) {
  return (
    <div className="flex flex-col items-center justify-center h-full w-full p-4 text-center">
      <div className="mb-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.08]">
        {data.icon}
      </div>
      <span className="text-xs font-medium text-white/40 uppercase tracking-wider">{data.title}</span>
      <p className="text-base font-bold text-white mt-3 leading-relaxed px-2">
        "{data.phrase}"
      </p>
      <span className="text-xs text-white/30 mt-4">Hover for hints →</span>
    </div>
  );
}

function CardBack({ data }: { data: CardData["back"] }) {
  return (
    <div className="flex flex-col items-center justify-center h-full w-full p-4 text-center">
      <Lightbulb className="w-6 h-6 text-amber-400 mb-3" />
      <p className="text-xs text-white/50 leading-relaxed mb-4">
        {data.description}
      </p>
      <div className="px-3 py-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
        <div className="flex items-center gap-1 mb-1">
          <Info className="w-3 h-3 text-indigo-400" />
          <span className="text-[10px] text-indigo-400 uppercase font-bold">Hint</span>
        </div>
        <p className="text-xs text-indigo-300/70">
          {data.hint}
        </p>
      </div>
    </div>
  );
}

export function RoundShowcase({ roundId }: RoundShowcaseProps) {
  if (roundId !== 1) return null;

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Brain className="w-5 h-5 text-indigo-400" />
        <span className="text-sm font-medium text-white/60">Hover cards for hints</span>
      </div>
      <div className="flex gap-3 flex-wrap justify-center">
        {round1Cards.map((card) => (
          <FlippingCard
            key={card.id}
            width={200}
            height={220}
            frontContent={<CardFront data={card.front} />}
            backContent={<CardBack data={card.back} />}
          />
        ))}
      </div>
    </div>
  );
}
