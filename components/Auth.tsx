import React, { useState } from 'react';
import { User, Lock, ArrowRight, ChevronRight, Truck } from 'lucide-react';

interface AuthProps {
  onLogin: (token: string, username: string) => void;
}

export const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [step, setStep] = useState<'welcome' | 'form'>('welcome');
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
        // Pass token AND username
        onLogin(data.token, data.username || username);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (step === 'welcome') {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
           <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500 rounded-full blur-[128px]"></div>
           <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600 rounded-full blur-[128px]"></div>
        </div>

        <div className="z-10 text-center animate-in fade-in slide-in-from-bottom-10 duration-1000">
           <div className="mb-6 flex justify-center">
             <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 shadow-2xl">
                <Truck className="text-white w-10 h-10" />
             </div>
           </div>
           
           <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter mb-2">
             MASTNAK
           </h1>
           <p className="text-slate-400 text-sm md:text-base font-medium tracking-widest uppercase mb-12">
             Professional Driver Intelligence
           </p>

           <button 
             onClick={() => setStep('form')}
             className="group relative px-8 py-4 bg-white text-slate-900 rounded-full font-bold text-lg hover:bg-slate-200 transition-all active:scale-95 shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)]"
           >
             <span className="flex items-center gap-2">
               Enter Dashboard
               <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
             </span>
           </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Subtle Grid Background */}
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>

      <div className="w-full max-w-md w-full animate-in fade-in zoom-in-95 duration-500 z-10">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">
            {isRegistering ? 'Join the Fleet' : 'Welcome Back'}
          </h2>
          <p className="text-slate-400">
            {isRegistering ? 'Create your professional profile' : 'Sign in to continue tracking'}
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-4 rounded-xl mb-6 text-center backdrop-blur-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="group">
            <div className="relative">
              <div className="absolute left-4 top-4 text-slate-500 group-focus-within:text-white transition-colors">
                <User size={20} />
              </div>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-slate-900/50 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                placeholder="Username"
              />
            </div>
          </div>
          
          <div className="group">
            <div className="relative">
              <div className="absolute left-4 top-4 text-slate-500 group-focus-within:text-white transition-colors">
                <Lock size={20} />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-slate-900/50 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                placeholder="Password"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed mt-4"
          >
            {loading ? (
               <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
               <>
                 {isRegistering ? 'Create Account' : 'Login'}
                 <ArrowRight size={20} />
               </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <button
            onClick={() => {
              setIsRegistering(!isRegistering);
              setError('');
            }}
            className="text-slate-500 hover:text-white transition-colors text-sm font-medium"
          >
            {isRegistering ? 'Already have an account? Login' : "Don't have an account? Create one"}
          </button>
        </div>
        
        <div className="mt-12 text-center opacity-30">
          <p className="text-xs text-slate-600 uppercase tracking-widest">Powered by Mastnak Systems</p>
        </div>
      </div>
    </div>
  );
};