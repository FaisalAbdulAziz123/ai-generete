import React from 'react';
import { AspectRatio } from '../types';
import { Monitor, Smartphone, Square, Layers, SquareStack } from 'lucide-react';

interface SettingsProps {
  ratio: AspectRatio;
  setRatio: (r: AspectRatio) => void;
  count: 1 | 2;
  setCount: (c: 1 | 2) => void;
  disabled: boolean;
}

const Settings: React.FC<SettingsProps> = ({ ratio, setRatio, count, setCount, disabled }) => {
  return (
    <div className="flex flex-col sm:flex-row gap-6 w-full max-w-3xl mt-6 p-4 bg-zinc-900/50 rounded-xl border border-zinc-800">
      
      {/* Aspect Ratio */}
      <div className="flex-1">
        <label className="block text-xs font-medium text-zinc-400 mb-3 uppercase tracking-wider">
          Aspect Ratio
        </label>
        <div className="flex gap-2">
          <button
            onClick={() => setRatio(AspectRatio.SQUARE)}
            disabled={disabled}
            className={`flex-1 flex flex-col items-center justify-center p-3 rounded-lg border transition-all ${
              ratio === AspectRatio.SQUARE
                ? 'bg-zinc-800 border-zinc-600 text-white shadow-lg'
                : 'bg-transparent border-zinc-800 text-zinc-500 hover:bg-zinc-800/50'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <Square size={20} className="mb-2" />
            <span className="text-xs font-medium">1:1</span>
          </button>
          
          <button
            onClick={() => setRatio(AspectRatio.PORTRAIT)}
            disabled={disabled}
            className={`flex-1 flex flex-col items-center justify-center p-3 rounded-lg border transition-all ${
              ratio === AspectRatio.PORTRAIT
                ? 'bg-zinc-800 border-zinc-600 text-white shadow-lg'
                : 'bg-transparent border-zinc-800 text-zinc-500 hover:bg-zinc-800/50'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <Smartphone size={20} className="mb-2" />
            <span className="text-xs font-medium">9:16</span>
          </button>

          <button
            onClick={() => setRatio(AspectRatio.LANDSCAPE)}
            disabled={disabled}
            className={`flex-1 flex flex-col items-center justify-center p-3 rounded-lg border transition-all ${
              ratio === AspectRatio.LANDSCAPE
                ? 'bg-zinc-800 border-zinc-600 text-white shadow-lg'
                : 'bg-transparent border-zinc-800 text-zinc-500 hover:bg-zinc-800/50'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <Monitor size={20} className="mb-2" />
            <span className="text-xs font-medium">16:9</span>
          </button>
        </div>
      </div>

      <div className="w-px bg-zinc-800 hidden sm:block"></div>

      {/* Output Count */}
      <div className="flex-1">
        <label className="block text-xs font-medium text-zinc-400 mb-3 uppercase tracking-wider">
          Output Variations
        </label>
        <div className="flex gap-2 h-full">
          <button
            onClick={() => setCount(1)}
            disabled={disabled}
            className={`flex-1 flex items-center justify-center gap-2 rounded-lg border transition-all ${
              count === 1
                ? 'bg-zinc-800 border-zinc-600 text-white shadow-lg'
                : 'bg-transparent border-zinc-800 text-zinc-500 hover:bg-zinc-800/50'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <Layers size={18} />
            <span className="text-sm font-medium">1 Video</span>
          </button>
          
          <button
            onClick={() => setCount(2)}
            disabled={disabled}
            className={`flex-1 flex items-center justify-center gap-2 rounded-lg border transition-all ${
              count === 2
                ? 'bg-zinc-800 border-zinc-600 text-white shadow-lg'
                : 'bg-transparent border-zinc-800 text-zinc-500 hover:bg-zinc-800/50'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <SquareStack size={18} />
            <span className="text-sm font-medium">2 Videos</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;