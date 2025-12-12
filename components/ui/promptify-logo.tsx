import React from "react";

interface PromptifyLogoProps {
  size?: number;
  className?: string;
}

export const PromptifyLogo: React.FC<PromptifyLogoProps> = ({ 
  size = 32, 
  className = "" 
}) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 32 32" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Background with gradient */}
      <rect width="32" height="32" rx="8" fill="url(#promptify-gradient)" />
      
      {/* Prompt cursor/bracket symbol */}
      <path 
        d="M8 10L12 16L8 22" 
        stroke="white" 
        strokeWidth="2.5" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      
      {/* Blinking cursor line */}
      <rect x="15" y="10" width="2.5" height="12" rx="1" fill="white" />
      
      {/* Sparkle/AI dots */}
      <circle cx="22" cy="12" r="2" fill="white" fillOpacity="0.9" />
      <circle cx="26" cy="16" r="1.5" fill="white" fillOpacity="0.7" />
      <circle cx="22" cy="20" r="1.5" fill="white" fillOpacity="0.6" />
      
      {/* Gradient definition */}
      <defs>
        <linearGradient id="promptify-gradient" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop stopColor="#6366F1" />
          <stop offset="0.5" stopColor="#8B5CF6" />
          <stop offset="1" stopColor="#F43F5E" />
        </linearGradient>
      </defs>
    </svg>
  );
};

// Alternative minimalist version
export const PromptifyLogoMinimal: React.FC<PromptifyLogoProps> = ({ 
  size = 32, 
  className = "" 
}) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 32 32" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Background */}
      <rect width="32" height="32" rx="8" fill="url(#promptify-gradient-minimal)" />
      
      {/* Stylized "P" made of prompt elements */}
      <path 
        d="M10 8L10 24" 
        stroke="white" 
        strokeWidth="3" 
        strokeLinecap="round"
      />
      <path 
        d="M10 8H18C20.2091 8 22 9.79086 22 12C22 14.2091 20.2091 16 18 16H10" 
        stroke="white" 
        strokeWidth="3" 
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      
      {/* AI sparkles */}
      <circle cx="25" cy="20" r="2" fill="white" fillOpacity="0.8" />
      <circle cx="22" cy="24" r="1.5" fill="white" fillOpacity="0.6" />
      
      <defs>
        <linearGradient id="promptify-gradient-minimal" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop stopColor="#6366F1" />
          <stop offset="1" stopColor="#F43F5E" />
        </linearGradient>
      </defs>
    </svg>
  );
};
