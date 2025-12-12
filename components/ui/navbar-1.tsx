"use client"

import * as React from "react"
import { useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import { Menu, X, Sparkles } from "lucide-react"
import { PromptifyLogo } from "./promptify-logo"

interface NavbarProps {
  onGetStarted?: () => void;
  onNavigate?: (page: 'home' | 'how-to-play' | 'leaderboard') => void;
  currentPage?: string;
}

const Navbar1: React.FC<NavbarProps> = ({ onGetStarted, onNavigate, currentPage = 'home' }) => {
  const [isOpen, setIsOpen] = useState(false)

  const toggleMenu = () => setIsOpen(!isOpen)
  
  const handleNavClick = (page: 'home' | 'how-to-play' | 'leaderboard') => {
    onNavigate?.(page);
    setIsOpen(false);
  }

  return (
    <div className="flex justify-center w-full py-6 px-4 absolute top-4 left-0 right-0 z-50">
      <div className="flex items-center justify-between px-6 py-3 bg-black/40 backdrop-blur-md border border-white/[0.08] rounded-full shadow-lg w-full max-w-3xl relative z-10">
        <div className="flex items-center">
          <motion.div
            className="flex items-center gap-3 mr-6"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.3 }}
          >
            <PromptifyLogo size={32} />
            <span className="font-bold text-white text-lg hidden sm:block">Promptify</span>
          </motion.div>
        </div>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-8">
          {[
            { label: "Home", page: "home" as const },
            { label: "How to Play", page: "how-to-play" as const },
            { label: "Leaderboard", page: "leaderboard" as const }
          ].map((item) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              whileHover={{ scale: 1.05 }}
            >
              <button
                onClick={() => handleNavClick(item.page)}
                className={`text-sm transition-colors font-medium ${
                  currentPage === item.page 
                    ? 'text-white' 
                    : 'text-white/60 hover:text-white'
                }`}
              >
                {item.label}
              </button>
            </motion.div>
          ))}
        </nav>

        {/* Desktop CTA Button */}
        <motion.div
          className="hidden md:block"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          whileHover={{ scale: 1.05 }}
        >
          <button
            onClick={onGetStarted}
            className="inline-flex items-center justify-center gap-2 px-5 py-2 text-sm text-white bg-gradient-to-r from-indigo-500 to-rose-500 rounded-full hover:from-indigo-400 hover:to-rose-400 transition-all shadow-lg shadow-indigo-500/25"
          >
            <Sparkles className="w-4 h-4" />
            Start Playing
          </button>
        </motion.div>

        {/* Mobile Menu Button */}
        <motion.button className="md:hidden flex items-center" onClick={toggleMenu} whileTap={{ scale: 0.9 }}>
          <Menu className="h-6 w-6 text-white" />
        </motion.button>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 bg-[#030303] z-50 pt-24 px-6 md:hidden"
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            <motion.button
              className="absolute top-6 right-6 p-2"
              onClick={toggleMenu}
              whileTap={{ scale: 0.9 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <X className="h-6 w-6 text-white" />
            </motion.button>

            {/* Logo in mobile menu */}
            <motion.div 
              className="flex items-center gap-3 mb-8"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <PromptifyLogo size={40} />
              <span className="font-bold text-white text-xl">Promptify</span>
            </motion.div>

            <div className="flex flex-col space-y-6">
              {[
                { label: "Home", page: "home" as const },
                { label: "How to Play", page: "how-to-play" as const },
                { label: "Leaderboard", page: "leaderboard" as const }
              ].map((item, i) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 + 0.1 }}
                  exit={{ opacity: 0, x: 20 }}
                >
                  <button
                    onClick={() => handleNavClick(item.page)}
                    className={`text-base font-medium ${
                      currentPage === item.page 
                        ? 'text-white' 
                        : 'text-white/60'
                    }`}
                  >
                    {item.label}
                  </button>
                </motion.div>
              ))}

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                exit={{ opacity: 0, y: 20 }}
                className="pt-6"
              >
                <button
                  onClick={() => {
                    toggleMenu();
                    onGetStarted?.();
                  }}
                  className="inline-flex items-center justify-center gap-2 w-full px-5 py-3 text-base text-white bg-gradient-to-r from-indigo-500 to-rose-500 rounded-full hover:from-indigo-400 hover:to-rose-400 transition-all"
                >
                  <Sparkles className="w-5 h-5" />
                  Start Playing
                </button>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export { Navbar1 }
