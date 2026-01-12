
import React, { useState, useEffect, useRef } from 'react';
import { AppView, UserProfile } from './types';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import TextToImage from './components/TextToImage';
import VoiceGenerator from './components/VoiceGenerator';
import CloningExtractor from './components/CloningExtractor';
import AnimationStoryBuilder from './components/AnimationStoryBuilder';
import StoryTelling from './components/StoryTelling';
import SettingsPage from './components/SettingsPage';
import LoginPage from './components/LoginPage';
import { Menu, X, Key, Save, Zap, Check, Lock, ShieldAlert } from 'lucide-react';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { getStoredApiKey, setStoredApiKey, getStoredGroqKey, setStoredGroqKey, setActiveProvider, getActiveProvider } from './services/geminiService';
import { Logo } from './components/Logo';

// --- INTERNAL COMPONENT: API KEY ENFORCER (LOCK SCREEN) ---
const ApiKeyEnforcer: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const { tr } = useLanguage();
  const [geminiKey, setGeminiKey] = useState('');
  const [groqKey, setGroqKey] = useState('');
  const [activeProviderState, setActiveProviderState] = useState<'gemini' | 'groq'>('gemini');
  const [error, setError] = useState<string | null>(null);

  const handleSave = () => {
    if (!geminiKey && activeProviderState === 'gemini') {
      setError("Google Gemini API Key is required to continue.");
      return;
    }
    if (!groqKey && activeProviderState === 'groq') {
      setError("Groq API Key is required if selected as active.");
      return;
    }

    setStoredApiKey(geminiKey);
    setStoredGroqKey(groqKey);
    setActiveProvider(activeProviderState);
    onComplete();
  };

  return (
    <div className="w-full h-screen bg-[#09090b] flex items-center justify-center p-4 relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-900/10 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-900/10 rounded-full blur-[120px] pointer-events-none"></div>

        <div className="max-w-md w-full bg-zinc-950 border border-zinc-800 rounded-3xl p-8 shadow-2xl relative z-10 animate-fade-in-up">
            <div className="flex flex-col items-center mb-8">
                <div className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center border border-zinc-800 shadow-xl mb-4 text-white">
                   <Lock size={32} />
                </div>
                <h1 className="text-2xl font-bold text-white">Setup Required</h1>
                <p className="text-zinc-500 text-sm text-center mt-2">
                   This application requires a personal API Key to function. Your key is stored locally in your browser.
                </p>
            </div>

            <div className="space-y-4">
                 {/* Provider Selection */}
                 <div className="grid grid-cols-2 gap-3 mb-4">
                    <button 
                       onClick={() => setActiveProviderState('gemini')}
                       className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${activeProviderState === 'gemini' ? 'bg-blue-900/20 border-blue-600 text-blue-400' : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:bg-zinc-800'}`}
                    >
                       <span className="text-[10px] font-bold uppercase tracking-widest">Google Gemini</span>
                       {activeProviderState === 'gemini' && <Check size={14} />}
                    </button>
                    <button 
                       onClick={() => setActiveProviderState('groq')}
                       className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${activeProviderState === 'groq' ? 'bg-orange-900/20 border-orange-600 text-orange-400' : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:bg-zinc-800'}`}
                    >
                       <span className="text-[10px] font-bold uppercase tracking-widest">Groq Cloud</span>
                       {activeProviderState === 'groq' && <Check size={14} />}
                    </button>
                 </div>

                 {/* Gemini Input */}
                 <div className={`space-y-2 transition-opacity ${activeProviderState === 'gemini' ? 'opacity-100' : 'opacity-50'}`}>
                    <label className="text-xs font-bold text-blue-500 uppercase tracking-wider flex items-center gap-2">
                         Google Gemini Key {activeProviderState === 'gemini' && '*'}
                    </label>
                    <div className="relative">
                        <input 
                            type="password"
                            value={geminiKey}
                            onChange={(e) => setGeminiKey(e.target.value)}
                            placeholder="Starts with AIza..."
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 pl-11 text-white focus:outline-none focus:border-blue-500 transition-colors font-mono text-sm"
                        />
                        <Key size={16} className="absolute left-4 top-3.5 text-zinc-500" />
                    </div>
                </div>

                {/* Groq Input */}
                <div className={`space-y-2 transition-opacity ${activeProviderState === 'groq' ? 'opacity-100' : 'opacity-50'}`}>
                     <label className="text-xs font-bold text-orange-500 uppercase tracking-wider flex items-center gap-2">
                         Groq Cloud Key {activeProviderState === 'groq' && '*'}
                    </label>
                    <div className="relative">
                        <input 
                            type="password"
                            value={groqKey}
                            onChange={(e) => setGroqKey(e.target.value)}
                            placeholder="Starts with gsk_..."
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 pl-11 text-white focus:outline-none focus:border-orange-500 transition-colors font-mono text-sm"
                        />
                        <Zap size={16} className="absolute left-4 top-3.5 text-zinc-500" />
                    </div>
                </div>

                {error && (
                    <div className="p-3 bg-red-900/20 border border-red-900/50 rounded-xl flex items-center gap-2 text-red-400 text-xs">
                        <ShieldAlert size={14} /> {error}
                    </div>
                )}

                <button 
                    onClick={handleSave}
                    className="w-full py-4 bg-white text-black rounded-xl font-bold text-sm hover:bg-zinc-200 transition-colors mt-4 flex items-center justify-center gap-2 shadow-lg shadow-white/10"
                >
                    <Save size={16} /> Save & Launch App
                </button>

                <p className="text-[10px] text-zinc-600 text-center mt-4">
                    You can change these keys later in Settings.
                </p>
            </div>
        </div>
    </div>
  );
};


const App: React.FC = () => {
  // Default to Dashboard view
  const [currentView, setView] = useState<AppView>(AppView.DASHBOARD);
  
  // Mobile Menu State
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // API Key State (Gatekeeper)
  const [hasApiKey, setHasApiKey] = useState<boolean>(!!getStoredApiKey());
  
  // Authentication State - CHECK LOGIN FIRST
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  
  // Default User Profile
  const [userProfile, setUserProfile] = useState<UserProfile>({
    username: 'Creator',
    email: 'user@plow.ai',
    theme: 'dark',
    language: 'en',
    interests: [],
    isAdult: false
  });

  const mainRef = useRef<HTMLElement>(null);

  // Check for existing saved preferences on mount
  useEffect(() => {
    // Check Login Status FIRST
    const savedUser = localStorage.getItem("plow_user_data");
    const authToken = localStorage.getItem("plow_auth_token");
    
    if (savedUser && authToken) {
      try {
        const parsed = JSON.parse(savedUser);
        setUserProfile({
          username: parsed.username || 'Creator',
          email: parsed.email || 'user@plow.ai',
          theme: parsed.theme || 'dark',
          language: parsed.language || 'en',
          interests: Array.isArray(parsed.interests) ? parsed.interests : [],
          isAdult: !!parsed.isAdult,
          avatarUrl: parsed.avatarUrl
        });
        setIsLoggedIn(true);
      } catch (error) {
        console.error("Failed to parse user profile", error);
        localStorage.removeItem("plow_user_data");
        localStorage.removeItem("plow_auth_token");
        setIsLoggedIn(false);
      }
    }
    
    // Check API Key existence on mount
    setHasApiKey(!!getStoredApiKey());
  }, []);

  // Handle Theme Toggle Effect
  useEffect(() => {
    const root = window.document.documentElement;
    if (userProfile.theme === 'dark') {
      root.classList.add('dark');
      document.body.style.backgroundColor = '#09090b';
    } else {
      root.classList.remove('dark');
      document.body.style.backgroundColor = '#fafafa';
    }
  }, [userProfile.theme]);

  // Scroll to top when view changes
  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTop = 0;
    }
  }, [currentView]);

  // Handle Profile Updates
  const handleUpdateUser = (newUser: UserProfile) => {
    setUserProfile(newUser);
    localStorage.setItem("plow_user_data", JSON.stringify(newUser));
  };

  // Handle Reset (Logout)
  const handleReset = () => {
    localStorage.removeItem("plow_user_data");
    localStorage.removeItem("plow_auth_token");
    
    // Reset to defaults
    setUserProfile({
      username: 'Creator',
      email: 'user@plow.ai',
      theme: 'dark',
      language: 'en',
      interests: [],
      isAdult: false
    });
    
    setIsLoggedIn(false);
    
    // Reset theme
    const root = window.document.documentElement;
    root.classList.add('dark');
    document.body.style.backgroundColor = '#09090b';
    
    setView(AppView.DASHBOARD);
    setIsMobileMenuOpen(false);
  };

  // Handle Login Success
  const handleLoginSuccess = (user: UserProfile) => {
    setUserProfile(user);
    setIsLoggedIn(true);
  };

  // Wrapper to close mobile menu on selection
  const handleSetView = (view: AppView) => {
    setView(view);
    setIsMobileMenuOpen(false);
  };

  // Callback when API key is set via the Enforcer
  const handleApiKeySet = () => {
    setHasApiKey(true);
  };

  // Check if we need to show lock screen (only if NO API Key is present)
  // We wrap everything in LanguageProvider so the internal components can use it, 
  // but ApiKeyEnforcer also needs it.

  return (
    <LanguageProvider initialLanguage={userProfile.language}>
      {/* STEP 1: LOGIN PAGE - If not logged in, show login */}
      {!isLoggedIn ? (
        <LoginPage onLoginSuccess={handleLoginSuccess} />
      ) : (
        // STEP 2: MAIN APP - After login, show main app directly
        <div className={`flex h-screen bg-zinc-50 dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 font-sans overflow-hidden transition-colors duration-300 relative`}>
          
          {/* Mobile Menu Toggle Button */}
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden fixed top-4 left-4 z-[110] p-2.5 bg-zinc-900/80 border border-zinc-700/50 rounded-xl text-white backdrop-blur-md shadow-lg active:scale-95 transition-all"
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          {/* Mobile Overlay Backdrop */}
          {isMobileMenuOpen && (
            <div 
              className="fixed inset-0 bg-black/60 z-[90] md:hidden backdrop-blur-sm animate-fade-in"
              onClick={() => setIsMobileMenuOpen(false)}
            />
          )}

          {/* Sidebar with User Profile */}
          <Sidebar 
            currentView={currentView} 
            setView={handleSetView} 
            userProfile={userProfile}
            onLogout={handleReset}
            isOpen={isMobileMenuOpen}
          />

          {/* Main Content */}
          <main 
            ref={mainRef}
            className="flex-1 w-full h-full overflow-y-auto relative scroll-smooth pt-16 md:pt-0"
          >
            {/* We keep all components mounted but hidden to preserve state/results */}
            
            <div className={currentView === AppView.DASHBOARD ? 'block min-h-full' : 'hidden'}>
              <Dashboard user={userProfile} setView={handleSetView} />
            </div>

            <div className={currentView === AppView.IMAGE ? 'block min-h-full' : 'hidden'}>
              <TextToImage />
            </div>

            <div className={currentView === AppView.VOICE ? 'block min-h-full' : 'hidden'}>
              <VoiceGenerator />
            </div>

            <div className={currentView === AppView.CLONING ? 'block min-h-full' : 'hidden'}>
              <CloningExtractor />
            </div>

            <div className={currentView === AppView.ANIMATION_STORY ? 'block min-h-full' : 'hidden'}>
              <AnimationStoryBuilder />
            </div>

            <div className={currentView === AppView.STORY_TELLING ? 'block min-h-full' : 'hidden'}>
              <StoryTelling />
            </div>
            
            <div className={currentView === AppView.SETTINGS ? 'block min-h-full' : 'hidden'}>
                <SettingsPage 
                    user={userProfile} 
                    onUpdateUser={handleUpdateUser} 
                    onDeleteAccount={handleReset}
                />
            </div>

          </main>

        </div>
      )}
    </LanguageProvider>
  );
};

export default App;
