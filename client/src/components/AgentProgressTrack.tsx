import React from 'react';
import { Loader2, Check } from 'lucide-react';
import { AgentLogEntry } from '../hooks/useNarrativePipeline.js';

interface AgentProgressTrackProps {
  log: AgentLogEntry[];
  isRunning: boolean;
}

const AGENTS = [
  { key: 'researcher', label: 'Researcher', sub: 'Consulting the Archive' },
  { key: 'synthesizer', label: 'Synthesizer', sub: 'Weaving the Narrative' },
  { key: 'narrator', label: 'Narrator', sub: 'Voicing the Chronicle' },
] as const;

const AgentProgressTrack: React.FC<AgentProgressTrackProps> = ({ log, isRunning }) => {
  const agentKeys = log.filter((e) => e.agent !== 'pipeline').map((e) => e.agent);

  if (agentKeys.length === 0 && !isRunning) return null;

  const activeKey = isRunning && agentKeys.length > 0 ? agentKeys[agentKeys.length - 1] : null;
  const completedKeys = new Set(isRunning ? agentKeys.slice(0, -1) : agentKeys);

  return (
    <div className="w-full mb-4 border border-brass/20 bg-black/30 px-3 sm:px-5 py-3 animate-in fade-in slide-in-from-bottom-2">
      {/* Track header */}
      <div className="flex items-center gap-2 mb-3">
        {isRunning ? (
          <span className="w-1.5 h-1.5 rounded-full bg-brass animate-pulse shrink-0" />
        ) : (
          <span className="w-1.5 h-1.5 rounded-full bg-brass/40 shrink-0" />
        )}
        <span className="text-[9px] font-libre font-bold uppercase tracking-[0.2em] text-brass/50">
          {isRunning ? 'Pipeline Active' : 'Pipeline Complete'}
        </span>
      </div>

      {/* Three-node track */}
      <div className="grid grid-cols-[1fr_24px_1fr_24px_1fr] items-start gap-y-0">
        {AGENTS.map((agent, i) => {
          const isActive = agent.key === activeKey;
          const isDone = completedKeys.has(agent.key);

          return (
            <React.Fragment key={agent.key}>
              {/* Agent node */}
              <div className="flex flex-col items-center text-center min-w-0">
                {/* Icon box */}
                <div
                  className={`w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center border transition-all ${
                    isActive
                      ? 'border-brass bg-brass/10 text-brass'
                      : isDone
                        ? 'border-brass/35 bg-transparent text-brass/45'
                        : 'border-stone/25 bg-transparent text-stone/30'
                  }`}
                >
                  {isDone ? (
                    <Check size={13} strokeWidth={2.5} />
                  ) : isActive ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-current" />
                  )}
                </div>

                {/* Label */}
                <span
                  className={`text-[8px] sm:text-[9px] font-libre font-bold uppercase tracking-[0.12em] sm:tracking-[0.15em] mt-1.5 leading-tight transition-colors ${
                    isActive ? 'text-brass' : isDone ? 'text-brass/40' : 'text-stone/30'
                  }`}
                >
                  {agent.label}
                </span>

                {/* Sub-label — only when active */}
                <span
                  className={`text-[8px] font-spectral italic mt-0.5 leading-tight px-1 transition-all duration-300 ${
                    isActive ? 'text-paper/40 opacity-100' : 'opacity-0'
                  }`}
                >
                  {agent.sub}
                </span>
              </div>

              {/* Connector — rendered after nodes 0 and 1 */}
              {i < AGENTS.length - 1 && (
                <div className="flex items-start justify-center pt-3.5">
                  <div
                    className={`w-full h-px transition-colors duration-500 ${
                      completedKeys.has(agent.key) || isActive ? 'bg-brass/35' : 'bg-stone/20'
                    }`}
                  />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default AgentProgressTrack;
