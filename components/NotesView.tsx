import React, { useState } from 'react';
import { Plus, Trash2, CheckCircle2 } from 'lucide-react';
import { Language, getTranslation } from '../utils/translations';
import { CustomDatePicker } from './CustomDatePicker';

interface Note {
  id: number;
  content: string;
  reminder_date: string;
}

interface NotesViewProps {
  notes: Note[];
  onAddNote: (content: string, date: string) => void;
  onDeleteNote: (id: number) => void;
  lang: Language;
}

export const NotesView: React.FC<NotesViewProps> = ({ notes, onAddNote, onDeleteNote, lang }) => {
  const [content, setContent] = useState('');
  const [date, setDate] = useState('');

  const todayStr = new Date().toISOString().split('T')[0];
  const t = (key: any) => getTranslation(lang, key);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (content.trim() && date) {
      onAddNote(content, date);
      setContent('');
      setDate('');
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 bg-white/50 backdrop-blur rounded-2xl shadow-sm border border-slate-200/50">
          <CheckCircle2 className="text-slate-700" size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">{t('notes')}</h2>
          <p className="text-slate-500 text-sm">Reminders & Tasks</p>
        </div>
      </div>

      {/* Input Area - Transparent/Glass style */}
      <div className="bg-white/60 backdrop-blur-md border border-white/20 rounded-3xl p-6 shadow-sm">
         <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <input 
              type="text" 
              placeholder={t('notePlaceholder')}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full bg-transparent text-lg placeholder-slate-400 border-b-2 border-slate-200 focus:border-indigo-500 focus:outline-none py-2 transition-colors"
            />
            <div className="flex items-center gap-2">
               <div className="w-full max-w-[200px]">
                  <CustomDatePicker 
                     value={date} 
                     onChange={setDate} 
                     lang={lang} 
                  />
               </div>
               
               <button 
                 type="submit"
                 disabled={!content || !date}
                 className="ml-auto bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl p-3 shadow-lg shadow-indigo-200 transition-all active:scale-95 disabled:opacity-50 disabled:shadow-none"
               >
                 <Plus size={20} />
               </button>
            </div>
         </form>
      </div>

      {/* Notes List */}
      <div className="space-y-4">
        {notes.length === 0 ? (
          <div className="text-center py-10 opacity-50">
            <p>{t('noNotes')}</p>
          </div>
        ) : (
          notes.map((note) => {
            const isToday = note.reminder_date === todayStr;
            const isPast = note.reminder_date < todayStr;
            
            return (
              <div 
                key={note.id} 
                className={`group relative p-5 rounded-2xl border transition-all duration-300 ${
                  isToday 
                    ? 'bg-white border-indigo-200 shadow-md shadow-indigo-50' 
                    : 'bg-white/40 border-slate-100 hover:bg-white'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className={`text-lg font-medium ${isPast ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                      {note.content}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                       <span className={`text-xs font-bold px-2 py-1 rounded-md ${
                         isToday ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'
                       }`}>
                         {new Date(note.reminder_date).toLocaleDateString()}
                       </span>
                       {isToday && <span className="flex h-2 w-2 rounded-full bg-indigo-500 animate-pulse"></span>}
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => onDeleteNote(note.id)}
                    className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};