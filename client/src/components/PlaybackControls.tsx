import React from 'react';
import { Play, Pause, RotateCcw, Rewind, FastForward } from 'lucide-react';

interface PlaybackControlsProps {
  isPlaying: boolean;
  onToggle: () => void;
  onRestart: () => void;
  onSeekBackward: () => void;
  onSeekForward: () => void;
}

const PlaybackControls: React.FC<PlaybackControlsProps> = ({
  isPlaying,
  onToggle,
  onRestart,
  onSeekBackward,
  onSeekForward,
}) => (
  <div className="flex items-center justify-center gap-6">
    <button
      onClick={onRestart}
      title="Restart from beginning"
      className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-brass/60 hover:text-brass transition-colors"
    >
      <RotateCcw size={12} />
      restart
    </button>
    <button
      onClick={onSeekBackward}
      title="Rewind 10 seconds"
      className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-brass/60 hover:text-brass transition-colors"
    >
      <Rewind size={12} />
      −10s
    </button>
    <button
      onClick={onToggle}
      className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-brass/70 hover:text-brass transition-colors"
    >
      {isPlaying ? <Pause size={12} /> : <Play size={12} />}
      {isPlaying ? 'pause' : 'play'}
    </button>
    <button
      onClick={onSeekForward}
      title="Skip forward 10 seconds"
      className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-brass/60 hover:text-brass transition-colors"
    >
      <FastForward size={12} />
      +10s
    </button>
  </div>
);

export default PlaybackControls;
