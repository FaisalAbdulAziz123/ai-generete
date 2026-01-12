
import React, { useState, useRef } from 'react';
import { Sparkles, Loader2, Image as ImageIcon, Plus, X, Download } from 'lucide-react';
import { GenerationState, ImageResult } from '../types';
import { ensureApiKey, generateImages } from '../services/geminiService';

const TextToImage: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [refImage, setRefImage] = useState<File | null>(null);
  const [status, setStatus] = useState<GenerationState>(GenerationState.IDLE);
  const [result, setResult] = useState<ImageResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setRefImage(e.target.files[0]);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim() && !refImage) return;

    try {
      setStatus(GenerationState.GENERATING);
      setError(null);
      
      const hasKey = await ensureApiKey();
      if (!hasKey) throw new Error("API Key required.");

      const res = await generateImages(prompt, refImage || undefined);
      setResult(res);
      setStatus(GenerationState.COMPLETED);
    } catch (err: any) {
      setError(err.message || "Failed to generate image");
      setStatus(GenerationState.ERROR);
    }
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-4 md:p-8 animate-fade-in relative">
        <div className="absolute top-8 left-0 right-0 text-center pointer-events-none">
             <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-zinc-600">Text to Image</h2>
             <p className="text-zinc-500 text-xs mt-1">4K Ultra Detail • Auto Style</p>
        </div>

        {result && status === GenerationState.COMPLETED && (
            <div className="w-full max-w-4xl mb-8 animate-fade-in-up">
                 <div className="relative rounded-2xl overflow-hidden border border-zinc-700 shadow-2xl bg-black">
                    <img src={result.url} alt="Generated" className="w-full h-auto max-h-[70vh] object-contain mx-auto" />
                    <a 
                        href={result.url} 
                        download="plow-image.png"
                        className="absolute bottom-4 right-4 bg-white text-black px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 hover:bg-zinc-200 transition-colors shadow-lg"
                    >
                        <Download size={16} /> Save 4K
                    </a>
                 </div>
            </div>
        )}

        <div className={`w-full max-w-2xl relative transition-all duration-500 ${result ? 'mt-4' : 'mt-0'}`}>
            <div className="relative bg-zinc-900 border border-zinc-700 rounded-3xl p-2 shadow-2xl flex items-end gap-2 focus-within:ring-2 focus-within:ring-white/20 focus-within:border-zinc-500 transition-all">
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*" 
                    onChange={handleFileChange}
                />
                <button 
                    onClick={() => refImage ? setRefImage(null) : fileInputRef.current?.click()}
                    className={`flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                        refImage 
                        ? 'bg-zinc-800 text-red-400 hover:bg-red-500/10' 
                        : 'bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700'
                    }`}
                >
                    {refImage ? (
                        <div className="relative w-12 h-12 rounded-2xl overflow-hidden group">
                             <img src={URL.createObjectURL(refImage)} className="w-full h-full object-cover opacity-60" />
                             <X size={20} className="absolute inset-0 m-auto text-white drop-shadow-md" />
                        </div>
                    ) : (
                        <Plus size={24} />
                    )}
                </button>

                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder={refImage ? "Describe how to change this image..." : "Describe the image you want to see..."}
                    className="flex-1 bg-transparent text-white text-lg placeholder-zinc-500 p-3 h-14 max-h-32 resize-none focus:outline-none py-3 scrollbar-hide"
                    disabled={status === GenerationState.GENERATING}
                    onKeyDown={(e) => {
                        if(e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleGenerate();
                        }
                    }}
                />

                <button
                    onClick={handleGenerate}
                    disabled={status === GenerationState.GENERATING || (!prompt && !refImage)}
                    className={`flex-shrink-0 h-10 px-4 mb-1 rounded-xl font-semibold text-sm flex items-center gap-2 transition-all ${
                        status === GenerationState.GENERATING
                            ? 'bg-zinc-800 text-zinc-500 cursor-wait'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                >
                     {status === GenerationState.GENERATING ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                </button>
            </div>
            
            {status === GenerationState.GENERATING && (
                <div className="flex flex-col items-center gap-2 animate-fade-in mt-4 px-4">
                    <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-blue-500 h-full animate-progress-fast"></div>
                    </div>
                    <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Dreaming up your 4K masterpiece...</span>
                </div>
            )}

            <div className="mt-4 flex justify-between px-4 text-xs text-zinc-500 font-medium">
                <span>{refImage ? "Photo Reference Mode Active" : "Text Mode"}</span>
                <span>{prompt.length > 0 ? "Press Enter to Generate" : "Type a prompt"}</span>
            </div>

            {error && (
                <div className="mt-4 p-3 bg-red-900/20 text-red-400 text-sm rounded-xl text-center border border-red-900/50">
                    {error}
                </div>
            )}
        </div>
    </div>
  );
};

export default TextToImage;
