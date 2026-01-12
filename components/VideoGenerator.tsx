
import React, { useState, useRef } from 'react';
import { 
  Sparkles, Video, 
  ArrowRightLeft, Layers, Play, Download, 
  Plus, X, Palette, Monitor, Smartphone, ChevronDown, ChevronUp, Trash2, Clock, CheckCircle2, AlertCircle, Sliders
} from 'lucide-react';
import { AspectRatio, VideoResult, VideoMode, VideoTask, TaskStatus } from '../types';
import { generateAdvancedVideo } from '../services/geminiService';
import { Logo } from './Logo';
import { useLanguage } from '../contexts/LanguageContext';

const VideoGenerator: React.FC = () => {
  const { tr } = useLanguage();
  // Input State
  const [activeMode, setActiveMode] = useState<VideoMode>(VideoMode.TEXT_TO_VIDEO);
  const [prompt, setPrompt] = useState('');
  const [duration, setDuration] = useState('10s');
  const [style] = useState('Cinematic');
  const [ratio, setRatio] = useState<AspectRatio>(AspectRatio.LANDSCAPE);
  
  const [mainFiles, setMainFiles] = useState<File[]>([]);
  const [startFrame, setStartFrame] = useState<File | null>(null);
  const [endFrame, setEndFrame] = useState<File | null>(null);

  // UI State
  const [isRefOpen, setIsRefOpen] = useState(false);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const startFrameRef = useRef<HTMLInputElement>(null);
  const endFrameRef = useRef<HTMLInputElement>(null);

  // --- PARALLEL PROCESSING STATE ---
  const [tasks, setTasks] = useState<VideoTask[]>([]);

  const DURATIONS = ['3s', '8s', '10s'];

  // --- FILE HANDLERS ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, target: 'main' | 'start' | 'end') => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      if (target === 'main') {
        setMainFiles(prev => [...prev, ...selectedFiles].slice(0, 10));
      } else if (target === 'start') {
        setStartFrame(selectedFiles[0]);
      } else if (target === 'end') {
        setEndFrame(selectedFiles[0]);
      }
    }
  };

  // --- GENERATION LOGIC ---
  const handleGenerate = () => {
    if (!prompt && mainFiles.length === 0 && !startFrame) return;

    // 1. Create unique ID and Task Object
    const taskId = Date.now().toString();
    const newTask: VideoTask = {
      id: taskId,
      createdAt: Date.now(),
      status: TaskStatus.QUEUED,
      mode: activeMode,
      prompt: prompt || "Visual generation based on uploaded assets",
    };

    // 2. Add to Queue immediately (UI Update)
    setTasks(prev => [newTask, ...prev]);

    // 3. Clear Inputs immediately (Non-blocking)
    setPrompt('');
    setMainFiles([]);
    setStartFrame(null);
    setEndFrame(null);
    setIsRefOpen(false);

    // 4. Trigger Background Process
    processTask(taskId, {
      mode: activeMode,
      prompt: newTask.prompt,
      duration,
      style,
      ratio,
      files: mainFiles,
      startFrame,
      endFrame
    });
  };

  const processTask = async (taskId: string, params: any) => {
    // Set to Processing
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: TaskStatus.PROCESSING } : t));

    try {
      // Call Service
      const result = await generateAdvancedVideo(params);

      // Update Success
      setTasks(prev => prev.map(t => t.id === taskId ? { 
        ...t, 
        status: TaskStatus.COMPLETED, 
        result 
      } : t));
    } catch (error: any) {
      // Update Failure
      setTasks(prev => prev.map(t => t.id === taskId ? { 
        ...t, 
        status: TaskStatus.FAILED, 
        error: error.message || "Generation failed" 
      } : t));
    }
  };

  const removeTask = (taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
  };

  // Derived State for UI Panels
  const processingTasks = tasks.filter(t => t.status === TaskStatus.PROCESSING || t.status === TaskStatus.QUEUED);
  const completedTasks = tasks.filter(t => t.status === TaskStatus.COMPLETED || t.status === TaskStatus.FAILED);

  return (
    <div className="w-full min-h-full bg-[#09090b] text-zinc-100 p-6 md:p-10 animate-fade-in pb-32">
      <div className="max-w-[1600px]">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
          <div>
            <h1 className="text-4xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white via-blue-400 to-zinc-600 uppercase">
              {tr('video.title')}
            </h1>
            <p className="text-zinc-500 text-sm mt-1 font-medium tracking-wide">{tr('video.subtitle')}</p>
          </div>
          
          <div className="flex bg-zinc-900/50 p-1 rounded-2xl border border-zinc-800 backdrop-blur-md overflow-x-auto max-w-full">
            {[
              { id: VideoMode.TEXT_TO_VIDEO, icon: Video, label: 'Text' },
              { id: VideoMode.START_END_FRAME, icon: ArrowRightLeft, label: 'Start-End' },
              { id: VideoMode.BAHAN_TO_VIDEO, icon: Layers, label: 'Image to Video' }
            ].map(m => (
              <button
                key={m.id}
                onClick={() => setActiveMode(m.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${activeMode === m.id ? 'bg-blue-600 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                <m.icon size={16} />
                <span>{m.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT COLUMN: Input Control */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Prompt Input */}
            <div className="bg-zinc-900/40 border border-zinc-800 rounded-[2.5rem] p-6 shadow-2xl backdrop-blur-md">
              <label className="flex items-center gap-2 text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] mb-4">
                <Sparkles size={14} /> {tr('video.deskripsi_adegan')}
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={tr('video.placeholder')}
                className="w-full h-32 bg-zinc-950/50 border border-zinc-800 rounded-3xl p-5 text-base placeholder-zinc-700 focus:outline-none focus:border-blue-600/50 transition-all resize-none shadow-inner"
              />
            </div>

            {/* Reference Files (Collapsible) */}
            {activeMode !== VideoMode.TEXT_TO_VIDEO && (
              <div className="bg-zinc-900/40 border border-zinc-800 rounded-[2.5rem] p-6 shadow-2xl backdrop-blur-md">
                <button 
                  onClick={() => setIsRefOpen(!isRefOpen)} 
                  className="w-full flex items-center justify-between group focus:outline-none"
                >
                  <label className="flex items-center gap-2 text-[10px] font-black text-purple-500 uppercase tracking-[0.2em] cursor-pointer">
                    <Layers size={14} /> {tr('video.referensi')}
                  </label>
                  <div className={`p-2 rounded-full transition-all ${isRefOpen ? 'bg-zinc-800 text-white' : 'text-zinc-500 group-hover:text-zinc-300'}`}>
                    {isRefOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>
                </button>

                <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isRefOpen ? 'max-h-[500px] opacity-100 mt-6' : 'max-h-0 opacity-0 mt-0'}`}>
                  {activeMode === VideoMode.START_END_FRAME ? (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2 text-center">
                        <span className="text-[9px] font-bold text-zinc-500 uppercase">Start</span>
                        <button onClick={() => startFrameRef.current?.click()} className="w-full aspect-video border border-dashed border-zinc-700 rounded-xl flex items-center justify-center bg-zinc-950/30 overflow-hidden hover:border-blue-500/50 transition-colors">
                          {startFrame ? <img src={URL.createObjectURL(startFrame)} className="w-full h-full object-cover" /> : <Plus size={18} className="text-zinc-700" />}
                        </button>
                        <input type="file" ref={startFrameRef} className="hidden" onChange={(e) => handleFileChange(e, 'start')} />
                      </div>
                      <div className="space-y-2 text-center">
                        <span className="text-[9px] font-bold text-zinc-500 uppercase">End</span>
                        <button onClick={() => endFrameRef.current?.click()} className="w-full aspect-video border border-dashed border-zinc-700 rounded-xl flex items-center justify-center bg-zinc-950/30 overflow-hidden hover:border-blue-500/50 transition-colors">
                          {endFrame ? <img src={URL.createObjectURL(endFrame)} className="w-full h-full object-cover" /> : <Plus size={18} className="text-zinc-700" />}
                        </button>
                        <input type="file" ref={endFrameRef} className="hidden" onChange={(e) => handleFileChange(e, 'end')} />
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-4 gap-2">
                      {mainFiles.map((f, i) => (
                        <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-zinc-700">
                          <img src={URL.createObjectURL(f)} className="w-full h-full object-cover" />
                          <button onClick={() => setMainFiles(prev => prev.filter((_, idx) => idx !== i))} className="absolute top-1 right-1 p-0.5 bg-red-600 rounded-md"><X size={10} /></button>
                        </div>
                      ))}
                      {mainFiles.length < 10 && (
                        <button onClick={() => fileInputRef.current?.click()} className="aspect-square border border-dashed border-zinc-700 rounded-lg flex items-center justify-center bg-zinc-950/50 hover:border-zinc-600 transition-colors">
                          <Plus size={16} className="text-zinc-700" />
                        </button>
                      )}
                      <input type="file" ref={fileInputRef} className="hidden" multiple onChange={(e) => handleFileChange(e, 'main')} />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Config & Button */}
            <div className="bg-zinc-900/40 border border-zinc-800 rounded-[2rem] p-6 shadow-2xl backdrop-blur-md">
                <button 
                  onClick={() => setIsConfigOpen(!isConfigOpen)} 
                  className="w-full flex items-center justify-between group focus:outline-none mb-4"
                >
                  <label className="flex items-center gap-2 text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] cursor-pointer group-hover:text-white transition-colors">
                     <Sliders size={14} /> {tr('video.config')}
                  </label>
                   <div className="flex items-center gap-3">
                      <div className="flex gap-2 opacity-50">
                        <span className="px-2 py-1 bg-zinc-900 rounded-md border border-zinc-800 text-[10px] font-bold text-zinc-400">{duration}</span>
                        <span className="px-2 py-1 bg-zinc-900 rounded-md border border-zinc-800 text-[10px] font-bold text-zinc-400">{ratio}</span>
                      </div>
                      <div className={`p-2 rounded-full transition-all ${isConfigOpen ? 'bg-zinc-800 text-white' : 'bg-transparent text-zinc-500 group-hover:text-zinc-300'}`}>
                        {isConfigOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </div>
                   </div>
                </button>

                <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isConfigOpen ? 'max-h-[400px] opacity-100 mb-6' : 'max-h-0 opacity-0 mb-0'}`}>
                    <div className="space-y-6 pt-2 pb-2">
                      {/* Duration */}
                      <div>
                         <span className="text-[9px] font-bold text-zinc-600 uppercase mb-3 block tracking-wider">{tr('video.duration')}</span>
                         <div className="flex gap-2">
                            {DURATIONS.map(d => (
                                <button key={d} onClick={() => setDuration(d)} className={`flex-1 py-3 rounded-xl text-xs font-bold border transition-all ${duration === d ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-900/20' : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-700'}`}>
                                {d}
                                </button>
                            ))}
                         </div>
                      </div>
                      
                      {/* Aspect Ratio */}
                      <div>
                        <span className="text-[9px] font-bold text-zinc-600 uppercase mb-3 block tracking-wider">{tr('video.aspect')}</span>
                        <div className="flex gap-2">
                            {[
                                { id: AspectRatio.LANDSCAPE, icon: Monitor, label: '16:9' },
                                { id: AspectRatio.PORTRAIT, icon: Smartphone, label: '9:16' }
                            ].map(r => (
                            <button key={r.id} onClick={() => setRatio(r.id)} className={`flex-1 p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${ratio === r.id ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-900/20' : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-700'}`}>
                                <r.icon size={18} />
                                <span className="text-[10px] font-bold">{r.label}</span>
                            </button>
                            ))}
                        </div>
                      </div>
                    </div>
                </div>

                <button
                    onClick={handleGenerate}
                    className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-3 bg-blue-600 text-white hover:bg-blue-700 shadow-xl shadow-blue-600/20 active:scale-95 transition-all"
                >
                    <Play fill="currentColor" size={16} /> {tr('video.generate')}
                </button>
            </div>
          </div>

          {/* RIGHT COLUMN: Task Manager */}
          <div className="lg:col-span-7 space-y-8">
            
            {/* 1. PROCESSING TASKS PANEL */}
            {processingTasks.length > 0 && (
              <div className="space-y-3 animate-fade-in-up">
                 <div className="flex items-center gap-2 px-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                    <span className="text-xs font-black text-zinc-400 uppercase tracking-widest">{tr('video.processing')} ({processingTasks.length})</span>
                 </div>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {processingTasks.map(task => (
                      <div key={task.id} className="relative bg-zinc-900/60 border border-zinc-800/50 rounded-2xl p-6 overflow-hidden backdrop-blur-sm group">
                          {/* Animated Background */}
                          <div className="absolute inset-0 bg-blue-500/5 animate-pulse"></div>
                          
                          <div className="relative z-10 flex flex-col items-center justify-center text-center gap-4">
                              {/* PLOW AI Logo Animation */}
                              <div className="relative">
                                  <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full animate-pulse"></div>
                                  <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center border border-zinc-800 shadow-2xl relative z-10">
                                      <Logo className="w-10 h-10 text-white animate-pulse" />
                                  </div>
                              </div>
                              
                              <div className="space-y-1">
                                  <h3 className="text-white font-bold text-sm">{tr('video.generating')}</h3>
                                  <p className="text-[10px] text-blue-400 font-medium uppercase tracking-wide">{tr('video.powered')}</p>
                              </div>

                              <div className="w-full max-w-[200px] bg-zinc-800 h-1 rounded-full overflow-hidden">
                                  <div className="bg-gradient-to-r from-blue-600 to-purple-500 h-full animate-progress-fast w-[50%]"></div>
                              </div>

                              <div className="flex items-center justify-between w-full mt-2 px-2">
                                  <span className="text-[10px] text-zinc-500 font-mono">ID: #{task.id.slice(-4)}</span>
                                  <button onClick={() => removeTask(task.id)} className="text-[10px] text-red-500 hover:text-red-400 font-bold uppercase hover:underline">
                                      Cancel Task
                                  </button>
                              </div>
                          </div>
                      </div>
                    ))}
                 </div>
              </div>
            )}

            {/* 2. COMPLETED TASKS PANEL */}
            <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                    <span className="text-xs font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                        <CheckCircle2 size={14} className="text-green-500"/> {tr('video.completed')}
                    </span>
                    {completedTasks.length > 0 && (
                        <button onClick={() => setTasks(prev => prev.filter(t => t.status !== TaskStatus.COMPLETED && t.status !== TaskStatus.FAILED))} className="text-[10px] text-zinc-600 hover:text-white transition-colors">
                            Clear History
                        </button>
                    )}
                </div>

                {completedTasks.length === 0 && processingTasks.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 bg-zinc-900/20 border border-dashed border-zinc-800 rounded-3xl opacity-50">
                        <Video size={48} className="mb-4 text-zinc-700" />
                        <p className="text-sm font-bold text-zinc-600 uppercase">{tr('video.empty_gallery')}</p>
                        <p className="text-xs text-zinc-700">{tr('video.start_gen')}</p>
                    </div>
                )}

                <div className="grid grid-cols-1 gap-6">
                    {completedTasks.slice().reverse().map(task => (
                        <div key={task.id} className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-xl animate-fade-in-up">
                            {task.status === TaskStatus.FAILED ? (
                                <div className="p-8 flex items-center gap-4 text-red-400">
                                    <AlertCircle size={24} />
                                    <div>
                                        <p className="font-bold text-sm">Generation Failed</p>
                                        <p className="text-xs opacity-70">{task.error}</p>
                                    </div>
                                    <button onClick={() => removeTask(task.id)} className="ml-auto p-2 bg-zinc-800 rounded-full hover:bg-zinc-700 text-white"><Trash2 size={14}/></button>
                                </div>
                            ) : (
                                <div className="flex flex-col md:flex-row">
                                    <div className="w-full md:w-2/3 aspect-video bg-black relative group">
                                        <video 
                                            src={task.result?.url} 
                                            controls 
                                            className="w-full h-full object-contain"
                                            playsInline
                                            loop
                                        />
                                    </div>
                                    <div className="w-full md:w-1/3 p-6 flex flex-col justify-between bg-zinc-950">
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] bg-blue-900/30 text-blue-400 px-2 py-1 rounded border border-blue-900/50 font-bold uppercase">Success</span>
                                                <span className="text-[10px] text-zinc-600 font-mono"><Clock size={10} className="inline mr-1"/>{new Date(task.createdAt).toLocaleTimeString()}</span>
                                            </div>
                                            <div>
                                                <h4 className="text-xs font-black text-zinc-500 uppercase tracking-wider mb-2 flex items-center gap-1"><Palette size={12}/> Prompt</h4>
                                                <p className="text-xs text-zinc-300 line-clamp-4 leading-relaxed bg-zinc-900 p-3 rounded-xl border border-zinc-800">{task.prompt}</p>
                                            </div>
                                            
                                            {task.result?.technicalDetails && (
                                                <div>
                                                   <h4 className="text-xs font-black text-zinc-500 uppercase tracking-wider mb-2 flex items-center gap-1"><Sparkles size={12}/> AI Director Note</h4>
                                                   <p className="text-[10px] text-zinc-400 italic">"{task.result.technicalDetails.camera}"</p>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex gap-2 mt-6">
                                            <a 
                                                href={task.result?.url} 
                                                download={`plow-video-${task.id}.mp4`}
                                                className="flex-1 py-3 bg-zinc-100 text-black rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-zinc-300 transition-colors"
                                            >
                                                <Download size={14} /> Download
                                            </a>
                                            <button 
                                                onClick={() => removeTask(task.id)}
                                                className="p-3 bg-zinc-800 text-zinc-400 rounded-xl hover:bg-red-900/30 hover:text-red-500 transition-colors"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoGenerator;
