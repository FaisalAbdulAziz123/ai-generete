
import React, { useState } from 'react';
import { BookOpenText, Loader2, Copy, Check, Download, FileText, Monitor, Smartphone, Square, ChevronDown, ChevronUp, Palette, Languages } from 'lucide-react';
import { GenerationState, StoryTellingResult } from '../types';
import { ensureApiKey, generateStoryTelling } from '../services/geminiService';
import { useLanguage } from '../contexts/LanguageContext';

const ANIMATION_STYLE_GROUPS = [
  {
    category: "3D Animation Styles",
    styles: [
      "Pixar-style 3D", 
      "DreamWorks-style 3D", 
      "Disney-style 3D", 
      "Hyper-realistic 3D animation", 
      "Stylized 3D animation", 
      "Cartoon 3D animation", 
      "Claymation-style 3D", 
      "Plastic toy-style 3D", 
      "Low-poly 3D animation", 
      "Real-time game-style 3D"
    ]
  },
  {
    category: "2D Animation Styles",
    styles: [
      "Classic 2D cartoon animation", 
      "Anime style (Japanese 2D)", 
      "Studio Ghibli-style animation", 
      "Disney 2D-style (90s era)", 
      "Retro 2D animation", 
      "Flat vector animation", 
      "Paper cut-out style animation", 
      "Rubber hose animation (1920s)", 
      "Frame-by-frame hand-drawn animation"
    ]
  },
  {
    category: "Stylized / Artistic",
    styles: [
      "Watercolor animation", 
      "Oil painting animation", 
      "Sketch/doodle animation", 
      "Crayon or pastel drawing animation", 
      "Chalkboard style", 
      "Marker-style drawing animation", 
      "Collage-style animation", 
      "Comic book animation style", 
      "Ink & brush animation", 
      "Pixel art animation"
    ]
  },
  {
    category: "Stop Motion-Inspired",
    styles: [
      "Stop-motion clay animation", 
      "Lego stop-motion style", 
      "Puppet-style animation", 
      "Diorama-style animation", 
      "Paper puppet (cut-out) animation"
    ]
  },
  {
    category: "Experimental / Cinematic",
    styles: [
      "Cinematic animation with dramatic lighting", 
      "Film noir animation", 
      "Cyberpunk neon animation", 
      "Vaporwave animation", 
      "Synthwave / retro-futuristic style", 
      "Surreal animation", 
      "Dark fantasy animation", 
      "Sci-fi space animation", 
      "Low-frame surreal animation", 
      "Glitch animation style"
    ]
  },
  {
    category: "Children / Educational",
    styles: [
      "Cocomelon-style animation", 
      "Dora the Explorer-style animation", 
      "Storybook illustration style", 
      "Sesame Street-style puppets", 
      "Learning app-style animation"
    ]
  },
  {
    category: "Mixed Media / Modern",
    styles: [
      "Motion graphics animation", 
      "Whiteboard animation", 
      "Infographic animation", 
      "Kinetic typography animation", 
      "UI/UX-style explainer animation", 
      "Instagram/YouTube kids-style animation"
    ]
  }
];

const RATIOS = [
  { label: '16:9', value: '16:9', icon: Monitor },
  { label: '9:16', value: '9:16', icon: Smartphone },
  { label: '1:1', value: '1:1', icon: Square },
];

