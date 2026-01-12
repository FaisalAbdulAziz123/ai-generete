
import React, { useState } from 'react';
import { Sparkles, Loader2, Copy, BookOpen, Film, User, FileText, Check, Video } from 'lucide-react';
import { GenerationState, StoryPlan } from '../types';
import { ensureApiKey, generateStoryPlan } from '../services/geminiService';

const TOPICS = {
  "DAILY LIFE": ["School Life & Friends", "Grandparent & Grandchild", "Big City Teenager", "Happy Family", "Hard Work & Success", "Light Romance", "Indonesian UMKM Story", "Funny Neighbors"],
  "KIDS EDUCATION": ["Learning Numbers", "Colors & Shapes", "Manners & Etiquette", "Basic Health", "Moral Stories (Honesty, etc.)", "Cute Animals Learning"],
  "ADVENTURE": ["Indonesian Forest", "Futuristic Jakarta", "Fantasy World", "Underwater", "Animal Rescue Mission", "Nusantara Mythology"],
  "MOTIVATION": ["Turning Life Around", "Rising from Failure", "Small Business Journey", "Finding Oneself", "Journey to Success"],
  "HORROR / MYSTERY": ["Remote Village Mystery", "Haunted School", "Indonesian Urban Legend", "Creepy Empty House"],
  "COMEDY": ["Talking Cat Life", "Local Superhero Parody", "Office Comedy", "Funny Family Parody"]
};

const STYLES = {
  "2D ANIMATION": [
    "Traditional 2D (Hand-Drawn)", "Digital 2D Animation", "Anime / Manga Style", 
    "Cartoon Network Style", "Disney Modern 2D", "Flat Illustrative", 
    "Minimalist Vector", "Chibi Style", "Sketch / Pencil Animation", "Watercolor 2D"
  ],
  "3D ANIMATION": [
    "Pixar / Disney 3D", "DreamWorks 3D Style", "Hyper-Realistic 3D", 
    "Claymation 3D", "3D Plasticine Clay", "3D Low-Poly", 
    "3D High-Poly Ultra Detail", "3D Game Cinematic", "Isometric 3D"
  ],
  "STOP-MOTION": [
    "Classic Clay (Wallace & Gromit)", "Paper Cut Stop Motion", 
    "Puppet Animation", "Miniature Diorama"
  ],
  "MIXED MEDIA": [
    "Mixed 2D + 3D Hybrid", "Live Action + Animated Overlay", 
    "Photoreal + Stylized BG", "Collage Animation", "Cutout Animation"
  ],
  "STYLIZED & SOCIAL": [
    "Liquid Motion", "Motion Graphics Infographic", "Kinetic Typography", 
    "Minimalist Motion Logo", "Parallax 2.5D", "Neon Glow", 
    "Cyberpunk Animation", "Doodle / Scribble", "Bold Vector Instagram"
  ],
  "AI-FIRST (2025+)": [
    "AI Surreal Animation", "AI Photoreal Transition", "AI Smooth Morphing", 
    "Cinematic AI Video", "Hyper-Stylized Dreamcore", "Studio Ghibli AI", 
    "Vintage Cartoon (AI Enhanced)"
  ],
  "BRANDED / TOY": ["LEGO Animation Style", "ROBLOX Animation Style"]
};

