import React, { useState, useEffect, useRef } from 'react';
import { AgentLogEntry } from '../hooks/useNarrativePipeline.js';

interface AgentObservabilityLogProps {
  log: AgentLogEntry[];
  isRunning: boolean;
}

const AgentObservabilityLog: React.FC<AgentObservabilityLogProps> = ({ log, isRunning }) => {
  const [isOpen, setIsOpen] = useState(false);
  const logEndRef = useRef<HTMLDivElement>(null);

  // Auto-open when the first log entry arrives
  useEffect(() => {
    if (log.length === 1) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsOpen(true);
    }
  }, [log.length]);

  // Auto-scroll to newest entry
  useEffect(() => {
    if (isOpen && logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [log.length, isOpen]);

  if (log.length === 0 && !isRunning) {
    return null;
  }

  return (
    <div className="flex flex-col items-center mb-4 w-full">
      {/* Collapsed state / Header chip */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-black/60 border border-stone/20 px-3 py-1 text-[10px] font-mono text-stone/50 hover:bg-black/80 transition-colors rounded-sm"
      >
        {isRunning ? (
          <span className="flex items-center gap-2">
            <span className="text-amber-500 animate-pulse">●</span> LIVE — {log.length} step(s)
          </span>
        ) : (
          <span>
            {isOpen ? '▾' : '▸'} Agent Activity ({log.length} steps)
          </span>
        )}
      </button>

      {/* Expanded state */}
      {isOpen && log.length > 0 && (
        <div className="mt-2 w-full bg-black/90 border border-stone/20 max-h-40 overflow-y-auto p-2 rounded-sm shadow-inner">
          <div className="flex flex-col gap-1">
            {log.map((entry, i) => (
              <div
                key={i}
                className="text-[10px] font-mono leading-relaxed whitespace-nowrap overflow-hidden text-ellipsis"
              >
                <span className="text-stone/40">[{entry.time}]</span>{' '}
                <span className="text-amber-400/80 w-12 inline-block">{entry.agent}</span>{' '}
                <span className="text-green-400/70">— {entry.detail}</span>
              </div>
            ))}
            <div ref={logEndRef} />
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentObservabilityLog;
