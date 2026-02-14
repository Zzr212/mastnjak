import React, { useState } from 'react';
import { User, Lock, ArrowRight, Truck } from 'lucide-react';
import { Language, translations } from '../utils/translations';

interface AuthProps {
  onLogin: (token: string, username: string, lang: Language) => void;
}

export const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Local state for UI language during login (default en)
  const [uiLang, setUiLang] = useState<Language>('en'); 

  const t = translations[uiLang];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const endpoint = isRegistering ? '/api/auth/register' : '/api/auth/login';

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      if (isRegistering) {
        setIsRegistering(false);
        setError('Account created! Please login.');
      } else {
        // Pass token, username AND stored language preference from DB
        onLogin(data.token, data.username || username, (data.language as Language) || 'en');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center relative overflow-hidden font-sans">
      
      {/* --- ANIMATED ROAD BACKGROUND --- */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Sky Gradient */}
        <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-slate-950 via-slate-900 to-indigo-950"></div>
        
        {/* Horizon Glow */}
        <div className="absolute top-[49%] left-0 w-full h-2 bg-indigo-500 blur-xl opacity-60"></div>

        {/* The Road Surface */}
        <div className="absolute top-[50%] left-0 w-full h-1/2 bg-slate-950 perspective-road">
          {/* Moving Lines Container */}
          <div className="road-container w-full h-full relative overflow-hidden flex justify-center">
             {/* Road Stripes */}
             <div className="road-line center-line"></div>
             <div className="road-line side-line-left"></div>
             <div className="road-line side-line-right"></div>
          </div>
        </div>
      </div>

      <style>{`
        .perspective-road {
          transform: perspective(300px) rotateX(20deg);
          transform-origin: top center;
        }
        .road-container {
          transform: perspective(100px) rotateX(40deg) scale(1.5);
        }
        .road-line {
          position: absolute;
          top: 0;
          height: 200%;
          background: linear-gradient(to bottom, transparent, rgba(255,255,255,0.5), #fff);
          animation: moveRoad 1s linear infinite;
        }
        .center-line {
          width: 4px;
          left: 50%;
          transform: translateX(-50%);
          border-left: 2px dashed rgba(255,255,255,0.3);
          background: none;
        }
        .side-line-left {
          width: 60px;
          left: 10%;
          background: linear-gradient(to bottom, transparent, rgba(99, 102, 241, 0.2)); /* Indigo tint */
          filter: blur(4px);
        }
        .side-line-right {
          width: 60px;
          right: 10%;
          background: linear-gradient(to bottom, transparent, rgba(99, 102, 241, 0.2));
          filter: blur(4px);
        }
        @keyframes moveRoad {
          0% { transform: translateY(-50%) translateX(-50%); }
          100% { transform: translateY(0%) translateX(-50%); }
        }
      `}</style>


      {/* --- MAIN CONTENT LAYER --- */}
      <div className="z-10 w-full max-w-md px-6 flex flex-col items-center">
        
        {/* LOGO (Integrated into environment) */}
        <div className="mb-12 flex flex-col items-center animate-in fade-in slide-in-from-top-10 duration-1000">
          <div className="relative">
             <div className="absolute inset-0 bg-indigo-500 blur-2xl opacity-20 rounded-full"></div>
             <Truck className="text-white w-20 h-20 drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter mt-4 drop-shadow-lg text-center">
            MASTNAK
          </h1>
          <p className="text-indigo-200 text-sm font-medium tracking-[0.3em] uppercase opacity-80 mt-2 text-center">
            Driver Intelligence
          </p>
        </div>

        {/* FORM (Floating transparent) */}
        <div className="w-full backdrop-blur-sm bg-slate-900/40 p-1 rounded-3xl animate-in fade-in zoom-in-95 duration-700 delay-200 border border-white/5">
          <div className="p-6 md:p-8">
            <h2 className="text-xl font-bold text-white mb-6 text-center">
              {isRegistering ? t.joinFleet : t.welcome}
            </h2>

            {error && (
              <div className="bg-red-500/20 border border-red-500/30 text-red-200 text-sm p-3 rounded-xl mb-6 text-center backdrop-blur-md">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative group">
                <div className="absolute left-4 top-4 text-slate-400 group-focus-within:text-white transition-colors">
                  <User size={20} />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-slate-950/60 border border-white/10 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all backdrop-blur-md"
                  placeholder={t.username}
                />
              </div>
              
              <div className="relative group">
                <div className="absolute left-4 top-4 text-slate-400 group-focus-within:text-white transition-colors">
                  <Lock size={20} />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-slate-950/60 border border-white/10 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all backdrop-blur-md"
                  placeholder={t.password}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white py-4 rounded-2xl font-bold text-lg shadow-[0_0_20px_rgba(79,70,229,0.3)] transition-all flex items-center justify-center gap-2 active:scale-95 mt-4"
              >
                {loading ? (
                   <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                   <>
                     {isRegistering ? t.createAccount : t.login}
                     <ArrowRight size={20} />
                   </>
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => {
                  setIsRegistering(!isRegistering);
                  setError('');
                }}
                className="text-slate-400 hover:text-white transition-colors text-sm font-medium"
              >
                {isRegistering ? 'Already have an account? Login' : t.createAccount}
              </button>
            </div>
          </div>
        </div>

        {/* Footer Language Selector (Simple text links for login screen) */}
        <div className="mt-8 flex gap-4 text-xs font-bold text-slate-500 uppercase tracking-widest">
           {(['en', 'bs', 'de', 'it'] as Language[]).map(l => (
             <button 
               key={l}
               onClick={() => setUiLang(l)} 
               className={`hover:text-white transition-colors ${uiLang === l ? 'text-indigo-400' : ''}`}
             >
               {l}
             </button>
           ))}
        </div>

      </div>
    </div>
  );
};