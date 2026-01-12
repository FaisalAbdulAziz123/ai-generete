
import React from 'react';
import { Loader2 } from 'lucide-react';

/* 
  LoadingOverlay Component 
  Used to provide a full-screen or relative loading state for long-running AI operations.
*/
const LoadingOverlay: React.FC = () => {
  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-zinc-950/80 backdrop-blur-sm rounded-3xl animate-fade-in">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
          <div className="absolute inset-0 w-12 h-12 border-4 border-blue-500/20 rounded-full"></div>
        </div>
        <div className="text-center">
          <p className="text-white font-bold text-lg tracking-tight">Processing with PLOW AI</p>
          <p className="text-zinc-500 text-sm">Please wait while we generate your assets...</p>
        </div>
      </div>
    </div>
  );
};

export default LoadingOverlay;
