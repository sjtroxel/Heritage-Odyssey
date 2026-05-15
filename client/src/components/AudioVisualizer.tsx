import React from 'react';

interface AudioVisualizerProps {
  isActive: boolean;
  mode: 'recording' | 'playing';
}

const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ isActive, mode }) => {
  if (!isActive) return null;

  const pulseColor = mode === 'recording' ? 'bg-brass' : 'bg-cast-iron';

  const heights = ['60%', '85%', '45%', '75%'];

  return (
    <div className="flex items-center gap-1 h-8 px-2">
      {[...Array(4)].map((_, i) => (
        <div
          key={i}
          className={`w-1 rounded-full ${pulseColor} animate-pulse`}
          style={{
            height: heights[i],
            animationDelay: `${i * 0.1}s`,
            animationDuration: '0.6s',
          }}
        />
      ))}
    </div>
  );
};

export default AudioVisualizer;
