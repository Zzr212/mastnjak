import React, { useState, useEffect } from 'react';
import { User, Lock, ArrowRight, X, ChevronRight, Star, HelpCircle, Clock } from 'lucide-react';
import { Language, translations } from '../utils/translations';
import { getRole } from '../utils/roles';

interface LandingPageProps {
  onLogin: (token: string, username: string, lang: Language) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLogin }) => {
  const [showLogin, setShowLogin] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [publicUsers, setPublicUsers] = useState<any[]>([]);

  // Local state for UI language during login (default en)
  const [uiLang, setUiLang] = useState<Language>('en'); 
  const t = translations[uiLang];

  useEffect(() => {
    fetch('/api/public/users')
      .then(res => res.json())
      .then(data => setPublicUsers(data))
      .catch(err => console.error(err));
  }, []);

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
        onLogin(data.token, data.username || username, (data.language as Language) || 'en');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 font-sans text-slate-100 overflow-x-hidden relative selection:bg-indigo-500/30">
      
      {/* --- ANIMATED ROAD BACKGROUND (Fixed behind everything) --- */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-slate-950 via-slate-900 to-indigo-950"></div>
        <div className="absolute top-[49%] left-0 w-full h-2 bg-indigo-500 blur-xl opacity-60"></div>
        <div className="absolute top-[50%] left-0 w-full h-1/2 bg-slate-950 perspective-road">
          <div className="road-container w-full h-full relative overflow-hidden flex justify-center">
             <div className="road-line center-line"></div>
             <div className="road-line side-line-left"></div>
             <div className="road-line side-line-right"></div>
          </div>
        </div>
      </div>

      <style>{`
        .perspective-road { transform: perspective(300px) rotateX(20deg); transform-origin: top center; }
        .road-container { transform: perspective(100px) rotateX(40deg) scale(1.5); }
        .road-line { position: absolute; top: 0; height: 200%; background: linear-gradient(to bottom, transparent, rgba(255,255,255,0.5), #fff); animation: moveRoad 1s linear infinite; }
        .center-line { width: 4px; left: 50%; transform: translateX(-50%); border-left: 2px dashed rgba(255,255,255,0.3); background: none; }
        .side-line-left { width: 60px; left: 10%; background: linear-gradient(to bottom, transparent, rgba(99, 102, 241, 0.2)); filter: blur(4px); }
        .side-line-right { width: 60px; right: 10%; background: linear-gradient(to bottom, transparent, rgba(99, 102, 241, 0.2)); filter: blur(4px); }
        @keyframes moveRoad { 0% { transform: translateY(-50%) translateX(-50%); } 100% { transform: translateY(0%) translateX(-50%); } }
      `}</style>

      {/* --- STICKY NAV --- */}
      <nav className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-6 py-4 md:px-12 bg-slate-900/80 backdrop-blur-md border-b border-white/5 transition-all duration-300">
        <div className="text-2xl font-black tracking-tighter text-white flex items-center gap-2">
           MASTNAK
        </div>
        <button 
          onClick={() => setShowLogin(!showLogin)}
          className="bg-white/10 hover:bg-white/20 hover:scale-105 active:scale-95 border border-white/20 px-6 py-2 rounded-full font-bold text-sm transition-all shadow-lg shadow-white/5"
        >
          {showLogin ? 'Close' : 'Login / Register'}
        </button>
      </nav>

      {/* --- HERO SECTION --- */}
      <section className="relative z-10 pt-32 pb-20 px-6 text-center min-h-[60vh] flex flex-col justify-center">
         {showLogin ? (
           // LOGIN FORM (In place of Hero content, transparent)
           <div className="max-w-md mx-auto w-full animate-in fade-in slide-in-from-bottom-10 duration-500">
             <h2 className="text-3xl font-bold mb-8 drop-shadow-lg">{isRegistering ? 'Join the Elite' : 'Welcome Back, Driver'}</h2>
             {error && <div className="bg-red-500/20 border border-red-500/50 text-red-200 p-3 rounded-lg mb-4 text-sm backdrop-blur-md">{error}</div>}
             <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative group">
                   <div className="absolute left-4 top-4 text-slate-400 group-focus-within:text-white transition-colors"><User size={20} /></div>
                   <input type="text" required value={username} onChange={(e) => setUsername(e.target.value)} className="w-full pl-12 pr-4 py-4 bg-slate-950/60 border border-white/10 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all backdrop-blur-md shadow-xl" placeholder={t.username} />
                </div>
                <div className="relative group">
                   <div className="absolute left-4 top-4 text-slate-400 group-focus-within:text-white transition-colors"><Lock size={20} /></div>
                   <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full pl-12 pr-4 py-4 bg-slate-950/60 border border-white/10 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all backdrop-blur-md shadow-xl" placeholder={t.password} />
                </div>
                <button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-4 rounded-2xl font-bold text-lg shadow-[0_0_20px_rgba(79,70,229,0.3)] transition-all flex items-center justify-center gap-2 active:scale-95 mt-4 hover:shadow-[0_0_30px_rgba(79,70,229,0.5)]">
                  {loading ? 'Processing...' : (isRegistering ? t.createAccount : t.login)} <ArrowRight size={20} />
                </button>
             </form>
             <button onClick={() => setIsRegistering(!isRegistering)} className="mt-6 text-slate-400 hover:text-white text-sm font-medium transition-colors">
               {isRegistering ? 'Already have an account? Login' : 'Create an account'}
             </button>
           </div>
         ) : (
           // HERO TEXT
           <div className="max-w-3xl mx-auto animate-in fade-in zoom-in-95 duration-1000">
             <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-6 bg-gradient-to-r from-white via-indigo-100 to-slate-400 bg-clip-text text-transparent drop-shadow-sm">
               DRIVER INTELLIGENCE
             </h1>
             <p className="text-lg md:text-xl text-indigo-100/70 mb-10 max-w-2xl mx-auto leading-relaxed">
               The ultimate dashboard for professional drivers. Track earnings, monitor Austria transit times, and manage your schedule with precision.
             </p>
             <button 
                onClick={() => setShowLogin(true)}
                className="group relative bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-4 rounded-full font-bold text-lg shadow-[0_0_30px_rgba(79,70,229,0.4)] transition-all hover:scale-105 active:scale-95 overflow-hidden"
             >
                <span className="relative z-10 flex items-center gap-2">Start Tracking Now <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform"/></span>
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
             </button>
           </div>
         )}
      </section>

      {/* --- PUBLIC USERS CAROUSEL --- */}
      {!showLogin && (
        <section className="relative z-20 pb-20 overflow-hidden">
          <div className="px-6 mb-4 max-w-7xl mx-auto">
             <h3 className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                Active Fleet Members
             </h3>
          </div>
          <div className="flex gap-4 overflow-x-auto px-6 pb-8 scrollbar-hide snap-x max-w-7xl mx-auto">
             {publicUsers.map((user, idx) => {
               const role = getRole(user.created_at);
               return (
                 <div key={idx} className="flex-shrink-0 w-64 bg-slate-800/40 backdrop-blur-md border border-white/5 rounded-2xl p-4 snap-start hover:bg-slate-800/60 transition-all hover:-translate-y-1 hover:border-indigo-500/30">
                    <div className="flex items-center gap-3 mb-3">
                       <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-700 border-2 border-slate-600 shadow-lg">
                          {user.profile_image ? (
                            <img src={user.profile_image} alt={user.username} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400"><User size={20} /></div>
                          )}
                       </div>
                       <div>
                          <p className="font-bold text-white truncate max-w-[120px]">{user.username}</p>
                          <div className={`text-[10px] px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${role.bg} ${role.color} bg-opacity-10 mt-1`}>
                             <span>{role.icon}</span> {role.label}
                          </div>
                       </div>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-slate-400 bg-black/20 py-1 px-2 rounded-lg w-fit">
                       <Clock size={10} />
                       <span>Last seen: {new Date(user.last_active).toLocaleDateString()}</span>
                    </div>
                 </div>
               );
             })}
             {publicUsers.length === 0 && (
                <div className="text-slate-500 text-sm italic px-4">No public profiles yet. Be the first to join the fleet!</div>
             )}
          </div>
        </section>
      )}

      {/* --- FAQ SECTION --- */}
      <section className="relative z-20 bg-slate-950 py-20 px-6 border-t border-white/5">
         <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-10 text-center bg-gradient-to-b from-white to-slate-500 bg-clip-text text-transparent">Frequently Asked Questions</h2>
            <div className="grid md:grid-cols-2 gap-8">
               {[
                 { q: "How does Austria tracking work?", a: "We use a smart stop-watch system. You start it when entering Austria and stop when exiting. The app calculates your sessions and total daily time." },
                 { q: "Is my data secure?", a: "Yes. All your logs are stored securely. We do not track your real-time GPS location, only the data you manually enter." },
                 { q: "Can I change my rate per KM?", a: "Absolutely. Go to Settings to configure your specific payment rate to get accurate earnings estimations." },
                 { q: "What are Driver Roles?", a: "Roles (Beginner, Senior, Pro, Expert) are awarded automatically based on how long you have been a member of the Mastnak fleet." }
               ].map((faq, i) => (
                 <div key={i} className="bg-slate-900/50 p-6 rounded-2xl border border-white/5 hover:border-indigo-500/30 transition-colors group">
                    <h4 className="font-bold flex items-center gap-2 mb-2 text-slate-200 group-hover:text-white"><HelpCircle size={18} className="text-indigo-500 group-hover:scale-110 transition-transform"/> {faq.q}</h4>
                    <p className="text-slate-400 text-sm leading-relaxed">{faq.a}</p>
                 </div>
               ))}
            </div>
         </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="relative z-20 bg-slate-950 border-t border-white/5 py-10 px-6 text-center">
         <div className="text-2xl font-black tracking-tighter text-white mb-4">MASTNAK</div>
         <p className="text-slate-500 text-sm mb-6 max-w-md mx-auto">Empowering drivers with intelligence, simplicity, and modern tools for the road ahead.</p>
         <div className="flex justify-center gap-6 text-xs font-bold text-slate-600 uppercase tracking-widest">
            <a href="#" className="hover:text-indigo-400 transition-colors">Privacy</a>
            <a href="#" className="hover:text-indigo-400 transition-colors">Terms</a>
            <a href="#" className="hover:text-indigo-400 transition-colors">Contact</a>
         </div>
         <p className="text-slate-800 text-[10px] mt-8 font-mono">© 2024 Mastnak Systems. All rights reserved.</p>
      </footer>

    </div>
  );
};