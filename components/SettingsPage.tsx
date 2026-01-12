
import React, { useState, useEffect, useRef } from 'react';
import { User, Mail, Lock, Check, Save, Camera, AlertCircle, Loader2, Moon, Sun, Trash2, ShieldAlert, Plus, X, LogOut, Globe, ChevronDown, Key, Zap } from 'lucide-react';
import { UserProfile } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { languages } from '../services/translations';
import { getStoredApiKey, setStoredApiKey, getStoredGroqKey, setStoredGroqKey } from '../services/geminiService';

interface SettingsPageProps {
  user: UserProfile;
  onUpdateUser: (newUser: UserProfile) => void;
  onDeleteAccount: () => void;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ user, onUpdateUser, onDeleteAccount }) => {
  const { tr, setLanguage } = useLanguage();
  
  // --- STATE ---
  const [username, setUsername] = useState(user.username);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  // API Key States
  const [geminiKey, setGeminiKey] = useState('');
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  
  const [groqKey, setGroqKey] = useState('');
  const [showGroqKey, setShowGroqKey] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state if prop changes
  useEffect(() => {
    setUsername(user.username);
    setGeminiKey(getStoredApiKey());
    setGroqKey(getStoredGroqKey());
  }, [user.username]);

  // --- HANDLERS ---

  // 1. Photo Upload
  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onUpdateUser({ ...user, avatarUrl: reader.result as string });
        showSuccess("Profile picture updated");
      };
      reader.readAsDataURL(file);
    }
  };

  // 2. Username Save
  const handleUsernameSave = () => {
    setError(null);
    setSuccessMsg(null);
    setIsLoading(true);

    setTimeout(() => {
      if (!username || username.length < 3) {
        setError("Username must be at least 3 characters long.");
        setIsLoading(false);
        return;
      }
      const usernameRegex = /^[a-zA-Z0-9_-]+$/;
      if (!usernameRegex.test(username)) {
        setError("Username can only contain letters, numbers, underscores (_), or dashes (-).");
        setIsLoading(false);
        return;
      }
      onUpdateUser({ ...user, username });
      showSuccess("Username updated successfully");
      setIsEditing(false);
      setIsLoading(false);
    }, 600);
  };
  
  // API Key Save
  const handleApiKeysSave = () => {
      setStoredApiKey(geminiKey);
      setStoredGroqKey(groqKey);
      showSuccess("API Keys updated successfully.");
  };

  // 3. Theme Toggle
  const toggleTheme = (theme: 'dark' | 'light') => {
    onUpdateUser({ ...user, theme });
  };
  
  // 3.5 Language Toggle
  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLang = e.target.value;
    setLanguage(newLang); // Update Context immediately for reactive UI
    onUpdateUser({ ...user, language: newLang }); // Persist to profile
    showSuccess("Your app language has been updated.");
  };

  // 5. Safety Toggle
  const toggleAdult = () => {
    onUpdateUser({ ...user, isAdult: !user.isAdult });
  };

  // Helper
  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-start p-6 md:p-12 animate-fade-in overflow-y-auto pb-24 dark:text-zinc-100 text-zinc-900">
      
      <div className="w-full max-w-2xl">
        <h2 className="text-3xl font-bold mb-2">{tr('settings.title')}</h2>
        <p className="text-zinc-500 mb-8 dark:text-zinc-400">{tr('settings.subtitle')}</p>

        {/* --- CARD 1: PROFILE & THEME & LANGUAGE --- */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 shadow-sm mb-6 relative overflow-hidden transition-colors">
          
          {/* Decorative Blur */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

          {/* Avatar Section */}
          <div className="flex flex-col items-center mb-10 relative z-10">
             <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
            <div 
                onClick={handleFileClick}
                className="relative group cursor-pointer"
            >
              <div className="w-28 h-28 rounded-full bg-gradient-to-br from-blue-600 to-purple-700 p-[2px] shadow-lg shadow-purple-500/20">
                 <div className="w-full h-full rounded-full bg-white dark:bg-zinc-950 flex items-center justify-center overflow-hidden relative">
                    {user.avatarUrl ? (
                        <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                        <span className="text-3xl font-bold dark:text-white text-zinc-800 tracking-widest">
                            {user.username ? user.username.slice(0, 2).toUpperCase() : 'US'}
                        </span>
                    )}
                    
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera size={24} className="text-white" />
                    </div>
                 </div>
              </div>
              <div className="absolute bottom-0 right-0 bg-zinc-800 p-1.5 rounded-full border-2 border-zinc-900 text-white shadow-sm">
                  <Plus size={14} />
              </div>
            </div>
            <h3 className="mt-4 text-xl font-bold">{user.username}</h3>
            <span className="text-zinc-500 text-sm">PLOW AI Creator</span>
          </div>

          <div className="space-y-6 relative z-10">
            {/* Email Field */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                <Mail size={12} /> Email Address
              </label>
              <div className="relative group">
                <input 
                  type="email" 
                  value={user.email} 
                  disabled 
                  className="w-full bg-zinc-100 dark:bg-zinc-950/50 border border-zinc-300 dark:border-zinc-800 text-zinc-500 rounded-xl px-4 py-3 pl-11 focus:outline-none cursor-not-allowed opacity-75"
                />
                <div className="absolute left-4 top-3.5 text-zinc-400">
                  <Lock size={16} />
                </div>
              </div>
            </div>

            {/* Username Field */}
            <div className="space-y-2">
               <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                    <User size={12} /> Username
                  </label>
               </div>
              <div className="relative">
                <input 
                  type="text" 
                  value={username} 
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if(!isEditing) setIsEditing(true);
                    if(error) setError(null);
                  }}
                  className={`w-full bg-white dark:bg-zinc-950 border rounded-xl px-4 py-3 pl-11 focus:outline-none focus:ring-2 transition-all ${
                    error 
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
                      : 'border-zinc-300 dark:border-zinc-800 focus:border-blue-500 focus:ring-blue-500/20'
                  }`}
                />
                <div className="absolute left-4 top-3.5 text-zinc-400">
                  <User size={16} />
                </div>
              </div>
              {error && <div className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle size={12}/>{error}</div>}
            </div>

            {/* --- LANGUAGE SETTINGS --- */}
             <div className="pt-6 border-t border-zinc-200 dark:border-zinc-800">
                <h4 className="text-sm font-bold flex items-center gap-2 mb-1">
                    <Globe size={16} className="text-blue-500"/> {tr('settings.language')}
                </h4>
                <p className="text-xs text-zinc-500 mb-4">{tr('settings.language_desc')}</p>
                
                <div className="relative">
                    <select
                        value={user.language}
                        onChange={handleLanguageChange}
                        className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 appearance-none focus:outline-none focus:border-blue-500 transition-colors text-sm font-medium"
                    >
                        {languages.map((lang) => (
                            <option key={lang.code} value={lang.code}>
                                {lang.flag} {lang.name}
                            </option>
                        ))}
                    </select>
                    <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none"/>
                </div>
             </div>

            {/* Theme & Save Action Row */}
            <div className="pt-6 flex flex-col md:flex-row items-center justify-between border-t border-zinc-200 dark:border-zinc-800 mt-6 gap-4">
               
               {/* Theme Toggle */}
               <div className="flex bg-zinc-100 dark:bg-zinc-950 p-1 rounded-lg border border-zinc-200 dark:border-zinc-800">
                  <button 
                    onClick={() => toggleTheme('light')}
                    className={`p-2 rounded-md flex items-center gap-2 text-xs font-medium transition-all ${user.theme === 'light' ? 'bg-white text-black shadow-sm' : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'}`}
                  >
                    <Sun size={14} /> Light
                  </button>
                  <button 
                    onClick={() => toggleTheme('dark')}
                    className={`p-2 rounded-md flex items-center gap-2 text-xs font-medium transition-all ${user.theme === 'dark' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'}`}
                  >
                    <Moon size={14} /> Dark
                  </button>
               </div>

               {/* Save Button */}
               <button
                  onClick={handleUsernameSave}
                  disabled={!isEditing || isLoading || username === user.username}
                  className={`px-6 py-2.5 rounded-xl font-medium text-sm flex items-center gap-2 transition-all ${
                    !isEditing || username === user.username
                      ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed'
                      : 'bg-black dark:bg-white text-white dark:text-black hover:opacity-90 shadow-lg'
                  }`}
               >
                  {isLoading ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : <><Save size={16} /> {tr('settings.save')}</>}
               </button>
            </div>
             {successMsg && (
                  <div className="flex items-center gap-2 text-green-500 text-sm justify-end animate-fade-in-up">
                      <Check size={14} /> {successMsg}
                  </div>
              )}
          </div>
        </div>
        
        {/* --- CARD 2: API CONFIGURATION (TWO COLUMNS) --- */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 shadow-sm mb-6 transition-colors">
            <h3 className="text-lg font-bold mb-1 flex items-center gap-2">
                <Key size={18} className="text-purple-500" /> API Configuration
            </h3>
            <p className="text-zinc-500 text-xs mb-6">
                Manage your API Keys. These are stored locally in your browser for security.
            </p>
            
            <div className="space-y-6">
                
                {/* GEMINI KEY */}
                <div className="space-y-2">
                    <label className="text-xs font-bold text-blue-500 uppercase tracking-wider flex items-center gap-2">
                         Google Gemini API Key
                    </label>
                    <div className="relative">
                        <input 
                            type={showGeminiKey ? "text" : "password"}
                            value={geminiKey}
                            onChange={(e) => setGeminiKey(e.target.value)}
                            placeholder="Starts with AIza..."
                            className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 pl-11 focus:outline-none focus:border-blue-500 transition-colors font-mono text-sm"
                        />
                        <div className="absolute left-4 top-3.5 text-zinc-400">
                            <Key size={16} />
                        </div>
                        <button 
                            onClick={() => setShowGeminiKey(!showGeminiKey)}
                            className="absolute right-4 top-3.5 text-xs font-bold text-zinc-500 hover:text-blue-500 uppercase"
                        >
                            {showGeminiKey ? "Hide" : "Show"}
                        </button>
                    </div>
                </div>

                {/* GROQ KEY */}
                <div className="space-y-2">
                     <label className="text-xs font-bold text-orange-500 uppercase tracking-wider flex items-center gap-2">
                         Groq Cloud API Key
                    </label>
                    <div className="relative">
                        <input 
                            type={showGroqKey ? "text" : "password"}
                            value={groqKey}
                            onChange={(e) => setGroqKey(e.target.value)}
                            placeholder="Starts with gsk_..."
                            className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 pl-11 focus:outline-none focus:border-orange-500 transition-colors font-mono text-sm"
                        />
                        <div className="absolute left-4 top-3.5 text-zinc-400">
                            <Zap size={16} />
                        </div>
                        <button 
                            onClick={() => setShowGroqKey(!showGroqKey)}
                            className="absolute right-4 top-3.5 text-xs font-bold text-zinc-500 hover:text-orange-500 uppercase"
                        >
                            {showGroqKey ? "Hide" : "Show"}
                        </button>
                    </div>
                </div>
                
                <div className="flex justify-end pt-2">
                    <button
                        onClick={handleApiKeysSave}
                        className="px-6 py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-xl font-bold text-sm hover:opacity-90 shadow-lg transition-all active:scale-95 flex items-center gap-2"
                    >
                        <Save size={16} /> Update All Keys
                    </button>
                </div>
            </div>
        </div>

        {/* --- CARD 3: ACCOUNT ACTIONS --- */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 shadow-sm mb-6 transition-colors">
             <h3 className="text-lg font-bold mb-4">{tr('settings.account_actions')}</h3>
             
             {/* Logout Button */}
             <div className="flex items-center justify-between mb-8 pb-8 border-b border-zinc-200 dark:border-zinc-800">
                <div>
                   <h4 className="font-bold text-sm mb-1">{tr('settings.logout')}</h4>
                   <p className="text-xs text-zinc-500">Sign out of your account on this device.</p>
                </div>
                <button 
                  onClick={onDeleteAccount} // Reusing the reset function for logout based on App.tsx structure
                  className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2"
                >
                   <LogOut size={16} /> {tr('settings.logout')}
                </button>
             </div>

             {/* Safety Toggle */}
             <div className="flex items-start justify-between mb-8 pb-8 border-b border-zinc-200 dark:border-zinc-800">
                <div>
                    <h4 className="font-bold text-sm mb-1 flex items-center gap-2">
                        <ShieldAlert size={16} className="text-orange-500"/> Safety Control
                    </h4>
                    <p className="text-zinc-500 text-xs max-w-sm leading-relaxed">
                        I confirm that I am over 18 and understand that I may encounter explicit or mature content.
                    </p>
                </div>
                
                {/* Toggle Switch */}
                <button 
                    onClick={toggleAdult}
                    className={`w-12 h-7 rounded-full p-1 transition-colors duration-300 ease-in-out ${user.isAdult ? 'bg-green-500' : 'bg-zinc-200 dark:bg-zinc-800'}`}
                >
                    <div className={`w-5 h-5 bg-white rounded-full shadow-sm transform transition-transform duration-300 ease-in-out ${user.isAdult ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
            </div>

            {/* Danger Zone: Delete Account */}
            <div className="bg-red-50 dark:bg-red-950/10 border border-red-100 dark:border-red-900/30 rounded-2xl p-6">
                <h4 className="text-sm font-bold text-red-600 dark:text-red-400 mb-2">Danger Zone</h4>
                <p className="text-zinc-600 dark:text-red-200/60 text-xs mb-4">
                    Deleting your account will permanently remove all data.
                </p>
                <button 
                    onClick={() => setShowDeleteModal(true)}
                    className="px-4 py-2 bg-white dark:bg-red-900/20 border border-red-200 dark:border-red-500/50 text-red-600 dark:text-red-400 rounded-lg text-xs font-bold hover:bg-red-50 dark:hover:bg-red-900/40 transition-colors flex items-center gap-2"
                >
                    <Trash2 size={14} /> {tr('settings.delete')}
                </button>
            </div>
        </div>

      </div>

      {/* --- DELETE MODAL --- */}
      {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 max-w-md w-full shadow-2xl scale-100 animate-fade-in-up">
                  <div className="flex items-center gap-3 text-red-500 mb-4">
                      <AlertCircle size={32} />
                      <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Are you sure?</h3>
                  </div>
                  <p className="text-zinc-600 dark:text-zinc-400 mb-8 leading-relaxed">
                      You are about to permanently delete your account <strong>{user.username}</strong>. All generated videos, images, and history will be lost forever.
                  </p>
                  <div className="flex gap-3 justify-end">
                      <button 
                        onClick={() => setShowDeleteModal(false)}
                        className="px-4 py-2 rounded-lg text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                      >
                          Cancel
                      </button>
                      <button 
                        onClick={onDeleteAccount}
                        className="px-4 py-2 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition-colors shadow-lg shadow-red-500/20"
                      >
                          Yes, Delete My Account
                      </button>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};

export default SettingsPage;
