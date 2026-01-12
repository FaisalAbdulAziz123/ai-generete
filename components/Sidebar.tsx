
import React from 'react';
import { LayoutDashboard, Image, Mic, Settings, LogOut, ScanFace, Clapperboard, BookOpenText } from 'lucide-react';
import { AppView, UserProfile } from '../types';
import { Logo } from './Logo';
import { useLanguage } from '../contexts/LanguageContext';

interface SidebarProps {
  currentView: AppView;
  setView: (view: AppView) => void;
  userProfile?: UserProfile;
  onLogout: () => void;
  isOpen: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setView, userProfile, onLogout, isOpen }) => {
  const { tr } = useLanguage();

  const navItems = [
    { id: AppView.DASHBOARD, label: tr('sidebar.dashboard'), icon: LayoutDashboard },
    { id: AppView.IMAGE, label: tr('sidebar.image'), icon: Image },
    { id: AppView.VOICE, label: tr('sidebar.voice'), icon: Mic },
    { id: AppView.CLONING, label: tr('sidebar.cloning'), icon: ScanFace },
    { id: AppView.ANIMATION_STORY, label: tr('sidebar.animation'), icon: Clapperboard },
    { id: AppView.STORY_TELLING, label: 'Story Telling', icon: BookOpenText },
  ];

  return (
    <aside 
      className={`
        h-screen w-[100px] bg-[#0D0D0D] border-r border-white/5 flex flex-col items-center py-6 flex-shrink-0 shadow-2xl
        /* Mobile: Fixed position (overlays content, doesn't take layout space when closed) */
        fixed inset-y-0 left-0 z-[100]
        /* Desktop: Relative position (pushes content) */
        md:relative md:z-auto
        /* Animation & State */
        transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}
    >
      
      {/* --- HEADER --- */}
      <div className="flex flex-col items-center mb-6 w-full pt-8 md:pt-0">
         {/* Changed background to Navy Blue */}
         <div className="w-[60px] h-[60px] bg-[#0F172A] rounded-full flex items-center justify-center border border-blue-900/30 shadow-[0_0_20px_rgba(30,58,138,0.3)] mb-5 group cursor-pointer hover:scale-105 transition-transform duration-300">
            <Logo className="w-8 h-8 text-white group-hover:text-blue-400 transition-colors" />
         </div>
         {/* Divider */}
         <div className="w-8 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
      </div>

      {/* --- MENU ITEMS --- */}
      <nav className="flex-1 w-full px-2 space-y-3 flex flex-col items-center overflow-y-auto scrollbar-hide">
        {navItems.map((item) => {
           const isActive = currentView === item.id;
           return (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`w-full aspect-[1/0.9] flex flex-col items-center justify-center gap-1.5 rounded-2xl transition-all duration-300 group relative overflow-hidden ${
                isActive 
                  ? 'bg-gradient-to-br from-blue-600 to-purple-700 shadow-[0_0_15px_rgba(79,70,229,0.5)] translate-y-[-2px]' 
                  : 'hover:bg-white/5'
              }`}
            >
              {isActive && (
                  <div className="absolute inset-0 bg-white/10 mix-blend-overlay pointer-events-none"></div>
              )}
              
              <item.icon 
                size={20} 
                className={`transition-transform duration-300 group-hover:scale-110 ${
                    isActive ? 'text-white drop-shadow-md' : 'text-zinc-400 group-hover:text-white'
                }`}
                strokeWidth={isActive ? 2.5 : 2}
              />
              
              <span className={`text-[9px] font-medium tracking-wide transition-colors ${
                  isActive ? 'text-white' : 'text-zinc-500 group-hover:text-zinc-300'
              }`}>
                {item.label}
              </span>
            </button>
           );
        })}
      </nav>

      {/* --- BOTTOM SECTION --- */}
      <div className="w-full px-2 flex flex-col items-center gap-3 mt-auto pt-4 border-t border-white/5 bg-[#0D0D0D]">
        
        {/* Profile Section with Logout Popup */}
        {userProfile && (
           <div className="relative w-full group flex justify-center">
               <div className="w-full p-1.5 rounded-2xl bg-zinc-900/40 border border-white/5 flex flex-col items-center gap-1 cursor-pointer hover:bg-zinc-800/50 transition-colors">
                  <div className="w-8 h-8 rounded-full p-[1.5px] bg-gradient-to-tr from-blue-500 to-purple-500">
                      <div className="w-full h-full rounded-full bg-black overflow-hidden">
                        {userProfile.avatarUrl ? (
                            <img src={userProfile.avatarUrl} alt="User" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-zinc-800 text-[9px] font-bold text-white">
                                {userProfile.username.slice(0, 2).toUpperCase()}
                            </div>
                        )}
                      </div>
                  </div>
                  <span className="text-[9px] font-bold text-zinc-400 group-hover:text-white truncate max-w-full px-1">
                     {userProfile.username}
                  </span>
               </div>

               {/* Logout Popup */}
               <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-[60]">
                   <button 
                      onClick={onLogout}
                      className="flex items-center gap-2 bg-red-600 text-white px-3 py-2 rounded-xl text-xs font-bold shadow-xl hover:bg-red-700 transition-colors"
                   >
                      <LogOut size={12} /> {tr('settings.logout')}
                   </button>
                   {/* Arrow */}
                   <div className="w-2 h-2 bg-red-600 rotate-45 absolute -bottom-1 left-1/2 -translate-x-1/2"></div>
               </div>
           </div>
        )}

        {/* Settings */}
        <button
          onClick={() => setView(AppView.SETTINGS)}
          className={`w-full py-2.5 flex flex-col items-center justify-center gap-1 rounded-2xl transition-all duration-300 group ${
            currentView === AppView.SETTINGS 
               ? 'bg-zinc-800 text-white shadow-lg' 
               : 'text-zinc-500 hover:text-white hover:bg-white/5'
          }`}
        >
          <Settings 
             size={18} 
             className={`transition-transform duration-300 group-hover:rotate-45 ${currentView === AppView.SETTINGS ? 'text-white' : ''}`}
          />
          <span className="text-[8px] font-medium uppercase tracking-wider">{tr('sidebar.settings')}</span>
        </button>

      </div>
    </aside>
  );
};

export default Sidebar;
