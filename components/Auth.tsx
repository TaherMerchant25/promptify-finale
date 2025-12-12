import React, { useState } from 'react';
import { User } from '../types';
import { GeminiService } from '../services/geminiService';
import { Key, User as UserIcon, Loader2, AlertCircle, ArrowLeft } from 'lucide-react';


interface AuthProps {
  onLogin: (user: User, service: GeminiService) => void;
  onBack: () => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin, onBack }) => {
  const [username, setUsername] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !apiKey) {
      setError("Please fill in all fields");
      return;
    }

    setLoading(true);
    setError('');

    try {
      const service = new GeminiService(apiKey);
      const isValid = await service.validateKey();

      if (isValid) {
        onLogin({
          username,
          apiKey,
          avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`
        }, service);
      } else {
        setError("Invalid Gemini API Key or API unreachable.");
      }
    } catch (err) {
      setError("Something went wrong during validation.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030303] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="absolute top-6 left-6 z-20 flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.05] border border-white/[0.08] text-white/60 hover:text-white hover:bg-white/[0.1] transition-all duration-300"
      >
        <ArrowLeft size={18} />
        <span className="text-sm font-medium">Back</span>
      </button>

      {/* Background Decor */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute top-1/4 right-1/4 w-[300px] h-[300px] bg-rose-500/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-md bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-3xl shadow-2xl p-8 relative z-10">
        <div className="text-center mb-10">
          <div className="flex justify-center mb-6">
            <img 
              src="https://avatars.githubusercontent.com/u/53648600?s=200&v=4" 
              alt="ACM DTU Logo" 
              className="w-24 h-24 rounded-2xl shadow-2xl shadow-indigo-500/20"
            />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-white mb-2">
            Promptify
          </h1>
          <p className="text-white/40">Craft prompts. Beat the AI.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-white/40 flex items-center gap-2">
              <UserIcon size={14} /> Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-black/30 border border-white/[0.08] rounded-xl px-4 py-3.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all placeholder-white/20"
              placeholder="Enter your handle..."
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-white/40 flex items-center gap-2">
              <Key size={14} /> Gemini API Key
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full bg-black/30 border border-white/[0.08] rounded-xl px-4 py-3.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all placeholder-white/20"
              placeholder="AIzaSy..."
            />
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-400 text-sm">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-indigo-500 to-rose-500 hover:from-indigo-400 hover:to-rose-400 text-white font-bold py-4 rounded-xl transition-all transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={20} /> Connecting...
              </>
            ) : (
              "Start Challenge"
            )}
          </button>
        </form>
        
        <div className="mt-8 text-center">
            <p className="text-xs text-white/30">
                Don't have a key? <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-indigo-400 hover:text-indigo-300 transition-colors">Get one from Google AI Studio</a>
            </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;