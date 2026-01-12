
import React, { useState, useRef } from 'react';
import { 
  Clapperboard, Upload, Image as ImageIcon, Loader2, Play, Download, 
  Copy, Check, RefreshCw, Film, SlidersHorizontal, Trash2, MessageSquare, Languages
} from 'lucide-react';
import { GenerationState, AnimationStoryResult, AnimationScene } from '../types';
import { ensureApiKey, generateAnimationScenes, generateImages } from '../services/geminiService';
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
  { label: 'Portrait (9:16)', value: '9:16' },
  { label: 'Landscape (16:9)', value: '16:9' }
];

const AnimationStoryBuilder: React.FC = () => {
  const { tr } = useLanguage();
  
  // Input State
  const [topic, setTopic] = useState('');
  const [selectedStyle, setSelectedStyle] = useState(ANIMATION_STYLE_GROUPS[0].styles[0]);
  const [selectedRatio, setSelectedRatio] = useState(RATIOS[1].value);
  const [sceneCount, setSceneCount] = useState(5);
  const [promptLanguage, setPromptLanguage] = useState<'id' | 'en'>('en');
  const [refImage, setRefImage] = useState<File | null>(null);

  // Output State
  const [status, setStatus] = useState<GenerationState>(GenerationState.IDLE);
  const [result, setResult] = useState<AnimationStoryResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Per-Scene Image Generation State
  const [previewImages, setPreviewImages] = useState<Record<number, string>>({});
  const [generatingPreview, setGeneratingPreview] = useState<number | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setRefImage(e.target.files[0]);
    }
  };

  const handleGenerateStory = async () => {
    // Only topic is strictly required now. Reference image is optional.
    if (!topic) {
      setError("Please provide a story topic.");
      return;
    }

    try {
      setStatus(GenerationState.GENERATING);
      setError(null);
      setResult(null);
      setPreviewImages({});

      const hasKey = await ensureApiKey();
      if (!hasKey) throw new Error("API Key required.");

      const data = await generateAnimationScenes(
        topic, 
        selectedStyle, 
        selectedRatio, 
        sceneCount, 
        refImage || undefined,
        promptLanguage
      );

      setResult(data);
      setStatus(GenerationState.COMPLETED);
    } catch (err: any) {
      setError(err.message || "Failed to generate animation story.");
      setStatus(GenerationState.ERROR);
    }
  };

  const handleDialogChange = (sceneIndex: number, newDialog: string) => {
    if (!result) return;
    
    const updatedScenes = [...result.scenes];
    const scene = updatedScenes[sceneIndex];
    const oldDialog = scene.dialog;

    // 1. Update the dialogue field
    scene.dialog = newDialog;

    // 2. Automatically update the video prompt to reflect the new dialogue
    // If the old dialogue was in the prompt, replace it. Otherwise, append the new one.
    if (scene.image_to_video_prompt.includes(oldDialog)) {
        scene.image_to_video_prompt = scene.image_to_video_prompt.replace(oldDialog, newDialog);
    } else {
        // Fallback: Append specifically formatted text
        // Clean any existing "speaking" suffix if we are appending multiple times (basic heuristic)
        const basePrompt = scene.image_to_video_prompt.split(' says:')[0]; 
        scene.image_to_video_prompt = `${basePrompt} says: "${newDialog}"`;
    }

    setResult({ ...result, scenes: updatedScenes });
  };

  const handleGeneratePreview = async (scene: AnimationScene) => {
    try {
      setGeneratingPreview(scene.scene_number);
      // Generate image using the scene's visual prompt AND selected ratio
      const res = await generateImages(scene.visual_prompt, undefined, selectedRatio);
      setPreviewImages(prev => ({
        ...prev,
        [scene.scene_number]: res.url
      }));
    } catch (err) {
      console.error("Failed to generate preview", err);
    } finally {
      setGeneratingPreview(null);
    }
  };

  const handleDownloadImage = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const downloadJSON = () => {
    if (!result) return;
    const jsonString = JSON.stringify(result, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `animation-story-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full min-h-full p-4 md:p-8 animate-fade-in pb-24 bg-[#09090b]">
      
      {/* HEADER */}
      <div className="text-center mb-10">
        <h2 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 mb-2 uppercase tracking-tighter">
          {tr('animation.title')}
        </h2>
        <p className="text-zinc-500 text-sm font-medium tracking-widest uppercase">
          {tr('animation.subtitle')}
        </p>
      </div>

      {/* INPUT SECTION */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
        
        {/* Left: Configuration */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-6 shadow-xl">
             <div className="flex items-center gap-2 mb-4 text-purple-400">
                <SlidersHorizontal size={18} />
                <span className="text-xs font-black uppercase tracking-widest">{tr('animation.settings')}</span>
             </div>
             
             <div className="space-y-5">
                <div>
                   <label className="text-xs text-zinc-500 font-bold block mb-2">{tr('animation.topic')}</label>
                   <input 
                      type="text" 
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      placeholder={tr('animation.topic_placeholder')}
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-3 text-white focus:outline-none focus:border-purple-500 transition-colors"
                   />
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div>
                      <label className="text-xs text-zinc-500 font-bold block mb-2">{tr('animation.style')}</label>
                      <select 
                        value={selectedStyle}
                        onChange={(e) => setSelectedStyle(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-3 text-white focus:outline-none focus:border-purple-500"
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
                   </div>
                   <div>
                      <label className="text-xs text-zinc-500 font-bold block mb-2">{tr('animation.ratio')}</label>
                      <div className="flex bg-zinc-950 rounded-xl p-1 border border-zinc-700">
                         {RATIOS.map(r => (
                            <button
                              key={r.value}
                              onClick={() => setSelectedRatio(r.value)}
                              className={`flex-1 text-[10px] font-bold py-2 rounded-lg transition-all ${selectedRatio === r.value ? 'bg-zinc-800 text-white shadow' : 'text-zinc-500 hover:text-zinc-300'}`}
                            >
                               {r.label}
                            </button>
                         ))}
                      </div>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="flex justify-between mb-2">
                        <label className="text-xs text-zinc-500 font-bold">{tr('animation.scenes')}</label>
                        <span className="text-xs text-white font-bold">{sceneCount} {tr('animation.scene')}</span>
                    </div>
                    <input 
                        type="range" 
                        min="3" max="30" 
                        value={sceneCount}
                        onChange={(e) => setSceneCount(Number(e.target.value))}
                        className="w-full accent-purple-500 h-2 bg-zinc-700 rounded-full appearance-none cursor-pointer"
                    />
                  </div>
                  <div>
                     <label className="text-xs text-zinc-500 font-bold block mb-2 flex items-center gap-2"><Languages size={12}/> {tr('animation.prompt_lang')}</label>
                     <div className="flex bg-zinc-950 rounded-xl p-1 border border-zinc-700">
                         <button onClick={() => setPromptLanguage('en')} className={`flex-1 py-2 text-[10px] font-bold rounded-lg transition-all ${promptLanguage === 'en' ? 'bg-zinc-800 text-white' : 'text-zinc-500'}`}>English</button>
                         <button onClick={() => setPromptLanguage('id')} className={`flex-1 py-2 text-[10px] font-bold rounded-lg transition-all ${promptLanguage === 'id' ? 'bg-zinc-800 text-white' : 'text-zinc-500'}`}>Indonesia</button>
                     </div>
                  </div>
                </div>
             </div>
          </div>
        </div>

        {/* Right: Character Reference */}
        <div className="lg:col-span-4">
           <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-6 shadow-xl h-full flex flex-col">
              <div className="flex items-center gap-2 mb-4 text-pink-400">
                <ImageIcon size={18} />
                <span className="text-xs font-black uppercase tracking-widest">{tr('animation.char_ref')}</span>
              </div>
              
              <div className={`
                 flex-1 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center relative overflow-hidden transition-all
                 ${refImage ? 'border-purple-500/50 bg-zinc-950' : 'border-zinc-700 bg-zinc-950/50 hover:bg-zinc-900'}
              `}>
                 <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    className="hidden" 
                    accept="image/*"
                 />
                 
                 {refImage ? (
                    <>
                       <img src={URL.createObjectURL(refImage)} alt="Ref" className="w-full h-full object-cover absolute inset-0 opacity-60" />
                       <div className="absolute inset-0 flex flex-col items-center justify-center z-10 p-4 bg-black/40 backdrop-blur-[2px]">
                          <p className="text-white text-xs font-bold mb-2 text-center">{refImage.name}</p>
                          <button 
                             onClick={(e) => { e.stopPropagation(); setRefImage(null); }}
                             className="p-2 bg-red-600 rounded-full text-white hover:bg-red-700"
                          >
                             <Trash2 size={16} />
                          </button>
                       </div>
                    </>
                 ) : (
                    <div onClick={() => fileInputRef.current?.click()} className="text-center cursor-pointer p-6">
                       <div className="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-3 text-zinc-500">
                          <Upload size={20} />
                       </div>
                       <p className="text-xs text-zinc-400 font-bold uppercase">{tr('animation.upload_char')}</p>
                       <p className="text-[10px] text-zinc-600 mt-1">{tr('animation.upload_desc')}</p>
                    </div>
                 )}
              </div>
           </div>
        </div>

      </div>

      {/* GENERATE BUTTON */}
      <div className="max-w-md mx-auto mb-16">
         <button
            onClick={handleGenerateStory}
            disabled={status === GenerationState.GENERATING || !topic}
            className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 transition-all ${
               status === GenerationState.GENERATING 
               ? 'bg-zinc-800 text-zinc-500 cursor-wait' 
               : 'bg-gradient-to-r from-pink-600 to-purple-600 text-white hover:shadow-lg hover:shadow-purple-600/20 active:scale-95'
            }`}
         >
            {status === GenerationState.GENERATING ? <><Loader2 className="animate-spin"/> {tr('animation.btn_generating')}</> : <><Clapperboard /> {tr('animation.btn_generate')}</>}
         </button>
         {error && <div className="mt-4 p-3 bg-red-900/20 border border-red-900/50 rounded-xl text-red-400 text-xs text-center">{error}</div>}
      </div>

      {/* RESULTS SECTION */}
      {status === GenerationState.COMPLETED && result && (
         <div className="max-w-7xl mx-auto animate-fade-in-up space-y-8">
            
            {/* Project Header */}
            <div className="bg-zinc-950 border border-zinc-800 rounded-[2rem] p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
               <div>
                  <h1 className="text-2xl font-bold text-white mb-2">{result.title}</h1>
                  <p className="text-zinc-400 text-sm italic">"{result.logline}"</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                     <span className="px-3 py-1 bg-zinc-900 rounded-lg text-[10px] font-bold text-zinc-500 uppercase border border-zinc-800">
                        {result.scenes.length} {tr('animation.scene')}
                     </span>
                     <span className="px-3 py-1 bg-zinc-900 rounded-lg text-[10px] font-bold text-zinc-500 uppercase border border-zinc-800">
                        {selectedStyle}
                     </span>
                     <span className="px-3 py-1 bg-zinc-900 rounded-lg text-[10px] font-bold text-zinc-500 uppercase border border-zinc-800">
                        {selectedRatio}
                     </span>
                     <span className="px-3 py-1 bg-zinc-900 rounded-lg text-[10px] font-bold text-zinc-500 uppercase border border-zinc-800">
                        {promptLanguage === 'id' ? 'Indonesia' : 'English'}
                     </span>
                  </div>
               </div>
               <div className="flex gap-3">
                  <button onClick={downloadJSON} className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-bold border border-zinc-800 flex items-center gap-2 transition-colors">
                     <Download size={14} /> JSON
                  </button>
                  <button onClick={() => setStatus(GenerationState.IDLE)} className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-bold border border-zinc-800 flex items-center gap-2 transition-colors">
                     <RefreshCw size={14} /> {tr('common.new')}
                  </button>
               </div>
            </div>
            
            {/* Consistency Note */}
            <div className="bg-purple-900/10 border border-purple-500/20 rounded-2xl p-4">
               <h4 className="text-xs font-black text-purple-400 uppercase tracking-widest mb-1">{tr('animation.consistency')}</h4>
               <p className="text-zinc-300 text-xs leading-relaxed">{result.character_consistency_notes}</p>
            </div>

            {/* Scenes Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
               {result.scenes.map((scene, index) => (
                  <div key={scene.scene_number} className="bg-zinc-900/50 border border-zinc-800 rounded-3xl overflow-hidden hover:border-purple-500/30 transition-all group">
                     
                     {/* Preview Image Area */}
                     <div className={`w-full bg-black relative ${selectedRatio === '9:16' ? 'aspect-[9/16]' : 'aspect-video'}`}>
                        {previewImages[scene.scene_number] ? (
                           <>
                             <img 
                                src={previewImages[scene.scene_number]} 
                                alt={`Scene ${scene.scene_number}`} 
                                className="w-full h-full object-cover"
                             />
                             {/* DOWNLOAD BUTTON */}
                             <button
                               onClick={() => handleDownloadImage(previewImages[scene.scene_number], `scene-${scene.scene_number}.png`)}
                               className="absolute top-4 right-4 p-2 bg-zinc-900/80 backdrop-blur-sm rounded-lg text-white hover:bg-blue-600 hover:text-white transition-all border border-zinc-700 shadow-lg z-20"
                               title="Download Preview"
                             >
                               <Download size={16} />
                             </button>
                           </>
                        ) : (
                           <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-zinc-600">
                              <ImageIcon size={32} className="mb-2 opacity-20" />
                              <p className="text-[10px] uppercase font-bold tracking-widest opacity-50">{tr('common.preview')} Not Generated</p>
                           </div>
                        )}

                        {/* Generate Preview Button */}
                        <div className={`absolute inset-0 bg-black/60 transition-opacity flex items-center justify-center backdrop-blur-sm ${previewImages[scene.scene_number] ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'}`}>
                           <button 
                              onClick={() => handleGeneratePreview(scene)}
                              disabled={generatingPreview === scene.scene_number}
                              className="px-4 py-2 bg-white text-black rounded-full text-xs font-bold flex items-center gap-2 hover:scale-105 transition-transform"
                           >
                              {generatingPreview === scene.scene_number ? <Loader2 size={14} className="animate-spin"/> : <ImageIcon size={14}/>}
                              {previewImages[scene.scene_number] ? tr('common.regenerate') : tr('common.preview')}
                           </button>
                        </div>

                        {/* Scene Badge */}
                        <div className="absolute top-4 left-4 px-3 py-1 bg-black/50 backdrop-blur-md rounded-lg border border-white/10 z-10">
                           <span className="text-[10px] font-black text-white uppercase tracking-widest">{tr('animation.scene')} {scene.scene_number}</span>
                        </div>
                     </div>

                     {/* Content */}
                     <div className="p-6 space-y-4">
                        <div>
                           <div className="flex justify-between items-start mb-2">
                              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{scene.camera} • {scene.mood}</span>
                              <span className="text-[10px] font-bold text-zinc-500">{scene.duration}</span>
                           </div>
                           <p className="text-sm text-white font-medium leading-snug">{scene.scene_description}</p>
                        </div>

                        {/* EDITABLE DIALOGUE BOX */}
                        <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 focus-within:border-purple-500/50 focus-within:ring-1 focus-within:ring-purple-500/20 transition-all">
                           <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1 flex items-center gap-2">
                              <MessageSquare size={10} /> {tr('animation.dialogue')}
                           </label>
                           <textarea
                              value={scene.dialog}
                              onChange={(e) => handleDialogChange(index, e.target.value)}
                              className="w-full bg-transparent text-zinc-300 text-xs italic resize-none focus:outline-none placeholder-zinc-700 min-h-[40px]"
                              placeholder="Enter dialogue here..."
                           />
                        </div>

                        {/* Prompts Actions */}
                        <div className="grid grid-cols-2 gap-2 pt-2">
                           <button 
                              onClick={() => copyToClipboard(scene.visual_prompt, `vp-${scene.scene_number}`)}
                              className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg border border-zinc-700 text-[10px] font-bold text-zinc-300 flex items-center justify-center gap-2 transition-colors"
                           >
                              {copiedId === `vp-${scene.scene_number}` ? <Check size={12} className="text-green-500"/> : <Copy size={12}/>} {tr('animation.visual_prompt')}
                           </button>
                           <button 
                              onClick={() => copyToClipboard(scene.image_to_video_prompt, `ivp-${scene.scene_number}`)}
                              className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg border border-zinc-700 text-[10px] font-bold text-zinc-300 flex items-center justify-center gap-2 transition-colors"
                           >
                              {copiedId === `ivp-${scene.scene_number}` ? <Check size={12} className="text-green-500"/> : <Film size={12}/>} {tr('animation.video_prompt')}
                           </button>
                        </div>
                     </div>

                  </div>
               ))}
            </div>
         </div>
      )}

    </div>
  );
};

export default AnimationStoryBuilder;
