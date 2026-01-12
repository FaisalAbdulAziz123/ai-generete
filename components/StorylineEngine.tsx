
import React, { useState } from 'react';
import { Sparkles, Loader2, Copy, ScrollText, Check } from 'lucide-react';
import { GenerationState, StorylineResult } from '../types';
import { ensureApiKey, generateStoryline } from '../services/geminiService';

const TOPIC_SUGGESTIONS = [
  "Motivasi & Inspirasi Hidup", "Drama Emosional", "Petualangan Fantasi", "Mitologi Nusantara", "Horor Misteri", "Anak-anak & Edukasi", "Story Animasi Lucu", "Perjalanan Hidup Seseorang", "Aksi & Thriller", "Cerita Cinta Ringan", "Cyberpunk Future", "Slice of Life", "Bisnis dan Self-Growth"
];

const StorylineEngine: React.FC = () => {
  const [topic, setTopic] = useState('');
  const [customTopic, setCustomTopic] = useState('');
  const [sceneCount, setSceneCount] = useState(10);
  const [status, setStatus] = useState<GenerationState>(GenerationState.IDLE);
  const [result, setResult] = useState<StorylineResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const handleTopicSelect = (t: string) => {
    setTopic(t);
    setCustomTopic('');
  };

  const handleGenerate = async () => {
    const finalTopic = customTopic.trim() || topic || "Random inspiring story";
    try {
      setStatus(GenerationState.GENERATING);
      setError(null);
      const hasKey = await ensureApiKey();
      if (!hasKey) throw new Error("API Key required.");
      const data = await generateStoryline(finalTopic, sceneCount);
      setResult(data);
      setStatus(GenerationState.COMPLETED);
    } catch (err: any) {
      setError(err.message || "Failed to generate storyline.");
      setStatus(GenerationState.ERROR);
    }
  };

  const handleCopy = async (text: string, sectionId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedSection(sectionId);
      setTimeout(() => setCopiedSection(null), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const getAudioScriptText = () => result?.scenes?.map(s => `Scene ${s.sceneNumber}:\n${s.audioScript}\n`).join("\n") || "";
  const getVisualPromptsText = () => result?.scenes?.map(s => `Scene ${s.sceneNumber}:\n${s.visualPrompt}\n`).join("\n") || "";

  return (
    <div className="w-full min-h-full p-4 md:p-8 animate-fade-in pb-20 relative">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-purple-400 mb-2">
          Script & Prompts Engine
        </h2>
        <p className="text-zinc-400 text-sm">
          Coherent narratives for professional storytelling.
        </p>
      </div>

      <div className="max-w-4xl mx-auto space-y-8">
          <div className="bg-zinc-900/50 p-6 rounded-2xl border border-zinc-800">
              <label className="block text-sm font-bold text-white mb-4 uppercase tracking-wider">1. Choose Story Topic</label>
              <div className="flex flex-wrap gap-2 mb-4">
                  {TOPIC_SUGGESTIONS.map((t) => (
                      <button
                          key={t}
                          onClick={() => handleTopicSelect(t)}
                          className={`px-3 py-2 rounded-lg text-xs font-medium transition-all border ${
                              topic === t 
                              ? 'bg-purple-600/20 border-purple-500 text-white shadow-lg shadow-purple-900/20' 
                              : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-500'
                          }`}
                      >
                          {t}
                      </button>
                  ))}
              </div>
              <input 
                type="text" 
                placeholder="Or type your own custom topic..." 
                value={customTopic}
                onChange={(e) => { setCustomTopic(e.target.value); setTopic(""); }}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-4 text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500 transition-colors"
              />
          </div>

          <div className="bg-zinc-900/50 p-6 rounded-2xl border border-zinc-800">
              <div className="flex justify-between items-center mb-4">
                  <label className="text-sm font-bold text-white uppercase tracking-wider">2. Number of Scenes</label>
                  <span className="text-2xl font-bold text-purple-400">{sceneCount}</span>
              </div>
              <input 
                  type="range" 
                  min="1" max="70" 
                  value={sceneCount} 
                  onChange={(e) => setSceneCount(Number(e.target.value))}
                  className="w-full accent-purple-500 h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer"
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
                {status === GenerationState.GENERATING ? <><Loader2 className="animate-spin"/> Writing...</> : <><ScrollText /> Generate Storyline</>}
            </button>
            
            {status === GenerationState.GENERATING && (
                <div className="flex flex-col items-center gap-2 animate-fade-in pt-2">
                    <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-purple-500 h-full animate-progress-fast"></div>
                    </div>
                    <span className="text-xs text-zinc-500 font-medium">PLOW AI is drafting your scene-by-scene script...</span>
                </div>
            )}
          </div>

          {error && <div className="mt-4 text-red-400 text-center text-sm">{error}</div>}
      </div>

      {status === GenerationState.COMPLETED && result && (
          <div className="max-w-5xl mx-auto space-y-8 animate-fade-in-up mt-12">
              <div className="flex justify-between items-center bg-zinc-900/80 p-6 rounded-2xl border border-zinc-800 backdrop-blur-sm shadow-xl">
                  <div>
                      <h1 className="text-xl font-bold text-white mb-1">Generated Storyline</h1>
                      <p className="text-zinc-400 text-sm">{result.topic} • {result.totalScenes} Scenes Narrative Plan</p>
                  </div>
                  <button onClick={() => setStatus(GenerationState.IDLE)} className="px-4 py-2 bg-zinc-800 text-zinc-300 rounded-lg hover:text-white transition-colors text-sm">Create New</button>
              </div>

              <div className="bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl">
                  <div className="bg-zinc-900 p-4 border-b border-zinc-800 flex justify-between items-center">
                      <h3 className="text-white font-bold flex items-center gap-2 text-sm uppercase tracking-widest">Full Audio Narration Script</h3>
                      <button onClick={() => handleCopy(getAudioScriptText(), 'audio')} className="flex items-center gap-2 text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-lg transition-all border border-zinc-700">
                         {copiedSection === 'audio' ? <Check size={14} className="text-green-500" /> : <Copy size={14}/>} {copiedSection === 'audio' ? 'Copied!' : 'Copy Entire Script'}
                      </button>
                  </div>
                  <div className="p-6 space-y-8">
                      {result.scenes?.map((scene) => (
                          <div key={scene.sceneNumber} className="border-l-2 border-zinc-800 pl-6 group">
                              <span className="text-yellow-500 text-[10px] font-black uppercase mb-1 block tracking-widest opacity-50 group-hover:opacity-100 transition-opacity">SCENE {scene.sceneNumber}</span>
                              <p className="text-zinc-300 leading-relaxed font-serif text-lg italic">"{scene.audioScript}"</p>
                          </div>
                      ))}
                  </div>
              </div>

              <div className="bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl">
                  <div className="bg-zinc-900 p-4 border-b border-zinc-800 flex justify-between items-center">
                      <h3 className="text-white font-bold flex items-center gap-2 text-sm uppercase tracking-widest">Visual Prompts Collection</h3>
                      <button onClick={() => handleCopy(getVisualPromptsText(), 'visual')} className="flex items-center gap-2 text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-lg transition-all border border-zinc-700">
                         {copiedSection === 'visual' ? <Check size={14} className="text-green-500" /> : <Copy size={14}/>} {copiedSection === 'visual' ? 'Copied!' : 'Copy All Prompts'}
                      </button>
                  </div>
                  <div className="p-6 space-y-6">
                      {result.scenes?.map((scene) => (
                          <div key={scene.sceneNumber} className="bg-zinc-900/30 p-5 rounded-2xl border border-zinc-800/50">
                              <div className="flex justify-between items-center mb-3">
                                <span className="text-blue-400 text-[10px] font-black uppercase tracking-widest">Scene {scene.sceneNumber} Prompt</span>
                                <button onClick={() => handleCopy(scene.visualPrompt, `sc-${scene.sceneNumber}`)} className="text-zinc-600 hover:text-white transition-colors">
                                  {copiedSection === `sc-${scene.sceneNumber}` ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                                </button>
                              </div>
                              <div className="font-mono text-[11px] text-zinc-500 bg-black p-4 rounded-xl border border-zinc-800 leading-relaxed">
                                  {scene.visualPrompt}
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default StorylineEngine;
