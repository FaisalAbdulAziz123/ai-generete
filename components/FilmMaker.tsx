
import React, { useState } from 'react';
import { Clapperboard, Loader2, Copy, Check, Video, MessageSquare, ArrowRight, UserCircle2, Sparkles } from 'lucide-react';
import { GenerationState, FilmMakerResult } from '../types';
import { ensureApiKey, generateFilmMakerPlan } from '../services/geminiService';

const FILM_TOPICS = ["Cyberpunk Jakarta 2077", "Survival di Hutan Kalimantan", "Misteri Desa Penari", "Drama Keluarga Kaya Konflik", "Romance di Stasiun Sudirman", "Perang Kerajaan Nusantara", "Investigasi Hacker Pemerintah", "Petualangan Luar Angkasa"];

const FilmMaker: React.FC = () => {
  const [topic, setTopic] = useState('');
  const [customTopic, setCustomTopic] = useState('');
  const [sceneCount, setSceneCount] = useState(5);
  const [status, setStatus] = useState<GenerationState>(GenerationState.IDLE);
  const [result, setResult] = useState<FilmMakerResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleGenerate = async () => {
    const finalTopic = customTopic.trim() || topic;
    if (!finalTopic) { 
      setError("Pilih atau ketik topik film terlebih dahulu."); 
      return; 
    }
    
    try {
      setStatus(GenerationState.GENERATING);
      setError(null);
      setResult(null);

      const hasKey = await ensureApiKey();
      if (!hasKey) {
        throw new Error("API Key tidak tersedia atau dibatalkan.");
      }

      const data = await generateFilmMakerPlan(finalTopic, sceneCount);
      if (!data) {
        throw new Error("AI gagal menghasilkan adegan. Silakan coba lagi.");
      }

      setResult(data);
      setStatus(GenerationState.COMPLETED);
    } catch (err: any) {
      console.error("Generation Error:", err);
      setError(err.message || "Terjadi kesalahan sistem saat membuat film.");
      setStatus(GenerationState.ERROR);
    }
  };

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) { console.error("Copy failed", err); }
  };

  return (
    <div className="w-full min-h-full p-4 md:p-8 bg-[#09090b] text-zinc-100 animate-fade-in pb-24">
      <div className="text-center mb-10">
        <h2 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white via-red-500 to-zinc-500 mb-2 tracking-tighter uppercase">
          FILM MAKER PRO 8K
        </h2>
        <p className="text-zinc-500 text-sm font-medium tracking-widest uppercase italic">The Ultimate Cinematic Continuity Engine</p>
      </div>

      {(status === GenerationState.IDLE || status === GenerationState.GENERATING || status === GenerationState.ERROR) && (
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="bg-zinc-900/40 p-8 rounded-3xl border border-zinc-800 shadow-2xl">
            <label className="block text-xs font-black text-zinc-500 mb-4 uppercase tracking-[0.2em]">1. Konsep / Topik Film</label>
            <div className="flex flex-wrap gap-2 mb-6">
              {FILM_TOPICS.map((t) => (
                <button
                  key={t}
                  onClick={() => {setTopic(t); setCustomTopic('');}}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                    topic === t ? 'bg-red-600 border-red-500 text-white shadow-lg shadow-red-600/30' : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-500'
                  }`}
                >{t}</button>
              ))}
            </div>
            <input 
              type="text" placeholder="Atau ketik naskah pendek / ide cerita Anda di sini..." value={customTopic}
              onChange={(e) => { setCustomTopic(e.target.value); setTopic(""); }}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-5 text-white placeholder-zinc-700 focus:outline-none focus:border-red-600 transition-all shadow-inner"
            />
          </div>

          <div className="bg-zinc-900/40 p-8 rounded-3xl border border-zinc-800 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <label className="text-xs font-black text-zinc-500 uppercase tracking-[0.2em]">2. Durasi Produksi (Adegan)</label>
              <span className="text-3xl font-black text-red-500 font-mono">{sceneCount} SCENES</span>
            </div>
            <input 
              type="range" min="1" max="15" value={sceneCount} 
              onChange={(e) => setSceneCount(Number(e.target.value))}
              className="w-full accent-red-600 h-2 bg-zinc-800 rounded-full appearance-none cursor-pointer"
            />
          </div>

          <button
            onClick={handleGenerate}
            disabled={status === GenerationState.GENERATING}
            className={`w-full py-3 rounded-xl font-bold text-base flex items-center justify-center gap-4 transition-all ${
              status === GenerationState.GENERATING ? 'bg-zinc-800 text-zinc-500 cursor-wait' : 'bg-red-600 text-white hover:bg-red-700 shadow-2xl shadow-red-600/30 active:scale-95'
            }`}
          >
            {status === GenerationState.GENERATING ? <><Loader2 className="animate-spin"/> MENGGALI IDE SINEMATIK...</> : <><Clapperboard /> MULAI PRODUKSI 8K</>}
          </button>
          
          {error && (
            <div className="text-red-500 text-center font-bold text-sm bg-red-500/10 p-5 rounded-2xl border border-red-500/20 animate-shake">
              {error}
            </div>
          )}
        </div>
      )}

      {status === GenerationState.COMPLETED && result && (
        <div className="max-w-6xl mx-auto space-y-16 animate-fade-in-up mt-8">
          <div className="bg-zinc-950 border border-zinc-800 rounded-[3rem] p-12 text-center relative overflow-hidden shadow-2xl border-t-red-600 border-t-4">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-24 bg-red-600/10 blur-[100px] pointer-events-none"></div>
              <h1 className="text-5xl md:text-7xl font-black text-white uppercase tracking-tighter mb-4 leading-none">{result.title}</h1>
              <p className="text-zinc-400 text-xl italic max-w-3xl mx-auto opacity-80 font-serif leading-relaxed">"{result.logline}"</p>
              <div className="mt-10 flex justify-center gap-4">
                <button onClick={() => setStatus(GenerationState.IDLE)} className="px-8 py-3 bg-zinc-900 text-zinc-400 hover:text-white rounded-full text-xs font-black transition-all border border-zinc-800 uppercase tracking-[0.3em] active:scale-90">Proyek Baru</button>
              </div>
          </div>

          <div className="space-y-32">
            {result.scenes?.map((scene) => (
              <div key={scene.sceneNumber} className="relative">
                <div className="flex items-center gap-6 mb-12">
                  <div className="flex flex-col">
                    <span className="bg-white text-black font-black px-6 py-2 rounded-full text-sm tracking-widest shadow-2xl uppercase">ADEGAN {scene.sceneNumber}</span>
                  </div>
                  <div className="h-px flex-1 bg-zinc-800"></div>
                  <h3 className="text-zinc-500 font-bold text-sm uppercase tracking-[0.2em]">{scene.outline}</h3>
                </div>
                
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-6 relative group transition-all hover:bg-zinc-900">
                        <div className="flex justify-between items-center mb-4">
                          <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">START FRAME (T2I)</span>
                          <button onClick={() => copyToClipboard(scene.imageStartPrompt, `is-${scene.sceneNumber}`)} className="p-2 hover:bg-zinc-800 rounded-lg transition-colors text-zinc-600 hover:text-white">
                            {copiedId === `is-${scene.sceneNumber}` ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                          </button>
                        </div>
                        <div className="bg-black/40 p-4 rounded-xl border border-zinc-800/50">
                          <p className="text-zinc-400 text-[11px] font-mono leading-relaxed italic">{scene.imageStartPrompt}</p>
                        </div>
                      </div>
                      <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-6 relative group transition-all hover:bg-zinc-900">
                        <div className="flex justify-between items-center mb-4">
                          <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">END FRAME (T2I)</span>
                          <button onClick={() => copyToClipboard(scene.imageEndPrompt, `ie-${scene.sceneNumber}`)} className="p-2 hover:bg-zinc-800 rounded-lg transition-colors text-zinc-600 hover:text-white">
                            {copiedId === `ie-${scene.sceneNumber}` ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                          </button>
                        </div>
                        <div className="bg-black/40 p-4 rounded-xl border border-zinc-800/50">
                          <p className="text-zinc-400 text-[11px] font-mono leading-relaxed italic">{scene.imageEndPrompt}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-zinc-900 border-2 border-zinc-800 rounded-[2.5rem] p-8 shadow-2xl border-l-red-600 relative overflow-hidden group">
                      <div className="flex justify-between items-center mb-6 relative z-10">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-red-600/10 rounded-2xl text-red-500 shadow-inner"><Video size={28} /></div>
                          <div>
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-red-600 block mb-1">Text-to-Video Animation</span>
                            <h4 className="text-white font-black text-2xl tracking-tight uppercase">Interpolasi & Dialog</h4>
                          </div>
                        </div>
                        <button onClick={() => copyToClipboard(scene.videoPrompt, `v-${scene.sceneNumber}`)} className="p-4 bg-zinc-800 rounded-2xl text-zinc-400 hover:text-white transition-all active:scale-90 shadow-xl">
                          {copiedId === `v-${scene.sceneNumber}` ? <Check size={24} className="text-green-500" /> : <Copy size={24} />}
                        </button>
                      </div>
                      <div className="bg-black/60 p-7 rounded-2xl border border-zinc-800/50 relative z-10 backdrop-blur-md">
                        <div className="flex items-center gap-3 mb-5 opacity-40">
                          <span className="text-[10px] font-mono font-bold">FRAME START</span>
                          <ArrowRight size={14} className="text-red-600" />
                          <span className="text-[10px] font-mono uppercase font-bold">AKSI & DIALOG</span>
                          <ArrowRight size={14} className="text-red-600" />
                          <span className="text-[10px] font-mono font-bold">FRAME END</span>
                        </div>
                        <p className="text-zinc-100 text-sm font-mono leading-relaxed antialiased italic">
                          {scene.videoPrompt}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-zinc-900/30 border border-zinc-800 rounded-[2.5rem] p-10 flex flex-col shadow-inner">
                    <div className="flex items-center justify-between mb-8">
                       <div className="flex items-center gap-4">
                          <MessageSquare className="text-zinc-600" size={24} />
                          <span className="text-xs font-black text-zinc-500 uppercase tracking-[0.2em]">Detailed Script Preview</span>
                       </div>
                    </div>
                    <div className="space-y-8 flex-1">
                      {scene.dialogues && scene.dialogues.length > 0 ? scene.dialogues.map((d, i) => (
                        <div key={i} className="flex gap-5 group">
                          <div className="w-12 h-12 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0 text-zinc-500 group-hover:text-red-500 group-hover:border-red-900/50 transition-all shadow-lg">
                            <UserCircle2 size={28} />
                          </div>
                          <div className="space-y-1">
                            <p className="text-[11px] font-black text-red-500 uppercase tracking-widest">{d.characterName}</p>
                            <p className="text-zinc-100 text-xl leading-relaxed font-serif italic tracking-tight">"{d.line}"</p>
                          </div>
                        </div>
                      )) : (
                        <div className="flex flex-col items-center justify-center h-full opacity-20 text-center">
                           <Video size={48} className="mb-4" />
                           <p className="text-sm font-bold uppercase tracking-widest">Visual Only Scene</p>
                        </div>
                      )}
                    </div>
                    <div className="mt-10 pt-8 border-t border-zinc-800/50 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Sparkles size={16} className="text-red-500 animate-pulse" />
                        <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-[0.2em]">Plow AI Sinematik v2.1</span>
                      </div>
                    </div>
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

export default FilmMaker;
