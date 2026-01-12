
import React, { useState, useRef } from 'react';
import { Sparkles, Loader2, Mic, Play, Download, User, Users, Globe, Square } from 'lucide-react';
import { GenerationState } from '../types';
import LoadingOverlay from './LoadingOverlay';
import { ensureApiKey, generateSpeech } from '../services/geminiService';

const ACCENTS = [
  "Indonesia (Jakarta)", "Indonesia (Sunda)", "Indonesia (Jawa)",
  "English (British)", "English (American)", "English (Australia)", "English (Singapore)",
  "English (Filipino)", "English (Nigerian)",
  "Japanese", "Korean", "Chinese (Mandarin)",
  "Arabic (Standard)", "Arabic (Gulf)",
  "Spanish", "French", "German", "Italian", "Portuguese (Brazil)",
  "Thai", "Malaysian"
];

// Mapped to Gemini Prebuilt Voices
const VOICES = [
  { id: 'Puck', name: 'Puck (Male, Mid-range)', style: 'Natural' },
  { id: 'Charon', name: 'Charon (Male, Deep)', style: 'Serious/Podcast' },
  { id: 'Kore', name: 'Kore (Female, Warm)', style: 'Soothing/Narrator' },
  { id: 'Fenrir', name: 'Fenrir (Male, Rough)', style: 'Cinematic' },
  { id: 'Zephyr', name: 'Zephyr (Female, Soft)', style: 'Gentle/Story' },
  { id: 'Aoede', name: 'Aoede (Female, Confident)', style: 'Professional' },
  { id: 'Leda', name: 'Leda (Female, Sophisticated)', style: 'Elegant' },
  { id: 'Mimas', name: 'Mimas (Male, Energetic)', style: 'Upbeat' },
  { id: 'Pegasus', name: 'Pegasus (Male, Heroic)', style: 'Narrator' },
  { id: 'Thalassa', name: 'Thalassa (Female, Calm)', style: 'Meditative' },
];