const StoryTelling: React.FC = () => {
  const { tr } = useLanguage();
  const [topic, setTopic] = useState('');
  const [customTopic, setCustomTopic] = useState('');
  const [sceneCount, setSceneCount] = useState(10);
  const [selectedRatio, setSelectedRatio] = useState('16:9');
  const [selectedStyle, setSelectedStyle] = useState(ANIMATION_STYLE_GROUPS[0].styles[0]);
  const [promptLanguage, setPromptLanguage] = useState<'id' | 'en'>('en');
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  const [status, setStatus] = useState<GenerationState>(GenerationState.IDLE);
  const [result, setResult] = useState<StoryTellingResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const handleGenerate = async () => {
    const finalTopic = customTopic.trim() || topic;
    
    if (!finalTopic) {
      setError("Please select or enter a topic.");
      return;
    }

    try {
      setStatus(GenerationState.GENERATING);
      setError(null);
      setResult(null);

      const hasKey = await ensureApiKey();
      if (!hasKey) throw new Error("API Key required.");

      const data = await generateStoryTelling(finalTopic, sceneCount, selectedStyle, promptLanguage);
      setResult(data);
      setStatus(GenerationState.COMPLETED);
    } catch (err: any) {
      setError(err.message || "Failed to generate storytelling package.");
      setStatus(GenerationState.ERROR);
    }
  };

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedSection(id);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const downloadTxt = () => {
    if (!result) return;
    
    // Format: 
    // [Ratio]
    // [Visual Description]
    // [Style]
    // (Empty Line)
    const txtContent = result.scenes.map(scene => {
        return `${selectedRatio}\n\n${scene.image_prompt}\n\n${selectedStyle}`;
    }).join('\n\n\n');

    const element = document.createElement("a");
    const file = new Blob([txtContent], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = "story_scenes.txt";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="w-full min-h-full p-4 md:p-8 animate-fade-in pb-24 bg-[#09090b]">
      
      {/* HEADER */}
      <div className="text-center mb-10">
        <h2 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 mb-2 uppercase tracking-tighter">
          {tr('storytelling.title')}
        </h2>
        <p className="text-zinc-500 text-sm font-medium tracking-widest uppercase">
          {tr('storytelling.subtitle')}
        </p>
      </div>

      {/* INPUT SECTION */}
      <div className="max-w-4xl mx-auto space-y-6 mb-12">
        
        {/* Topic Input */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-6 shadow-xl">
           <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest block mb-4">{tr('storytelling.topic_label')}</label>
           
           <input 
              type="text" 
              placeholder={tr('storytelling.topic_placeholder')} 
              value={customTopic}
              onChange={(e) => { setCustomTopic(e.target.value); setTopic(""); }}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-4 text-white placeholder-zinc-600 focus:outline-none focus:border-cyan-500 transition-colors"
           />
        </div>

        {/* Scene Count & Language */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-6 shadow-xl grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <div className="flex justify-between items-center mb-4">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">{tr('storytelling.scenes_label')}</label>
                    <span className="text-2xl font-black text-cyan-500 font-mono">{sceneCount}</span>
                </div>
                <input 
                    type="range" 
                    min="1" max="75" 
                    value={sceneCount} 
                    onChange={(e) => setSceneCount(Number(e.target.value))}
                    className="w-full accent-cyan-500 h-2 bg-zinc-700 rounded-full appearance-none cursor-pointer"
                />
            </div>
            <div>
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest block mb-4 flex items-center gap-2">
                    <Languages size={14}/> {tr('storytelling.prompt_lang_label')}
                </label>
                <div className="flex bg-zinc-950 rounded-xl p-1 border border-zinc-700">
                    <button onClick={() => setPromptLanguage('en')} className={`flex-1 py-3 text-xs font-bold rounded-lg transition-all ${promptLanguage === 'en' ? 'bg-zinc-800 text-white' : 'text-zinc-500'}`}>English (Best for AI)</button>
                    <button onClick={() => setPromptLanguage('id')} className={`flex-1 py-3 text-xs font-bold rounded-lg transition-all ${promptLanguage === 'id' ? 'bg-zinc-800 text-white' : 'text-zinc-500'}`}>Indonesia</button>
                </div>
            </div>
        </div>

        {/* Collapsible Config: Ratio & Style */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl overflow-hidden shadow-xl transition-all">
            <button 
                onClick={() => setIsConfigOpen(!isConfigOpen)}
                className="w-full p-6 flex justify-between items-center text-left hover:bg-zinc-900/50 transition-colors focus:outline-none group"
            >
                <div className="flex items-center gap-2 text-xs font-bold text-zinc-500 uppercase tracking-widest group-hover:text-cyan-400 transition-colors">
                    <Palette size={16} /> {tr('storytelling.visual_settings')}
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-[10px] font-mono text-zinc-500">{selectedRatio} • {selectedStyle}</span>
                    <div className={`transition-transform duration-300 ${isConfigOpen ? 'rotate-180' : ''}`}>
                        <ChevronDown size={16} className="text-zinc-500" />
                    </div>
                </div>
            </button>
            
            <div className={`transition-all duration-300 ease-in-out px-6 ${isConfigOpen ? 'max-h-[600px] opacity-100 pb-6' : 'max-h-0 opacity-0'}`}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-zinc-800">
                    
                    {/* Ratio Select */}
                    <div>
                        <label className="text-[10px] font-bold text-zinc-600 uppercase mb-3 block">{tr('storytelling.aspect_ratio')}</label>
                        <div className="flex gap-2">
                            {RATIOS.map(r => (
                                <button
                                    key={r.value}
                                    onClick={() => setSelectedRatio(r.value)}
                                    className={`flex-1 p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                                        selectedRatio === r.value
                                        ? 'bg-cyan-600/20 border-cyan-500 text-cyan-400' 
                                        : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-700'
                                    }`}
                                >
                                    <r.icon size={18} />
                                    <span className="text-[10px] font-bold">{r.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Style Select */}
                    <div>
                        <label className="text-[10px] font-bold text-zinc-600 uppercase mb-3 block">{tr('storytelling.visual_style')}</label>
                        <select 
                            value={selectedStyle}
                            onChange={(e) => setSelectedStyle(e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-800 text-zinc-300 text-xs rounded-xl p-3 focus:outline-none focus:border-cyan-500"
                        >
                             {ANIMATION_STYLE_GROUPS.map((group) => (
                                <optgroup key={group.category} label={group.category} className="bg-zinc-900 text-white font-bold">
                                  {group.styles.map((style) => (
                                    <option key={style} value={style} className="bg-zinc-950 text-zinc-300 font-normal">
                                      {style}
                                    </option>
                                  ))}
                                </optgroup>
                              ))}
                        </select>
                        <p className="text-[10px] text-zinc-600 mt-2 italic">{tr('storytelling.prompt_format')}</p>
                    </div>

                </div>
            </div>
        </div>

        {/* Generate Button */}
        <button
            onClick={handleGenerate}
            disabled={status === GenerationState.GENERATING}
            className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 transition-all ${
               status === GenerationState.GENERATING 
               ? 'bg-zinc-800 text-zinc-500 cursor-wait' 
               : 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white hover:shadow-lg hover:shadow-cyan-600/20 active:scale-95'
            }`}
         >
            {status === GenerationState.GENERATING ? <><Loader2 className="animate-spin"/> {tr('storytelling.btn_generating')}</> : <><BookOpenText /> {tr('storytelling.btn_generate')}</>}
         </button>
         
         {error && <div className="mt-4 p-3 bg-red-900/20 border border-red-900/50 rounded-xl text-red-400 text-xs text-center">{error}</div>}
      </div>

      {/* RESULTS SECTION */}
      {status === GenerationState.COMPLETED && result && (
          <div className="max-w-6xl mx-auto space-y-8 animate-fade-in-up">
              
              {/* Header Result */}
              <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 to-blue-500"></div>
                  <h1 className="text-2xl font-bold text-white mb-2">{result.topic}</h1>
                  <p className="text-zinc-400 text-sm">{tr('storytelling.result_success')} ({promptLanguage === 'id' ? 'Indonesia' : 'English'})</p>
              </div>

              {/* Audio Script */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-xl">
                  <div className="bg-zinc-950 p-4 border-b border-zinc-800 flex justify-between items-center">
                      <h3 className="text-white font-bold text-sm uppercase tracking-widest flex items-center gap-2">
                        <FileText size={16} className="text-cyan-500"/> {tr('storytelling.audio_script')}
                      </h3>
                      <button 
                        onClick={() => copyToClipboard(result.audio_narration_script, 'script')} 
                        className="flex items-center gap-2 text-[10px] font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white px-3 py-1.5 rounded-lg transition-all border border-zinc-700"
                      >
                         {copiedSection === 'script' ? <Check size={12} className="text-green-500" /> : <Copy size={12}/>} 
                         {copiedSection === 'script' ? tr('common.copied') : tr('common.copy')}
                      </button>
                  </div>
                  <div className="p-6 bg-zinc-900/50">
                      <p className="text-zinc-300 leading-relaxed whitespace-pre-wrap font-serif text-lg">{result.audio_narration_script}</p>
                  </div>
              </div>

              {/* Combined TXT File Downloader */}
              <div className="bg-gradient-to-r from-cyan-900/20 to-blue-900/20 border border-cyan-500/30 rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                 <div>
                    <h3 className="text-xl font-bold text-white mb-1">{tr('storytelling.download_all')}</h3>
                    <p className="text-cyan-200/60 text-sm">{tr('storytelling.download_desc')}</p>
                    <p className="text-[10px] text-cyan-200/40 mt-1 font-mono">{tr('storytelling.prompt_format')}</p>
                 </div>
                 <button 
                    onClick={downloadTxt}
                    className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg shadow-cyan-900/50 transition-all"
                 >
                    <Download size={18} /> {tr('common.download')} .TXT
                 </button>
              </div>

              {/* Scene Previews (Scrollable) */}
              <div className="space-y-4">
                  <h3 className="text-zinc-500 font-bold text-xs uppercase tracking-widest pl-2">{tr('storytelling.scene_preview')} ({result.scenes.length})</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     {result.scenes.map((scene, idx) => (
                        <div key={idx} className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl hover:border-zinc-700 transition-colors">
                           <div className="flex justify-between items-start mb-2">
                              <span className="text-cyan-500 text-[10px] font-black uppercase tracking-widest">{tr('animation.scene')} {scene.scene_number}</span>
                              <button 
                                onClick={() => copyToClipboard(`${selectedRatio} ${scene.image_prompt} ${selectedStyle}`, `s-${idx}`)}
                                className="text-zinc-600 hover:text-white transition-colors"
                              >
                                {copiedSection === `s-${idx}` ? <Check size={14} className="text-green-500"/> : <Copy size={14}/>}
                              </button>
                           </div>
                           <p className="text-zinc-400 text-xs font-mono leading-relaxed">{scene.image_prompt}</p>
                        </div>
                     ))}
                  </div>
              </div>

          </div>
      )}

    </div>
  );
};

export default StoryTelling;
