import React, { useState, useEffect } from 'react';
import { User, Lock, ArrowRight, CheckCircle2, ChevronRight, Clock, Key } from 'lucide-react';
import { Language, translations } from '../utils/translations';
import { getRole } from '../utils/roles';
import { VisitorDashboard } from './VisitorDashboard';

interface LandingPageProps {
  onLogin: (token: string, username: string, lang: Language) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLogin }) => {
  const [showLogin, setShowLogin] = useState(false);
  const [showVisitorInput, setShowVisitorInput] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [visitorCode, setVisitorCode] = useState('');
  const [visitorData, setVisitorData] = useState<any>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [regSuccess, setRegSuccess] = useState(false);
  const [publicUsers, setPublicUsers] = useState<any[]>([]);

  // Local state for UI language during login (default en)
  const [uiLang, setUiLang] = useState<Language>('en'); 
  const t = translations[uiLang];

  useEffect(() => {
    fetch('/api/public/users')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch');
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data)) setPublicUsers(data);
      })
      .catch(err => console.error("Error fetching public users:", err));
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

      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Server error: Invalid response format");
      }

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      if (isRegistering) {
        setRegSuccess(true);
        setTimeout(() => {
          onLogin(data.token, data.username || username, (data.language as Language) || 'en');
        }, 1500); 
      } else {
        onLogin(data.token, data.username || username, (data.language as Language) || 'en');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Connection failed");
    } finally {
      setLoading(false);
    }
  };

  const handleVisitorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/visitor/access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: visitorCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Invalid code');
      setVisitorData(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (visitorData) {
    return <VisitorDashboard data={visitorData} onClose={() => setVisitorData(null)} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-indigo-500/30 flex flex-col">
      {/* Navigation */}
      <nav className="w-full flex items-center justify-between px-6 py-4 md:px-12 bg-white border-b border-slate-200">
        <div className="text-xl md:text-2xl font-black tracking-tight text-indigo-600 flex items-center gap-2">
           Driver Dashboard
        </div>
        <button 
          onClick={() => { setShowLogin(!showLogin); setShowVisitorInput(false); }}
          className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-2 rounded-lg font-semibold text-sm transition-colors border border-slate-300"
        >
          {showLogin ? 'Close' : 'Login / Register'}
        </button>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col justify-center relative z-10 px-6 py-12">
         {showLogin ? (
           <div className="max-w-md mx-auto w-full bg-white p-8 rounded-2xl shadow-xl border border-slate-100">
             {regSuccess ? (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                   <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                      <CheckCircle2 size={32} className="text-emerald-500" />
                   </div>
                   <h2 className="text-2xl font-bold text-slate-800 mb-2">Welcome Aboard!</h2>
                   <p className="text-slate-500">Preparing your dashboard...</p>
                </div>
             ) : (
                <>
                 <h2 className="text-2xl font-bold mb-6 text-slate-800 text-center">{isRegistering ? 'Create Account' : 'Welcome Back'}</h2>
                 {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm border border-red-100 text-center">{error}</div>}
                 <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                       <label className="block text-sm font-semibold text-slate-600 mb-1">{t.username}</label>
                       <div className="relative">
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><User size={18} /></div>
                          <input type="text" required value={username} onChange={(e) => setUsername(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none" placeholder="john_doe" />
                       </div>
                    </div>
                    <div>
                       <label className="block text-sm font-semibold text-slate-600 mb-1">{t.password}</label>
                       <div className="relative">
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><Lock size={18} /></div>
                          <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none" placeholder="••••••••" />
                       </div>
                    </div>
                    <button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-bold shadow-sm transition-all flex items-center justify-center gap-2 mt-2">
                      {loading ? 'Processing...' : (isRegistering ? t.createAccount : t.login)} <ArrowRight size={18} />
                    </button>
                 </form>
                 <div className="mt-6 text-center">
                   <button onClick={() => setIsRegistering(!isRegistering)} className="text-indigo-600 hover:text-indigo-800 text-sm font-semibold transition-colors">
                     {isRegistering ? 'Already have an account? Login' : 'Need an account? Register'}
                   </button>
                 </div>
                </>
             )}
           </div>
         ) : showVisitorInput ? (
            <div className="max-w-md mx-auto w-full bg-white p-8 rounded-2xl shadow-xl border border-slate-100">
               <h2 className="text-2xl font-bold mb-6 text-slate-800 text-center">Visitor Access</h2>
               {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm border border-red-100 text-center">{error}</div>}
               <form onSubmit={handleVisitorSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-600 mb-1">Enter Code</label>
                    <div className="relative group">
                       <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><Key size={20} /></div>
                       <input type="text" required value={visitorCode} onChange={(e) => setVisitorCode(e.target.value.toUpperCase())} className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-mono tracking-widest uppercase outline-none" placeholder="1A2B3C" />
                    </div>
                  </div>
                  <button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-bold shadow-sm transition-all flex items-center justify-center gap-2 mt-2">
                    {loading ? 'Verifying...' : 'Access Dashboard'} <ArrowRight size={18} />
                  </button>
               </form>
               <div className="mt-6 text-center">
                 <button onClick={() => setShowVisitorInput(false)} className="text-slate-500 hover:text-slate-700 text-sm font-semibold transition-colors">
                   Cancel
                 </button>
               </div>
            </div>
         ) : (
           <div className="max-w-3xl mx-auto text-center">
             <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-6 text-slate-900">
               The ultimate dashboard for <span className="text-indigo-600">professional drivers</span>.
             </h1>
             <p className="text-lg md:text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
               Track earnings and manage your schedule with precision in a beautifully optimized, classic interface.
             </p>
             <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
               <button 
                  onClick={() => setShowLogin(true)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-md hover:shadow-lg transition-all flex items-center gap-2 w-full sm:w-auto justify-center"
               >
                  Get Started <ChevronRight size={20} />
               </button>
               
               <button 
                 onClick={() => setShowVisitorInput(true)}
                 className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 px-8 py-4 rounded-xl font-bold text-lg shadow-sm transition-colors flex items-center gap-2 w-full sm:w-auto justify-center"
               >
                 <Key size={18} />
                 I have a Visitor Code
               </button>
             </div>
           </div>
         )}
      </main>

      {/* Footer */}
      {!showLogin && !showVisitorInput && (
        <footer className="w-full bg-white border-t border-slate-200 py-8 px-6 text-center mt-auto">
           <div className="text-xl font-black tracking-tight text-slate-300 mb-2">Driver Dashboard</div>
           <p className="text-slate-500 text-sm">Empowering drivers with simplicity and modern tools.</p>
           <p className="text-slate-400 text-xs mt-4">© {new Date().getFullYear()} Driver Dashboard. All rights reserved.</p>
        </footer>
      )}
    </div>
  );
};;