const VoiceGenerator: React.FC = () => {
  const [text, setText] = useState('');
  const [mode, setMode] = useState<'single' | 'podcast'>('single');
  const [accent, setAccent] = useState(ACCENTS[4]); // Default American
  const [voiceA, setVoiceA] = useState(VOICES[2].id); // Default Kore
  const [voiceB, setVoiceB] = useState(VOICES[0].id); // Default Puck
  
  const [status, setStatus] = useState<GenerationState>(GenerationState.IDLE);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Preview State
  const [previewState, setPreviewState] = useState<{id: string, state: 'loading' | 'playing'} | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  const handlePreview = async (voiceId: string) => {
      // Stop current preview if any
      if (previewAudioRef.current) {
          previewAudioRef.current.pause();
          previewAudioRef.current = null;
      }

      // If clicking stop (same voice and playing)
      if (previewState?.id === voiceId && previewState.state === 'playing') {
          setPreviewState(null);
          return;
      }

      try {
          setPreviewState({ id: voiceId, state: 'loading' });
          
          const hasKey = await ensureApiKey();
          if (!hasKey) {
             setPreviewState(null);
             return; // User cancelled or failed key selection
          }

          // Generate a short preview
          const previewText = "Hello, this is a preview of my voice.";
          const url = await generateSpeech(previewText, voiceId);
          
          const audio = new Audio(url);
          previewAudioRef.current = audio;
          
          audio.onended = () => {
              setPreviewState(null);
              previewAudioRef.current = null;
          };
          
          await audio.play();
          setPreviewState({ id: voiceId, state: 'playing' });

      } catch (err) {
          console.error("Preview failed:", err);
          setPreviewState(null);
      }
  };

  // Helper to insert podcast tags
  const insertTag = (tag: string) => {
    setText(prev => prev + (prev.length > 0 && !prev.endsWith('\n') ? '\n' : '') + tag + " ");
  };

  const handleGenerate = async () => {
    if (!text.trim()) return;

    try {
      setStatus(GenerationState.GENERATING);
      setError(null);
      setAudioUrl(null);

      const hasKey = await ensureApiKey();
      if (!hasKey) throw new Error("API Key required.");

      const url = await generateSpeech(text, voiceA, mode === 'podcast' ? voiceB : undefined, mode === 'podcast');
      setAudioUrl(url);
      setStatus(GenerationState.COMPLETED);
    } catch (err: any) {
      setError(err.message || "Failed to generate voice.");
      setStatus(GenerationState.ERROR);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 md:p-8 animate-fade-in pb-20 relative">
      
      {/* Loading Overlay */}
      {status === GenerationState.GENERATING && <LoadingOverlay />}

      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-orange-400 mb-2">
          PLOW Voice Gen
        </h2>
        <p className="text-zinc-400 text-sm">
          ElevenLabs Level Quality • Multi-Accent • Podcast Mode
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Panel: Controls */}
        <div className="md:col-span-1 space-y-4">
           
           {/* Mode Selection */}
           <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-1 flex">
              <button 
                onClick={() => setMode('single')}
                className={`flex-1 py-2 text-sm font-medium rounded-lg flex items-center justify-center gap-2 transition-all ${mode === 'single' ? 'bg-zinc-800 text-white shadow' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                <User size={16} /> Single
              </button>
              <button 
                onClick={() => setMode('podcast')}
                className={`flex-1 py-2 text-sm font-medium rounded-lg flex items-center justify-center gap-2 transition-all ${mode === 'podcast' ? 'bg-zinc-800 text-white shadow' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                <Users size={16} /> Podcast
              </button>
           </div>

           {/* Settings Card */}
           <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4 space-y-4">
              
              {/* Accent */}
              <div>
                 <label className="flex items-center gap-2 text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">
                    <Globe size={12} /> Accent / Language
                 </label>
                 <select 
                    value={accent}
                    onChange={(e) => setAccent(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-zinc-500"
                 >
                    {ACCENTS.map(acc => <option key={acc} value={acc}>{acc}</option>)}
                 </select>
                 <p className="text-[10px] text-zinc-600 mt-1">
                    AI automatically adapts intonation to match the language entered.
                 </p>
              </div>

              {/* Voice A */}
              <div>
                 <label className="flex items-center gap-2 text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">
                    {mode === 'podcast' ? 'Voice A (Main)' : 'Voice Character'}
                 </label>
                 <div className="space-y-2 max-h-64 overflow-y-auto pr-1 custom-scrollbar">
                    {VOICES.map(v => (
                       <div
                          key={v.id}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border transition-all ${voiceA === v.id ? 'bg-orange-900/20 border-orange-500' : 'bg-transparent border-zinc-800 hover:bg-zinc-800'}`}
                       >
                          <button 
                             onClick={() => setVoiceA(v.id)}
                             className={`flex-1 text-left text-xs ${voiceA === v.id ? 'text-white' : 'text-zinc-400'}`}
                          >
                             {v.name}
                          </button>
                          
                          <button
                             onClick={(e) => { e.stopPropagation(); handlePreview(v.id); }}
                             disabled={previewState?.id === v.id && previewState.state === 'loading'}
                             className={`ml-2 p-1.5 rounded-full transition-colors ${voiceA === v.id ? 'text-orange-400 hover:bg-orange-900/40' : 'text-zinc-500 hover:bg-zinc-700 hover:text-zinc-200'}`}
                             title="Preview Voice"
                          >
                             {previewState?.id === v.id && previewState.state === 'loading' ? (
                                <Loader2 size={12} className="animate-spin" />
                             ) : previewState?.id === v.id && previewState.state === 'playing' ? (
                                <Square size={12} fill="currentColor" />
                             ) : (
                                <Play size={12} fill="currentColor" />
                             )}
                          </button>
                       </div>
                    ))}
                 </div>
              </div>

              {/* Voice B (Podcast Only) */}
              {mode === 'podcast' && (
                  <div className="animate-fade-in">
                    <label className="flex items-center gap-2 text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 mt-4 pt-4 border-t border-zinc-800">
                        Voice B (Partner)
                    </label>
                    <div className="space-y-2 max-h-64 overflow-y-auto pr-1 custom-scrollbar">
                        {VOICES.map(v => (
                           <div
                              key={v.id}
                              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border transition-all ${voiceB === v.id ? 'bg-blue-900/20 border-blue-500' : 'bg-transparent border-zinc-800 hover:bg-zinc-800'}`}
                           >
                              <button 
                                 onClick={() => setVoiceB(v.id)}
                                 className={`flex-1 text-left text-xs ${voiceB === v.id ? 'text-white' : 'text-zinc-400'}`}
                              >
                                 {v.name}
                              </button>
                              
                              <button
                                 onClick={(e) => { e.stopPropagation(); handlePreview(v.id); }}
                                 disabled={previewState?.id === v.id && previewState.state === 'loading'}
                                 className={`ml-2 p-1.5 rounded-full transition-colors ${voiceB === v.id ? 'text-blue-400 hover:bg-blue-900/40' : 'text-zinc-500 hover:bg-zinc-700 hover:text-zinc-200'}`}
                                 title="Preview Voice"
                              >
                                 {previewState?.id === v.id && previewState.state === 'loading' ? (
                                    <Loader2 size={12} className="animate-spin" />
                                 ) : previewState?.id === v.id && previewState.state === 'playing' ? (
                                    <Square size={12} fill="currentColor" />
                                 ) : (
                                    <Play size={12} fill="currentColor" />
                                 )}
                              </button>
                           </div>
                        ))}
                    </div>
                 </div>
              )}

           </div>
        </div>

        {/* Right Panel: Input & Result */}
        <div className="md:col-span-2 flex flex-col h-full">
            
            {/* Text Input */}
            <div className="flex-1 bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex flex-col relative group focus-within:ring-1 focus-within:ring-zinc-600">
                <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder={mode === 'podcast' ? "Enter dialogue...\n\n[A]: Hi there!\n[B]: Hello! Welcome to the podcast." : "Enter text to convert to speech..."}
                    className="flex-1 w-full bg-transparent resize-none outline-none text-zinc-200 placeholder-zinc-600 leading-relaxed font-mono text-sm"
                />
                
                {mode === 'podcast' && (
                    <div className="flex gap-2 mt-2 pt-2 border-t border-zinc-800">
                        <button onClick={() => insertTag("[A]:")} className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 rounded text-xs text-orange-400 font-mono">Insert [A]</button>
                        <button onClick={() => insertTag("[B]:")} className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 rounded text-xs text-blue-400 font-mono">Insert [B]</button>
                    </div>
                )}
            </div>

            {/* Generate Button - Updated Color */}
            <button
                onClick={handleGenerate}
                disabled={status === GenerationState.GENERATING || !text.trim()}
                className={`mt-4 w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-3 transition-all ${
                status === GenerationState.GENERATING ? 'bg-zinc-800 text-zinc-500' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-[0_0_20px_rgba(37,99,235,0.3)]'
                }`}
            >
                {status === GenerationState.GENERATING ? <><Loader2 className="animate-spin"/> Generating Audio...</> : <><Mic /> Generate Voice</>}
            </button>

            {error && <div className="mt-4 text-red-400 text-center text-sm bg-red-900/20 p-2 rounded-lg">{error}</div>}

            {/* Audio Player Result */}
            {status === GenerationState.COMPLETED && audioUrl && (
                <div className="mt-6 p-4 bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl animate-fade-in-up">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <span className="text-xs font-bold bg-zinc-800 text-zinc-300 px-2 py-1 rounded uppercase tracking-wider">Generated Audio</span>
                            <div className="text-zinc-500 text-xs mt-1">48kHz High Fidelity • {accent}</div>
                        </div>
                        <a href={audioUrl} download="plow-voice-gen.wav" className="p-2 bg-zinc-800 rounded-lg hover:bg-zinc-700 text-white transition-colors">
                            <Download size={18} />
                        </a>
                    </div>
                    
                    <audio controls src={audioUrl} className="w-full h-10 custom-audio-player" />
                </div>
            )}

        </div>
      </div>
      
      {/* Examples Info */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div className="p-4 bg-zinc-900/30 rounded-xl border border-zinc-800/50">
             <h4 className="text-white font-medium mb-1">Auto-Language</h4>
             <p className="text-zinc-500 text-xs">Type in any language (Indonesian, Japanese, etc). The AI detects it automatically.</p>
          </div>
          <div className="p-4 bg-zinc-900/30 rounded-xl border border-zinc-800/50">
             <h4 className="text-white font-medium mb-1">Podcast Mode</h4>
             <p className="text-zinc-500 text-xs">Use [A] and [B] tags to create realistic 2-person conversations.</p>
          </div>
          <div className="p-4 bg-zinc-900/30 rounded-xl border border-zinc-800/50">
             <h4 className="text-white font-medium mb-1">Emotion Aware</h4>
             <p className="text-zinc-500 text-xs">The voice adapts emotion based on the context of your text (Sad, Happy, Excited).</p>
          </div>
      </div>

      <style>{`
        .custom-audio-player {
            filter: invert(1) hue-rotate(180deg);
        }
      `}</style>
    </div>
  );
};

export default VoiceGenerator;
