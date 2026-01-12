
import React, { useState, useRef } from 'react';
import { Upload, ScanFace, Check, Copy, Loader2, Image as ImageIcon, Video, X, Zap, Eye, Microscope } from 'lucide-react';
import { CloningResult, GenerationState, CloningComplexity } from '../types';
import { ensureApiKey, analyzeContentForCloning } from '../services/geminiService';

const CloningExtractor: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<GenerationState>(GenerationState.IDLE);
  const [result, setResult] = useState<CloningResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [complexity, setComplexity] = useState<CloningComplexity>('standard');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
      setResult(null);
      setError(null);
      setStatus(GenerationState.IDLE);
    }
  };

  const clearFile = () => {
    setFile(null);
    setPreviewUrl(null);
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAnalyze = async () => {
    if (!file) return;

    try {
      setStatus(GenerationState.GENERATING);
      setError(null);
      
      const hasKey = await ensureApiKey();
      if (!hasKey) throw new Error("API Key required.");

      // Pass the selected complexity level
      const data = await analyzeContentForCloning(file, complexity);
      setResult(data);
      setStatus(GenerationState.COMPLETED);
    } catch (err: any) {
      setError(err.message || "Failed to analyze content.");
      setStatus(GenerationState.ERROR);
    }
  };

  const copyToClipboard = async () => {
    if (result?.full_prompt) {
      await navigator.clipboard.writeText(result.full_prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="w-full min-h-full p-4 md:p-8 animate-fade-in pb-32">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white via-emerald-400 to-zinc-500 mb-2 uppercase tracking-tighter">
            Photo/Video Cloning Extractor
          </h2>
          <p className="text-zinc-500 text-sm font-medium tracking-widest uppercase">
            Upload Photo/Video • Extract DNA • Clone Style
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Left Column: Upload */}
          <div className="space-y-6">
            <div className={`
              relative border-2 border-dashed rounded-[2rem] p-8 flex flex-col items-center justify-center transition-all min-h-[400px]
              ${file ? 'border-emerald-500/50 bg-emerald-900/10' : 'border-zinc-800 bg-zinc-900/40 hover:bg-zinc-900/60 hover:border-zinc-700'}
            `}>
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*,video/*"
                className="hidden" 
              />
              
              {file && previewUrl ? (
                <div className="w-full h-full relative group">
                  {file.type.startsWith('video') ? (
                    <video src={previewUrl} controls className="w-full h-full max-h-[400px] object-contain rounded-xl shadow-2xl" />
                  ) : (
                    <img src={previewUrl} alt="Preview" className="w-full h-full max-h-[400px] object-contain rounded-xl shadow-2xl" />
                  )}
                  <button 
                    onClick={clearFile}
                    className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center cursor-pointer text-center"
                >
                  <div className="w-20 h-20 bg-zinc-900 rounded-3xl flex items-center justify-center mb-6 shadow-xl border border-zinc-800 group hover:scale-110 transition-transform">
                    <Upload size={32} className="text-zinc-500 group-hover:text-emerald-400 transition-colors" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Upload Reference</h3>
                  <p className="text-zinc-500 text-sm max-w-xs">
                    Drop a photo or short video clip here. We'll analyze the visual DNA.
                  </p>
                  <div className="flex gap-4 mt-6">
                    <span className="px-3 py-1 bg-zinc-900 rounded-lg text-xs font-mono text-zinc-500 border border-zinc-800 flex items-center gap-2"><ImageIcon size={12}/> Images</span>
                    <span className="px-3 py-1 bg-zinc-900 rounded-lg text-xs font-mono text-zinc-500 border border-zinc-800 flex items-center gap-2"><Video size={12}/> Videos</span>
                  </div>
                </div>
              )}
            </div>

            {/* Complexity Selector */}
            <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-4">
               <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3 block text-center">Analysis Precision Level</label>
               <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setComplexity('basic')}
                    className={`p-3 rounded-xl flex flex-col items-center gap-2 transition-all border ${
                        complexity === 'basic' 
                        ? 'bg-emerald-900/30 border-emerald-500 text-emerald-400' 
                        : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-600'
                    }`}
                  >
                     <Zap size={18} />
                     <span className="text-[10px] font-bold uppercase">Basic</span>
                  </button>

                  <button
                    onClick={() => setComplexity('standard')}
                    className={`p-3 rounded-xl flex flex-col items-center gap-2 transition-all border ${
                        complexity === 'standard' 
                        ? 'bg-emerald-900/30 border-emerald-500 text-emerald-400' 
                        : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-600'
                    }`}
                  >
                     <Eye size={18} />
                     <span className="text-[10px] font-bold uppercase">Standard</span>
                  </button>

                  <button
                    onClick={() => setComplexity('advanced')}
                    className={`p-3 rounded-xl flex flex-col items-center gap-2 transition-all border ${
                        complexity === 'advanced' 
                        ? 'bg-emerald-900/30 border-emerald-500 text-emerald-400' 
                        : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-600'
                    }`}
                  >
                     <Microscope size={18} />
                     <span className="text-[10px] font-bold uppercase">Precise</span>
                  </button>
               </div>
               <div className="text-center mt-3">
                  <p className="text-[10px] text-zinc-500 italic">
                      {complexity === 'basic' && "Quick overview of main subjects."}
                      {complexity === 'standard' && "Balanced detail for general use."}
                      {complexity === 'advanced' && "Hyper-detailed technical analysis (Lighting, Textures)."}
                  </p>
               </div>
            </div>

            <button
              onClick={handleAnalyze}
              disabled={!file || status === GenerationState.GENERATING}
              className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 transition-all ${
                status === GenerationState.GENERATING 
                ? 'bg-zinc-800 text-zinc-500 cursor-wait' 
                : !file 
                  ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                  : 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-xl shadow-emerald-900/20 active:scale-95'
              }`}
            >
              {status === GenerationState.GENERATING ? <><Loader2 className="animate-spin"/> Scanning ({complexity})...</> : <><ScanFace /> Extract Prompt</>}
            </button>
            
            {error && (
              <div className="p-4 bg-red-900/20 border border-red-900/50 rounded-xl text-red-400 text-sm text-center">
                {error}
              </div>
            )}
          </div>

          {/* Right Column: Results */}
          <div className="space-y-6">
             {status === GenerationState.IDLE && !result && (
               <div className="h-full min-h-[400px] border border-dashed border-zinc-800 rounded-[2rem] flex flex-col items-center justify-center text-zinc-600 bg-zinc-900/20">
                  <ScanFace size={48} className="mb-4 opacity-20" />
                  <p className="text-sm font-medium uppercase tracking-widest opacity-50">Analysis Results Will Appear Here</p>
               </div>
             )}

             {result && (
               <div className="space-y-6 animate-fade-in-up">
                  {/* Full Prompt Box */}
                  <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden group">
                     <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-500"></div>
                     <div className="flex justify-between items-center mb-4">
                        <span className="text-xs font-black text-emerald-500 uppercase tracking-widest flex items-center gap-2">
                           <ScanFace size={14}/> {complexity.toUpperCase()} Cloning Prompt
                        </span>
                        <button 
                           onClick={copyToClipboard}
                           className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 rounded-lg text-xs font-bold text-zinc-300 transition-colors border border-zinc-800"
                        >
                           {copied ? <Check size={14} className="text-emerald-500"/> : <Copy size={14}/>}
                           {copied ? 'COPIED' : 'COPY'}
                        </button>
                     </div>
                     <div className="bg-zinc-900/50 rounded-xl p-4 border border-zinc-800">
                        <p className="text-zinc-200 text-sm leading-relaxed font-mono whitespace-pre-wrap">
                           {result.full_prompt}
                        </p>
                     </div>
                  </div>

                  {/* Structured Data Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     {/* Character */}
                     <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-5 hover:bg-zinc-900/60 transition-colors">
                        <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-3">Character</h4>
                        <ul className="space-y-2 text-xs text-zinc-300">
                           <li className="flex gap-2"><span className="text-zinc-500">Gender:</span> {result.character.gender}</li>
                           <li className="flex gap-2"><span className="text-zinc-500">Age:</span> {result.character.age_range}</li>
                           <li className="flex gap-2"><span className="text-zinc-500">Body:</span> {result.character.body_type}</li>
                           <li className="flex gap-2"><span className="text-zinc-500">Face:</span> {result.character.face_features}</li>
                           <li className="flex gap-2"><span className="text-zinc-500">Hair:</span> {result.character.hair}</li>
                        </ul>
                     </div>

                     {/* Clothing */}
                     <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-5 hover:bg-zinc-900/60 transition-colors">
                        <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-3">Clothing</h4>
                        <ul className="space-y-2 text-xs text-zinc-300">
                           <li className="flex gap-2"><span className="text-zinc-500">Top:</span> {result.clothing.top}</li>
                           <li className="flex gap-2"><span className="text-zinc-500">Bottom:</span> {result.clothing.bottom}</li>
                           <li className="flex gap-2"><span className="text-zinc-500">Shoes:</span> {result.clothing.footwear}</li>
                           <li className="flex gap-2"><span className="text-zinc-500">Accs:</span> {result.clothing.accessories}</li>
                        </ul>
                     </div>

                     {/* Environment */}
                     <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-5 hover:bg-zinc-900/60 transition-colors">
                        <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-3">Environment</h4>
                        <p className="text-xs text-zinc-300 mb-2">{result.environment.background_description}</p>
                        <p className="text-[10px] text-zinc-500 italic">"{result.environment.atmosphere_mood}"</p>
                     </div>

                     {/* Style & Camera */}
                     <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-5 hover:bg-zinc-900/60 transition-colors">
                        <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-3">Tech Specs</h4>
                        <ul className="space-y-2 text-xs text-zinc-300">
                           <li className="flex gap-2"><span className="text-zinc-500">Visual:</span> {result.style.visual_style}</li>
                           <li className="flex gap-2"><span className="text-zinc-500">Angle:</span> {result.camera.angle}</li>
                           <li className="flex gap-2"><span className="text-zinc-500">Lens:</span> {result.camera.lens_focal_length}</li>
                           <li className="flex gap-2"><span className="text-zinc-500">Lighting:</span> {result.style.lighting_style}</li>
                           <li className="flex gap-2"><span className="text-zinc-500">Render:</span> {result.style.render_quality}</li>
                        </ul>
                     </div>
                  </div>
               </div>
             )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default CloningExtractor;
