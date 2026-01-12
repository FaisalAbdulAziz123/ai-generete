import React from 'react';
import { Download } from 'lucide-react';
import { VideoResult } from '../types';

interface VideoPlayerProps {
  result: VideoResult;
  index: number;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ result, index }) => {
  return (
    <div className="flex-1 min-w-[300px] bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800 shadow-2xl animate-fade-in-up">
      <div className="relative aspect-video bg-black flex items-center justify-center">
        <video
          src={result.url}
          controls
          autoPlay
          loop
          className="w-full h-full object-contain"
        />
      </div>
      <div className="p-4 flex justify-between items-center bg-zinc-900">
        <span className="text-sm font-medium text-zinc-400">Version {index + 1}</span>
        <a
          href={result.url}
          download={`plow-generated-${index + 1}.mp4`}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-800 text-xs text-white hover:bg-zinc-700 transition-colors"
        >
          <Download size={14} />
          Save Video
        </a>
      </div>
    </div>
  );
};

export default VideoPlayer;