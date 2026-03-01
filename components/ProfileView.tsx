import React, { useRef, useState, useEffect } from 'react';
import { User, LogOut, Camera, Upload, Key, Clock, Eye, Copy, Check, Trash2, Calendar } from 'lucide-react';
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
  const [visitorCodes, setVisitorCodes] = useState<any[]>([]);
  
  // Create Form State
  const [duration, setDuration] = useState(24); // hours
  const [accessType, setAccessType] = useState<'all' | 'custom'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  const [copiedCodeId, setCopiedCodeId] = useState<number | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [generationSuccess, setGenerationSuccess] = useState<string | null>(null);

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

    fetchVisitorCodes();
  }, []);

  const fetchVisitorCodes = () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    fetch('/api/visitor/codes', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => {
        if (!res.ok) throw new Error("Failed to fetch codes");
        return res.json();
    })
    .then(data => {
        if (Array.isArray(data)) {
            setVisitorCodes(data);
        } else {
            console.error("Visitor codes response is not an array:", data);
        }
    })
    .catch(err => console.error("Error fetching visitor codes:", err));
  };

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
    setIsGenerating(true);
    setGenerationError(null);
    setGenerationSuccess(null);

    try {
      const payload = {
        durationHours: duration,
        accessStartDate: accessType === 'custom' ? startDate : null,
        accessEndDate: accessType === 'custom' ? endDate : null
      };

      const res = await fetch('/api/visitor/create', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}` 
        },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Failed to create code");
      }

      if (data.code) {
        setGenerationSuccess("Code generated successfully!");
        fetchVisitorCodes(); // Refresh list
        // Reset form
        setAccessType('all');
        setStartDate('');
        setEndDate('');
        
        // Clear success message after 3 seconds
        setTimeout(() => setGenerationSuccess(null), 3000);
      }
    } catch (err: any) {
      console.error("Error creating code:", err);
      setGenerationError(err.message || "An error occurred");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeleteCode = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this code?")) return;
    
    try {
      const res = await fetch(`/api/visitor/code/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (res.ok) {
          fetchVisitorCodes();
      } else {
          console.error("Failed to delete code");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const copyToClipboard = (code: string, id: number) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2000);
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
              
              {/* Create New Code Form */}
              <div className="space-y-3 mb-6 bg-white p-4 rounded-xl border border-indigo-100 shadow-sm">
                 <div className="grid grid-cols-2 gap-3">
                   <div>
                     <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">{t('codeDuration')}</label>
                     <select 
                       value={duration} 
                       onChange={(e) => setDuration(parseInt(e.target.value))}
                       className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-2 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                     >
                       <option value={1}>1 {t('hours')}</option>
                       <option value={24}>24 {t('hours')}</option>
                       <option value={168}>7 Days</option>
                       <option value={720}>30 Days</option>
                     </select>
                   </div>
                   <div>
                     <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">{t('dataAccess')}</label>
                     <select 
                       value={accessType} 
                       onChange={(e) => setAccessType(e.target.value as 'all' | 'custom')}
                       className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-2 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                     >
                       <option value="all">{t('allTime')}</option>
                       <option value="custom">{t('customRange')}</option>
                     </select>
                   </div>
                 </div>

                 {accessType === 'custom' && (
                   <div className="grid grid-cols-2 gap-3 animate-in fade-in slide-in-from-top-2">
                     <div>
                       <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">{t('startDate')}</label>
                       <input 
                         type="date" 
                         value={startDate}
                         onChange={(e) => setStartDate(e.target.value)}
                         className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs"
                       />
                     </div>
                     <div>
                       <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">{t('endDate')}</label>
                       <input 
                         type="date" 
                         value={endDate}
                         onChange={(e) => setEndDate(e.target.value)}
                         className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs"
                       />
                     </div>
                   </div>
                 )}

                 <button 
                   onClick={handleCreateCode}
                   disabled={isGenerating}
                   className={`w-full py-2 rounded-lg text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2 ${
                     isGenerating 
                       ? 'bg-indigo-400 cursor-not-allowed text-white' 
                       : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200 active:scale-95'
                   }`}
                 >
                   {isGenerating ? (
                     <>
                       <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                       Generating...
                     </>
                   ) : (
                     <>
                       <Key size={12} />
                       {t('generateCode')}
                     </>
                   )}
                 </button>
                 
                 {generationError && (
                    <div className="mt-2 p-2 bg-red-50 border border-red-100 rounded-lg text-[10px] text-red-600 text-center">
                        {generationError}
                    </div>
                 )}
                 
                 {generationSuccess && (
                    <div className="mt-2 p-2 bg-emerald-50 border border-emerald-100 rounded-lg text-[10px] text-emerald-600 text-center flex items-center justify-center gap-1">
                        <Check size={10} /> {generationSuccess}
                    </div>
                 )}
              </div>

              {/* Active Codes List */}
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">{t('activeCodes')}</h4>
              {visitorCodes.length === 0 ? (
                <p className="text-xs text-slate-400 italic mb-4">{t('noCodes')}</p>
              ) : (
                <div className="space-y-3 mb-6">
                  {visitorCodes.map((code) => {
                    const isExpired = new Date(code.expires_at) < new Date();
                    return (
                      <div key={code.id} className={`bg-white rounded-xl p-3 border ${isExpired ? 'border-red-100 opacity-60' : 'border-indigo-100'} shadow-sm relative group`}>
                         <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <code className="text-lg font-black text-indigo-600 tracking-widest bg-indigo-50 px-2 rounded">{code.code}</code>
                              <button onClick={() => copyToClipboard(code.code, code.id)} className="p-1 hover:bg-slate-100 rounded transition-colors text-slate-400 hover:text-indigo-600">
                                {copiedCodeId === code.id ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                              </button>
                            </div>
                            <button onClick={() => handleDeleteCode(code.id)} className="text-slate-300 hover:text-red-500 transition-colors p-1">
                              <Trash2 size={14} />
                            </button>
                         </div>
                         <div className="flex flex-wrap gap-2 text-[10px] text-slate-500">
                            <span className="flex items-center gap-1 bg-slate-50 px-1.5 py-0.5 rounded">
                              <Clock size={10} /> {isExpired ? 'Expired' : `${t('expiresIn')} ${new Date(code.expires_at).toLocaleDateString()}`}
                            </span>
                            {code.access_start_date && (
                              <span className="flex items-center gap-1 bg-slate-50 px-1.5 py-0.5 rounded">
                                <Calendar size={10} /> {new Date(code.access_start_date).toLocaleDateString()} - {code.access_end_date ? new Date(code.access_end_date).toLocaleDateString() : 'Now'}
                              </span>
                            )}
                         </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Visitor Logs */}
              {visitorLogs.length > 0 && (
                <div className="mt-6 pt-6 border-t border-indigo-100/50">
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