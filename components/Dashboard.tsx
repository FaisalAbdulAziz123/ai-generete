
import React, { useState, useEffect } from 'react';
import { AppView, ChatMessage, UserProfile } from '../types';
import SmartChat from './SmartChat';
import { Image as ImageIcon, ArrowRight, Zap, Mic, ScanFace, Clapperboard, BookOpenText, Key, X, Save, Check } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { getStoredApiKey, setStoredApiKey, getStoredGroqKey, setStoredGroqKey, getActiveProvider, setActiveProvider } from '../services/geminiService';

interface DashboardProps {
  user: UserProfile;
  setView: (view: AppView) => void;
  userProfile?: UserProfile;
}

const Dashboard: React.FC<DashboardProps> = ({ user, setView }) => {
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const { tr } = useLanguage();

  // API Key Modal State
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [geminiKey, setGeminiKey] = useState('');
  const [groqKey, setGroqKey] = useState('');
  const [activeProviderState, setActiveProviderState] = useState<'gemini' | 'groq'>('gemini');

  useEffect(() => {
    if (isApiKeyModalOpen) {
      setGeminiKey(getStoredApiKey());
      setGroqKey(getStoredGroqKey());
      setActiveProviderState(getActiveProvider());
    }
  }, [isApiKeyModalOpen]);

  const handleSaveKeys = () => {
    setStoredApiKey(geminiKey);
    setStoredGroqKey(groqKey);
    setActiveProvider(activeProviderState);
    setIsApiKeyModalOpen(false);
  };

  const tools = [
    { 
      id: AppView.IMAGE, 
      label: tr('sidebar.image'), 
      desc: tr('dashboard.image_desc'), 
      icon: ImageIcon, 
      color: 'text-purple-400', 
      bg: 'bg-purple-400/10 hover:bg-purple-400/20' 
    },
    {
      id: AppView.VOICE,
      label: tr('sidebar.voice'),
      desc: tr('dashboard.voice_desc'),
      icon: Mic,
      color: 'text-orange-400',
      bg: 'bg-orange-400/10 hover:bg-orange-400/20'
    },
    {
      id: AppView.CLONING,
      label: tr('sidebar.cloning'),
      desc: tr('dashboard.clone_desc'),
      icon: ScanFace,
      color: 'text-emerald-400',
      bg: 'bg-emerald-400/10 hover:bg-emerald-400/20'
    },
    {
      id: AppView.ANIMATION_STORY,
      label: tr('sidebar.animation'),
      desc: tr('dashboard.animation_desc'),
      icon: Clapperboard,
      color: 'text-pink-400',
      bg: 'bg-pink-400/10 hover:bg-pink-400/20'
    },
    {
      id: AppView.STORY_TELLING,
      label: 'Story Telling',
      desc: tr('dashboard.storytelling_desc'),
      icon: BookOpenText,
      color: 'text-cyan-400',
      bg: 'bg-cyan-400/10 hover:bg-cyan-400/20'
    }
  ];

  return (
    <div className="w-full max-w-7xl mx-auto p-4 md:p-8 animate-fade-in pb-20">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">
            {tr('dashboard.welcome')}, {user.username}
          </h1>
          <p className="text-zinc-400 text-sm flex items-center gap-2">
            <Zap size={14} className="text-yellow-400 fill-yellow-400" />
            {tr('dashboard.plan')}
          </p>
        </div>

        {/* API Settings Button - Top Right */}
        <button 
          onClick={() => setIsApiKeyModalOpen(true)}
          className="flex flex-col items-center gap-1 p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
        >
          <div className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center">
             <Key size={14} />
          </div>
          <span className="text-[9px] font-bold uppercase tracking-wider">{tr('dashboard.api_settings')}</span>
        </button>
      </div>

      {/* Tools Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        {tools.map((tool) => {
          const Icon = tool.icon;
          return (
            <button
              key={tool.id}
              onClick={() => setView(tool.id)}
              className={`flex flex-col items-start p-4 rounded-2xl border border-zinc-800 transition-all group text-left ${tool.bg}`}
            >
              <div className={`p-2 rounded-lg bg-zinc-950 mb-3 ${tool.color}`}>
                <Icon size={20} />
              </div>
              <span className="text-white font-semibold text-sm mb-1">{tool.label}</span>
              <span className="text-zinc-500 text-xs">{tool.desc}</span>
              <div className="mt-3 opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-[-10px] group-hover:translate-x-0 duration-300">
                <ArrowRight size={14} className="text-white" />
              </div>
            </button>
          );
        })}
      </div>

      <div className="border-t border-zinc-800 pt-8">
         <SmartChat history={chatHistory} setHistory={setChatHistory} />
      </div>

      {/* API Key Modal */}
      {isApiKeyModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
           <div className="bg-zinc-950 border border-zinc-800 rounded-3xl w-full max-w-lg shadow-2xl animate-fade-in-up overflow-hidden">
              
              {/* Modal Header */}
              <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
                 <div>
                    <h3 className="text-xl font-bold text-white">{tr('dashboard.configure_api')}</h3>
                    <p className="text-xs text-zinc-500 mt-1">{tr('dashboard.select_provider')}</p>
                 </div>
                 <button onClick={() => setIsApiKeyModalOpen(false)} className="p-2 bg-zinc-900 rounded-full text-zinc-500 hover:text-white transition-colors">
                    <X size={16} />
                 </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-4">
                 
                 {/* Gemini Option */}
                 <div 
                    onClick={() => setActiveProviderState('gemini')}
                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                       activeProviderState === 'gemini' 
                       ? 'bg-blue-900/10 border-blue-600' 
                       : 'bg-zinc-900/50 border-zinc-800 hover:bg-zinc-900'
                    }`}
                 >
                    <div className="flex justify-between items-center mb-3">
                       <span className={`text-sm font-bold uppercase tracking-widest ${activeProviderState === 'gemini' ? 'text-blue-500' : 'text-zinc-500'}`}>Google Gemini</span>
                       {activeProviderState === 'gemini' && <Check size={16} className="text-blue-500" />}
                    </div>
                    <input 
                       type="password"
                       value={geminiKey}
                       onChange={(e) => setGeminiKey(e.target.value)}
                       placeholder={tr('dashboard.enter_key')}
                       className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-3 text-white text-xs font-mono focus:outline-none focus:border-blue-500 transition-colors"
                       onClick={(e) => e.stopPropagation()} // Prevent triggering container click
                    />
                 </div>

                 {/* Groq Option */}
                 <div 
                    onClick={() => setActiveProviderState('groq')}
                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                       activeProviderState === 'groq' 
                       ? 'bg-orange-900/10 border-orange-600' 
                       : 'bg-zinc-900/50 border-zinc-800 hover:bg-zinc-900'
                    }`}
                 >
                    <div className="flex justify-between items-center mb-3">
                       <span className={`text-sm font-bold uppercase tracking-widest ${activeProviderState === 'groq' ? 'text-orange-500' : 'text-zinc-500'}`}>Groq Cloud</span>
                       {activeProviderState === 'groq' && <Check size={16} className="text-orange-500" />}
                    </div>
                    <input 
                       type="password"
                       value={groqKey}
                       onChange={(e) => setGroqKey(e.target.value)}
                       placeholder={tr('dashboard.enter_key')}
                       className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-3 text-white text-xs font-mono focus:outline-none focus:border-orange-500 transition-colors"
                       onClick={(e) => e.stopPropagation()}
                    />
                 </div>

              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-zinc-800 flex justify-end gap-3">
                  <button onClick={() => setIsApiKeyModalOpen(false)} className="px-5 py-2.5 rounded-xl text-xs font-bold text-zinc-400 hover:bg-zinc-900 transition-colors">
                     {tr('common.cancel')}
                  </button>
                  <button onClick={handleSaveKeys} className="px-5 py-2.5 rounded-xl text-xs font-bold bg-white text-black hover:bg-zinc-200 transition-colors flex items-center gap-2">
                     <Save size={14} /> {tr('common.save')}
                  </button>
              </div>

           </div>
        </div>
      )}

    </div>
  );
};

export default Dashboard;
