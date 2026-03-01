import React, { useRef, useState, useEffect } from 'react';
import { User, LogOut, Camera, Upload, Key, Clock, Eye, Copy, Check } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';
import { Language, getTranslation } from '../utils/translations';
import { getRole } from '../utils/roles';

interface ProfileViewProps {
  username: string;
  ratePerKm: number;
  onLogout: () => void;
  onBack: () => void;
  lang: Language;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ username, ratePerKm, onLogout, onBack, lang }) => {
  const t = (key: any) => getTranslation(lang, key);
  const [userInfo, setUserInfo] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  
  // Visitor Code State
  const [visitorLogs, setVisitorLogs] = useState<any[]>([]);
  const [duration, setDuration] = useState(24); // hours
  const [generatedCode, setGeneratedCode] = useState<{code: string, expires_at: string} | null>(null);
  const [copied, setCopied] = useState(false);

  // Fetch user detailed info on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    fetch('/api/data', { 
        headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => setUserInfo(data.user_info));

    fetch('/api/visitor/logs', {
        headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => setVisitorLogs(data));
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'profile' | 'cover') => {
    if (e.target.files && e.target.files[0]) {
      const formData = new FormData();
      formData.append('image', e.target.files[0]);
      formData.append('type', type);

      try {
        const res = await fetch('/api/upload', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
            body: formData
        });
        const data = await res.json();
        if (data.path) {
            // Update the correct key in state based on upload type
            setUserInfo((prev: any) => ({
                ...prev,
                [type === 'profile' ? 'profile_image' : 'cover_image']: data.path
            }));
        }
      } catch (err) {
        console.error("Upload failed", err);
      }
    }
  };

  const handleCreateCode = async () => {
    try {
      const res = await fetch('/api/visitor/create', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}` 
        },
        body: JSON.stringify({ durationHours: duration })
      });
      const data = await res.json();
      setGeneratedCode(data);
    } catch (err) {
      console.error(err);
    }
  };

  const copyToClipboard = () => {
    if (generatedCode) {
      navigator.clipboard.writeText(generatedCode.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const role = userInfo ? getRole(userInfo.created_at) : { label: '...', color: '', bg: '', icon: '' };

  return (
    <div className="max-w-md mx-auto pt-4 px-4 pb-20 md:pb-0">
      
      {/* Main Container */}
      <div className="bg-white/90 backdrop-blur-xl rounded-[2rem] shadow-2xl shadow-indigo-900/10 border border-white/50 overflow-hidden relative">
        
        {/* Decorative Header / Cover Image */}
        <div className="h-40 bg-slate-800 relative group">
           {userInfo?.cover_image ? (
             <img src={userInfo.cover_image} alt="Cover" className="w-full h-full object-cover" />
           ) : (
             <div className="w-full h-full bg-gradient-to-br from-slate-700 to-slate-900 opacity-50" />
           )}
           
           <input 
             type="file" ref={coverInputRef} className="hidden" accept="image/*" 
             onChange={(e) => handleUpload(e, 'cover')} 
           />
           <button 
             onClick={() => coverInputRef.current?.click()}
             className="absolute bottom-2 right-2 bg-black/50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
           >
             <Camera size={16} />
           </button>

           <button 
             onClick={onBack}
             className="absolute top-4 right-4 bg-black/20 hover:bg-black/40 text-white px-4 py-2 rounded-full text-xs font-bold backdrop-blur transition-all z-10"
           >
             Close
           </button>
        </div>

        {/* Profile Content */}
        <div className="px-6 pb-8 -mt-16 relative">
           {/* Avatar */}
           <div className="flex justify-center mb-4 relative group">
              <div className="w-32 h-32 rounded-[2rem] bg-white p-2 shadow-xl hover:scale-105 transition-transform duration-300">
                 <div className="w-full h-full bg-indigo-50 rounded-[1.5rem] flex items-center justify-center text-indigo-500 overflow-hidden relative">
                    {userInfo?.profile_image ? (
                        <img src={userInfo.profile_image} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                        <User size={48} />
                    )}
                 </div>
              </div>
              <input 
                type="file" ref={fileInputRef} className="hidden" accept="image/*" 
                onChange={(e) => handleUpload(e, 'profile')} 
              />
              <button 
                 onClick={() => fileInputRef.current?.click()}
                 className="absolute bottom-2 right-1/2 translate-x-12 bg-indigo-600 text-white p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-indigo-500"
              >
                 <Upload size={14} />
              </button>
           </div>

           <div className="text-center mb-8">
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">{username}</h2>
              <div className={`inline-flex items-center gap-1 ${role.bg} ${role.color} px-3 py-1 rounded-full text-xs font-bold mt-2 border border-opacity-20`}>
                 <span>{role.icon}</span>
                 <span>{role.label} Driver</span>
              </div>
           </div>

           {/* Stats Grid */}
           <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-100 text-center">
                 <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">{t('currentRate')}</p>
                 <p className="text-xl font-black text-slate-900">{formatCurrency(ratePerKm)}</p>
              </div>
              <div className="bg-emerald-50/80 p-5 rounded-2xl border border-emerald-100 text-center">
                 <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider mb-1">Status</p>
                 <p className="text-xl font-black text-emerald-600 flex items-center justify-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    Active
                 </p>
              </div>
           </div>

           {/* Visitor Code Section */}
           <div className="bg-indigo-50/50 rounded-2xl p-5 border border-indigo-100 mb-8">
              <div className="flex items-center gap-2 mb-4 text-indigo-900">
                 <Key size={18} />
                 <h3 className="font-bold">{t('visitorCode')}</h3>
              </div>
              
              {!generatedCode ? (
                <div className="space-y-3">
                   <div>
                     <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">{t('codeDuration')}</label>
                     <select 
                       value={duration} 
                       onChange={(e) => setDuration(parseInt(e.target.value))}
                       className="w-full bg-white border border-indigo-100 rounded-xl px-3 py-2 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                     >
                       <option value={1}>1 {t('hours')}</option>
                       <option value={24}>24 {t('hours')}</option>
                       <option value={168}>7 Days</option>
                     </select>
                   </div>
                   <button 
                     onClick={handleCreateCode}
                     className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-xl text-sm font-bold shadow-lg shadow-indigo-200 transition-all active:scale-95"
                   >
                     {t('createVisitorCode')}
                   </button>
                </div>
              ) : (
                <div className="bg-white rounded-xl p-4 border border-indigo-100 shadow-sm">
                   <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">{t('activeCode')}</p>
                   <div className="flex items-center justify-between gap-2 mb-2">
                      <code className="text-2xl font-black text-indigo-600 tracking-widest">{generatedCode.code}</code>
                      <button onClick={copyToClipboard} className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-indigo-600">
                        {copied ? <Check size={18} className="text-emerald-500" /> : <Copy size={18} />}
                      </button>
                   </div>
                   <div className="flex items-center gap-1 text-[10px] text-slate-400 bg-slate-50 px-2 py-1 rounded-lg w-fit">
                      <Clock size={10} />
                      <span>{t('expiresIn')} {new Date(generatedCode.expires_at).toLocaleString()}</span>
                   </div>
                   <button 
                     onClick={() => setGeneratedCode(null)}
                     className="mt-3 text-xs text-red-400 hover:text-red-500 font-medium underline"
                   >
                     Revoke / Create New
                   </button>
                </div>
              )}

              {/* Visitor Logs */}
              {visitorLogs.length > 0 && (
                <div className="mt-6">
                   <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">{t('visitorLogs')}</h4>
                   <div className="space-y-2 max-h-40 overflow-y-auto pr-1 scrollbar-hide">
                      {visitorLogs.map((log: any) => (
                        <div key={log.id} className="flex items-center justify-between text-xs bg-white p-2 rounded-lg border border-slate-100">
                           <div className="flex items-center gap-2 text-slate-600">
                              <Eye size={12} className="text-indigo-400" />
                              <span>Accessed via code <span className="font-mono font-bold">{log.visitor_code}</span></span>
                           </div>
                           <span className="text-slate-400">{new Date(log.accessed_at).toLocaleString()}</span>
                        </div>
                      ))}
                   </div>
                </div>
              )}
           </div>

           {/* Logout Button */}
           <button 
             onClick={onLogout}
             className="w-full py-5 bg-gradient-to-r from-rose-500 to-red-500 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-rose-200 active:scale-95 transition-all"
           >
             <LogOut size={20} />
             {t('logout')}
           </button>

           <div className="mt-8 text-center opacity-40">
              <p className="text-[10px] uppercase tracking-widest font-semibold">{t('poweredBy')}</p>
           </div>
        </div>
      </div>
    </div>
  );
};