const StoryGenerator: React.FC = () => {
  const [selectedTopic, setSelectedTopic] = useState("");
  const [customTopic, setCustomTopic] = useState("");
  const [selectedStyle, setSelectedStyle] = useState("");
  const [sceneCount, setSceneCount] = useState(5);
  const [status, setStatus] = useState<GenerationState>(GenerationState.IDLE);
  const [plan, setPlan] = useState<StoryPlan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'character' | 'script' | 'scenes'>('character');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleGenerate = async () => {
    const topic = customTopic.trim() || selectedTopic;
    if (!topic || !selectedStyle) {
      setError("Please select a topic and style.");
      return;
    }

    try {
      setStatus(GenerationState.GENERATING);
      setError(null);
      const hasKey = await ensureApiKey();
      if (!hasKey) throw new Error("API Key required.");
      const result = await generateStoryPlan(topic, selectedStyle, sceneCount);
      setPlan(result);
      setStatus(GenerationState.COMPLETED);
    } catch (err: any) {
      setError(err.message || "Failed to generate story plan.");
      setStatus(GenerationState.ERROR);
    }
  };

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  return (
    <div className="w-full min-h-full p-4 md:p-8 animate-fade-in pb-20 relative">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-zinc-500 mb-2">
          Story Animation Generator
        </h2>
        <p className="text-zinc-400 text-sm">
          Auto-generate characters, scripts, and scene prompts for your next viral video.
        </p>
      </div>

      <div className="max-w-4xl mx-auto space-y-8">
        <div className="bg-zinc-900/50 p-6 rounded-2xl border border-zinc-800">
          <label className="block text-sm font-bold text-white mb-4 uppercase tracking-wider">1. Choose Story Topic</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-60 overflow-y-auto pr-2 custom-scrollbar mb-4">
            {Object.entries(TOPICS).map(([category, items]) => (
              <div key={category}>
                <h4 className="text-xs text-zinc-500 font-bold mb-2">{category}</h4>
                <div className="space-y-1">
                  {items.map(item => (
                    <button
                      key={item}
                      onClick={() => { setSelectedTopic(item); setCustomTopic(""); }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${selectedTopic === item ? 'bg-zinc-700 text-white font-medium' : 'text-zinc-400 hover:bg-zinc-800'}`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <input 
            type="text" 
            placeholder="Or type your own custom topic..." 
            value={customTopic}
            onChange={(e) => { setCustomTopic(e.target.value); setSelectedTopic(""); }}
            className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-3 text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
          />
        </div>

        <div className="bg-zinc-900/50 p-6 rounded-2xl border border-zinc-800">
          <label className="block text-sm font-bold text-white mb-4 uppercase tracking-wider">2. Choose Animation Style</label>
          <div className="space-y-6 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {Object.entries(STYLES).map(([category, items]) => (
              <div key={category}>
                <h4 className="text-xs text-zinc-500 font-bold mb-3 uppercase tracking-widest">{category}</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {items.map(item => (
                    <button
                      key={item}
                      onClick={() => setSelectedStyle(item)}
                      className={`px-3 py-2.5 rounded-xl text-[11px] font-medium border transition-all ${selectedStyle === item ? 'bg-white text-black border-white' : 'bg-transparent text-zinc-400 border-zinc-700 hover:border-zinc-500'}`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-zinc-900/50 p-6 rounded-2xl border border-zinc-800">
           <label className="block text-sm font-bold text-white mb-4 uppercase tracking-wider">3. Number of Scenes: <span className="text-white text-lg ml-2">{sceneCount}</span></label>
           <input 
              type="range" 
              min="1" 
              max="20" 
              value={sceneCount} 
              onChange={(e) => setSceneCount(Number(e.target.value))}
              className="w-full accent-white cursor-pointer"
           />
        </div>

        <div className="space-y-4">
          <button
            onClick={handleGenerate}
            disabled={status === GenerationState.GENERATING}
            className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-3 transition-all ${
              status === GenerationState.GENERATING ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600/20'
            }`}
          >
             {status === GenerationState.GENERATING ? <><Loader2 className="animate-spin"/> Processing...</> : <><BookOpen /> Generate Story Plan</>}
          </button>
          
          {status === GenerationState.GENERATING && (
            <div className="flex flex-col items-center gap-2 animate-fade-in pt-2">
                <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-blue-500 h-full animate-progress-fast"></div>
                </div>
                <span className="text-xs text-zinc-500 font-medium">PLOW AI is drafting your story, designing characters, and creating scene prompts...</span>
            </div>
          )}
        </div>

        {error && <div className="text-red-400 text-center text-sm">{error}</div>}
      </div>

      {status === GenerationState.COMPLETED && plan && (
        <div className="max-w-5xl mx-auto animate-fade-in-up mt-12">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b border-zinc-800 pb-6">
             <div>
                <h1 className="text-3xl font-bold text-white mb-1">{plan.title}</h1>
                <p className="text-zinc-400 text-sm">{selectedStyle} Style • {plan.scenes?.length || 0} Scenes Production Plan</p>
             </div>
             <button onClick={() => setStatus(GenerationState.IDLE)} className="px-4 py-2 bg-zinc-800 text-zinc-300 rounded-lg hover:text-white transition-colors text-sm">Create New</button>
          </div>

          <div className="flex gap-2 mb-6 bg-zinc-900/50 p-1 rounded-xl w-fit border border-zinc-800">
             <button onClick={() => setActiveTab('character')} className={`px-4 py-2 text-sm font-medium flex items-center gap-2 rounded-lg transition-all ${activeTab === 'character' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}><User size={16}/> Character</button>
             <button onClick={() => setActiveTab('script')} className={`px-4 py-2 text-sm font-medium flex items-center gap-2 rounded-lg transition-all ${activeTab === 'script' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}><FileText size={16}/> Full Script</button>
             <button onClick={() => setActiveTab('scenes')} className={`px-4 py-2 text-sm font-medium flex items-center gap-2 rounded-lg transition-all ${activeTab === 'scenes' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}><Film size={16}/> Storyboard</button>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 min-h-[400px] shadow-2xl">
             {activeTab === 'character' && plan.character && (
               <div className="animate-fade-in">
                  <div className="flex items-start justify-between mb-6">
                     <div>
                        <h3 className="text-2xl font-bold text-white">{plan.character.name}</h3>
                        <span className="text-xs px-2 py-1 bg-blue-900/30 text-blue-400 rounded border border-blue-900/50 mt-1 inline-block uppercase font-bold tracking-widest">{plan.character.age}</span>
                     </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="space-y-4">
                        {['Personality', 'Physical Traits', 'Outfit'].map((key) => (
                           <div key={key} className="bg-zinc-950 p-4 rounded-xl border border-zinc-800">
                              <span className="text-zinc-500 text-[10px] uppercase font-bold block mb-1 tracking-widest">{key}</span>
                              <p className="text-zinc-200 text-sm">{(plan.character as any)[key.charAt(0).toLowerCase() + key.slice(1).replace(' ', '')]}</p>
                           </div>
                        ))}
                     </div>
                     <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 flex flex-col">
                        <div className="flex justify-between items-center mb-3">
                            <span className="text-yellow-500 text-[10px] uppercase font-bold tracking-widest">Character Visual Prompt</span>
                            <button onClick={() => copyToClipboard(plan.character.visualPrompt, 'char')} className="text-zinc-500 hover:text-white p-1.5 bg-zinc-900 rounded-lg transition-colors">
                                {copiedId === 'char' ? <Check size={16} className="text-green-500" /> : <Copy size={16}/>}
                            </button>
                        </div>
                        <p className="text-zinc-400 text-sm font-mono leading-relaxed p-4 bg-zinc-900 rounded-lg border border-zinc-800 flex-1">{plan.character.visualPrompt}</p>
                     </div>
                  </div>
               </div>
             )}

             {activeTab === 'script' && (
                <div className="animate-fade-in whitespace-pre-wrap text-zinc-300 leading-relaxed font-serif text-lg p-4 bg-zinc-950 rounded-xl border border-zinc-800">
                   {plan.script}
                </div>
             )}

             {activeTab === 'scenes' && plan.scenes && (
                <div className="space-y-12 animate-fade-in">
                   {plan.scenes.map((scene) => (
                     <div key={scene.number} className="relative">
                        <div className="flex items-center gap-4 mb-4">
                            <span className="text-white font-black bg-zinc-800 px-3 py-1.5 rounded-lg text-xs tracking-tighter shadow-lg">SCENE {scene.number}</span>
                            <div className="h-px bg-zinc-800 flex-1"></div>
                            <span className="text-zinc-400 font-bold text-sm uppercase tracking-wide">{scene.title}</span>
                        </div>
                        
                        <p className="text-zinc-500 italic text-sm mb-6 pl-2 border-l-2 border-zinc-800">
                           "{scene.description}"
                        </p>

                        <div className="bg-black p-6 rounded-2xl border border-zinc-800 shadow-xl group hover:border-blue-900/50 transition-colors relative">
                            <div className="flex justify-between items-center mb-4 border-b border-zinc-900 pb-4">
                                <div className="flex items-center gap-2">
                                   <Video size={16} className="text-blue-500" />
                                   <span className="text-blue-400 text-[10px] uppercase font-black tracking-[0.2em]">🎬 FULL VIDEO PROMPT + DIALOG</span>
                                </div>
                                <button onClick={() => copyToClipboard(scene.unifiedPrompt, `scene-${scene.number}`)} className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 rounded-lg text-zinc-400 hover:text-white transition-all hover:bg-zinc-800 border border-zinc-800 text-xs font-bold">
                                   {copiedId === `scene-${scene.number}` ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                                   {copiedId === `scene-${scene.number}` ? "Copied" : "Copy Prompt"}
                                </button>
                            </div>
                            <div className="text-zinc-300 font-mono text-xs leading-relaxed tracking-wide">
                               {scene.unifiedPrompt}
                            </div>
                        </div>
                     </div>
                   ))}
                </div>
             )}
          </div>
        </div>
      )}
    </div>
  );
};

export default StoryGenerator;
