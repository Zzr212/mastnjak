import React from 'react';
import { Settings, Globe } from 'lucide-react';
import { Language, getTranslation } from '../utils/translations';

interface SettingsViewProps {
  ratePerKm: number;
  setRatePerKm: (rate: number) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ ratePerKm, setRatePerKm, language, setLanguage }) => {
  const t = (key: any) => getTranslation(language, key);

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-white/50 backdrop-blur rounded-2xl shadow-sm border border-slate-200/50">
          <Settings className="text-slate-700" size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">{t('settings')}</h2>
          <p className="text-slate-500 text-sm">Manage preferences</p>
        </div>
      </div>
      
      {/* Configuration Card - Clean Style */}
      <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-white/50 shadow-sm overflow-hidden">
        
        {/* Language Section */}
        <div className="p-6 border-b border-slate-100">
           <div className="flex items-center gap-2 mb-4">
              <Globe size={18} className="text-indigo-500" />
              <h3 className="text-lg font-bold text-slate-800">{t('language')}</h3>
           </div>
           <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {(['en', 'bs', 'de', 'it'] as Language[]).map(lang => (
                <button
                  key={lang}
                  onClick={() => setLanguage(lang)}
                  className={`py-3 rounded-xl text-sm font-bold border-2 transition-all ${
                    language === lang 
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700' 
                      : 'border-transparent bg-slate-50 text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  {lang.toUpperCase()}
                </button>
              ))}
           </div>
        </div>

        {/* Rate Section */}
        <div className="p-6">
          <div className="mb-4">
            <h3 className="text-lg font-bold text-slate-800">{t('config')}</h3>
            <p className="text-sm text-slate-500">{t('currentRate')}</p>
          </div>
          
          <div className="flex items-center max-w-xs">
              <span className="inline-flex items-center px-4 py-3 rounded-l-2xl border border-r-0 border-slate-200 bg-slate-50 text-slate-500 font-bold">
                €
              </span>
              <input
                type="number"
                step="0.01"
                value={ratePerKm}
                onChange={(e) => setRatePerKm(parseFloat(e.target.value) || 0)}
                className="flex-1 min-w-0 block w-full px-4 py-3 rounded-r-2xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:outline-none text-slate-900 font-bold text-lg"
                placeholder="0.12"
              />
          </div>
        </div>
      </div>
    </div>
  );
};