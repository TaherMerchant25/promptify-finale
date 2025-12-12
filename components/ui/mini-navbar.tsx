"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Key, Trophy, X, Menu } from 'lucide-react';

interface NavbarProps {
  onLoginClick?: () => void;
  onLeaderboardClick?: () => void;
  showLeaderboard?: boolean;
}

interface AnimatedNavLinkProps {
  href?: string;
  onClick?: () => void;
  children: React.ReactNode;
  icon?: React.ElementType;
}

const AnimatedNavLink: React.FC<AnimatedNavLinkProps> = ({ 
  href, 
  onClick,
  children,
  icon: Icon
}) => {
  const content = (
    <div className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors">
      {Icon && <Icon size={16} className="opacity-70" />}
      <span>{children}</span>
    </div>
  );

  if (onClick) {
    return (
      <button 
        onClick={onClick}
        className="text-sm"
      >
        {content}
      </button>
    );
  }

  return (
    <a 
      href={href} 
      target="_blank"
      rel="noopener noreferrer"
      className="text-sm"
    >
      {content}
    </a>
  );
};

export function Navbar({ onLoginClick, onLeaderboardClick, showLeaderboard = true }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [headerShapeClass, setHeaderShapeClass] = useState('rounded-full');
  const shapeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    if (shapeTimeoutRef.current) {
      clearTimeout(shapeTimeoutRef.current);
    }

    if (isOpen) {
      setHeaderShapeClass('rounded-xl');
    } else {
      shapeTimeoutRef.current = setTimeout(() => {
        setHeaderShapeClass('rounded-full');
      }, 300);
    }

    return () => {
      if (shapeTimeoutRef.current) {
        clearTimeout(shapeTimeoutRef.current);
      }
    };
  }, [isOpen]);

  // Promptify Logo
  const logoElement = (
    <div className="flex items-center gap-2">
      <div className="relative w-8 h-8 flex items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-rose-500 shadow-lg shadow-indigo-500/25">
        <Sparkles size={18} className="text-white" />
      </div>
      <span className="font-bold text-white text-lg hidden sm:block">Promptify</span>
    </div>
  );

  const navLinksData = [
    { 
      label: 'Get API Key', 
      href: 'https://aistudio.google.com/app/apikey',
      icon: Key
    },
    ...(showLeaderboard ? [{
      label: 'Leaderboard', 
      onClick: onLeaderboardClick,
      icon: Trophy
    }] : []),
  ];

  const leaderboardButtonElement = (
    <button 
      onClick={onLeaderboardClick}
      className="px-4 py-2 sm:px-4 text-xs sm:text-sm border border-white/[0.08] bg-white/[0.03] text-gray-300 rounded-full hover:border-white/20 hover:text-white hover:bg-white/[0.08] transition-all duration-200 w-full sm:w-auto flex items-center justify-center gap-2"
    >
      <Trophy size={16} />
      <span>Leaderboard</span>
    </button>
  );

  const ctaButtonElement = (
    <div className="relative group w-full sm:w-auto">
      <div className="absolute inset-0 -m-1 rounded-full
                    hidden sm:block
                    bg-gradient-to-r from-indigo-500 to-rose-500
                    opacity-40 filter blur-lg pointer-events-none
                    transition-all duration-300 ease-out
                    group-hover:opacity-60 group-hover:blur-xl group-hover:-m-2"></div>
      <button 
        onClick={onLoginClick}
        className="relative z-10 px-4 py-2 sm:px-4 text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-indigo-500 to-rose-500 rounded-full hover:from-indigo-400 hover:to-rose-400 transition-all duration-200 w-full sm:w-auto"
      >
        Start Playing
      </button>
    </div>
  );

  return (
    <header className={`fixed top-6 left-1/2 transform -translate-x-1/2 z-50
                       flex flex-col items-center
                       pl-4 pr-4 sm:pl-6 sm:pr-6 py-3 backdrop-blur-md
                       ${headerShapeClass}
                       border border-white/[0.08] bg-black/40
                       w-[calc(100%-2rem)] sm:w-auto
                       transition-[border-radius] duration-0 ease-in-out`}>

      <div className="flex items-center justify-between w-full gap-x-4 sm:gap-x-8">
        <div className="flex items-center">
          {logoElement}
        </div>

        <nav className="hidden sm:flex items-center space-x-4 sm:space-x-6 text-sm">
          {navLinksData.map((link, index) => (
            <AnimatedNavLink 
              key={index} 
              href={'href' in link ? link.href : undefined}
              onClick={'onClick' in link ? link.onClick : undefined}
              icon={link.icon}
            >
              {link.label}
            </AnimatedNavLink>
          ))}
        </nav>

        <div className="hidden sm:flex items-center gap-2 sm:gap-3">
          {showLeaderboard && leaderboardButtonElement}
          {ctaButtonElement}
        </div>

        <button 
          className="sm:hidden flex items-center justify-center w-8 h-8 text-gray-300 focus:outline-none" 
          onClick={toggleMenu} 
          aria-label={isOpen ? 'Close Menu' : 'Open Menu'}
        >
          {isOpen ? (
            <X size={24} />
          ) : (
            <Menu size={24} />
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      <div className={`sm:hidden flex flex-col items-center w-full transition-all ease-in-out duration-300 overflow-hidden
                       ${isOpen ? 'max-h-[1000px] opacity-100 pt-4' : 'max-h-0 opacity-0 pt-0 pointer-events-none'}`}>
        <nav className="flex flex-col items-center space-y-4 text-base w-full">
          <a 
            href="https://aistudio.google.com/app/apikey" 
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-300 hover:text-white transition-colors w-full text-center flex items-center justify-center gap-2"
          >
            <Key size={18} />
            Get API Key
          </a>
          {showLeaderboard && (
            <button 
              onClick={() => {
                onLeaderboardClick?.();
                setIsOpen(false);
              }}
              className="text-gray-300 hover:text-white transition-colors w-full text-center flex items-center justify-center gap-2"
            >
              <Trophy size={18} />
              Leaderboard
            </button>
          )}
        </nav>
        <div className="flex flex-col items-center space-y-3 mt-4 w-full">
          {showLeaderboard && leaderboardButtonElement}
          {ctaButtonElement}
        </div>
      </div>
    </header>
  );
}
