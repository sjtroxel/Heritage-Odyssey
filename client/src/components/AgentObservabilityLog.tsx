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

      {/* Expanded state — Modal Overlay */}
      {isOpen && log.length > 0 && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          onClick={() => setIsOpen(false)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

          {/* Modal panel */}
          <div
            className="relative w-full max-w-xl bg-black/95 border border-stone/30 rounded-sm shadow-2xl p-4 max-h-[60vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-3 shrink-0">
              <span className="text-[10px] font-mono text-stone/60 uppercase tracking-widest">
                Agent Activity Log
              </span>
              <button
                onClick={() => setIsOpen(false)}
                className="text-stone/40 hover:text-paper/60 transition-colors text-[10px] font-mono"
              >
                ✕ close
              </button>
            </div>

            {/* Log entries — scrollable */}
            <div className="overflow-y-auto flex flex-col gap-1 min-h-0">
              {log.map((entry, i) => (
                <div key={i} className="text-[10px] font-mono leading-relaxed flex gap-1.5 min-w-0">
                  <span className="text-stone/40 shrink-0">[{entry.time}]</span>
                  <span className="text-amber-400/80 shrink-0 w-16">{entry.agent}</span>
                  <span className="text-green-400/70 truncate min-w-0">— {entry.detail}</span>
                </div>
              ))}
              <div ref={logEndRef} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentObservabilityLog;
