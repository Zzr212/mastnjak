import React, { useState } from 'react';
import { Settings, Globe, Download, Upload, Loader2, CheckCircle2 } from 'lucide-react';
import { Language, getTranslation } from '../utils/translations';

interface SettingsViewProps {
  ratePerKm: number;
  setRatePerKm: (rate: number) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ ratePerKm, setRatePerKm, language, setLanguage }) => {
  const t = (key: any) => getTranslation(language, key);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/backup', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `driver-dashboard-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export backup:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportClick = () => {
    const fileInput = document.getElementById('backup-upload');
    if (fileInput) fileInput.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm('Warning: This will override all your current daily entries and notes with the backup data. Continue?')) {
      return e.target.value = '';
    }

    setIsImporting(true);
    setImportStatus('idle');

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const contents = event.target?.result as string;
          const backupData = JSON.parse(contents);
          
          if (!backupData.logs || !Array.isArray(backupData.logs)) {
             throw new Error("Invalid backup format");
          }

          const token = localStorage.getItem('token');
          const res = await fetch('/api/backup', {
             method: 'POST',
             headers: { 
               'Content-Type': 'application/json',
               'Authorization': `Bearer ${token}`
             },
             body: JSON.stringify(backupData)
          });
          
          if (res.ok) {
             setImportStatus('success');
             setTimeout(() => {
                window.location.reload(); // Reload to refresh all data in App.tsx
             }, 1500);
          } else {
             throw new Error("Failed to restore");
          }
        } catch (err) {
           console.error(err);
           setImportStatus('error');
        }
      };
      reader.readAsText(file);
    } catch (err) {
       console.error(err);
       setImportStatus('error');
    } finally {
       setIsImporting(false);
       e.target.value = ''; // clear input
    }
  };

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
              {(['en', 'bs', 'de', 'it', 'sl'] as Language[]).map(lang => (
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
        <div className="p-6 border-b border-slate-100">
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

        {/* Backup Section */}
        <div className="p-6">
          <div className="mb-4">
            <h3 className="text-lg font-bold text-slate-800">Data Backup</h3>
            <p className="text-sm text-slate-500">Download or restore your dashboard data.</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <button 
              onClick={handleExport}
              disabled={isExporting}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl font-bold transition-colors shadow-sm"
            >
              {isExporting ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} className="text-slate-500" />}
              Save Backup
            </button>
            
            <button 
              onClick={handleImportClick}
              disabled={isImporting}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 text-white rounded-xl font-bold transition-colors shadow-sm ${
                importStatus === 'success' ? 'bg-emerald-500' : 'bg-slate-800 hover:bg-slate-700'
              }`}
            >
              {isImporting ? <Loader2 size={18} className="animate-spin" /> : 
               importStatus === 'success' ? <CheckCircle2 size={18} /> : 
               <Upload size={18} />}
              {importStatus === 'success' ? 'Restored!' : 'Restore Backup'}
            </button>
            <input 
               type="file" 
               id="backup-upload" 
               accept=".json" 
               className="hidden" 
               onChange={handleFileChange}
            />
          </div>
          {importStatus === 'error' && (
             <p className="text-red-500 text-sm mt-3 text-center">Failed to restore backup. Ensure it's a valid JSON file.</p>
          )}
        </div>
      </div>
    </div>
  );
};