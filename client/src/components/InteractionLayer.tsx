import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  Mic,
  Send,
  Square,
  Volume2,
  GripHorizontal,
  X as XIcon,
  Compass,
  ChevronDown,
} from 'lucide-react';
import { AncestorProfile } from '@heritage-odyssey/shared/types';
import { VOICES, DEFAULT_VOICE_ID } from '@heritage-odyssey/shared/voices';
import { useMediaRecorder } from '../hooks/useMediaRecorder.js';
import { useNarrativePipeline } from '../hooks/useNarrativePipeline.js';
import { apiUrl, authFetch, RateLimitError } from '../lib/api.js';
import AudioVisualizer from './AudioVisualizer.js';
import { useAuthContext } from '../context/AuthContext.js';
import AgentObservabilityLog from './AgentObservabilityLog.js';
import AgentProgressTrack from './AgentProgressTrack.js';
import PlaybackControls from './PlaybackControls.js';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface InteractionLayerProps {
  selectedAncestor?: AncestorProfile | null;
  onClearAncestor?: () => void;
  onMinimizedChange?: (minimized: boolean) => void;
}

const SAMPLE_QUERIES = [
  'Describe the journey of immigrants crossing the Atlantic in the nineteenth century',
  'What was life like for immigrant families living in New York tenements in the 1890s?',
  'Tell me about the experience of arriving at Ellis Island around 1900',
  'Describe conditions aboard immigrant ships during the great migration era',
];

/**
 * Sticky-bottom interaction layer providing voice and text input.
 */
const InteractionLayer: React.FC<InteractionLayerProps> = ({
  selectedAncestor = null,
  onClearAncestor,
  onMinimizedChange,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [currentQuery, setCurrentQuery] = useState('');
  const [containerHeight, setContainerHeight] = useState(200);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isSamplesOpen, setIsSamplesOpen] = useState(false);
  const [isNarrativeOpen, setIsNarrativeOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [isMinimized, setIsMinimized] = useState(false);
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>(DEFAULT_VOICE_ID);
  const isResizing = useRef(false);

  const { token, refresh } = useAuthContext();
  const {
    run,
    reset,
    togglePlayback,
    restartPlayback,
    seekBackward,
    seekForward,
    agentLog,
    narrativeText,
    isRunning,
    isPlaying,
    error: pipelineError,
    rateLimitReset,
    setRateLimitReset,
  } = useNarrativePipeline();

  // Rate limit countdown logic
  useEffect(() => {
    if (!rateLimitReset) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCountdown(null);
      return;
    }
    const tick = () => {
      const s = Math.max(0, Math.ceil((rateLimitReset - Date.now()) / 1000));
      setCountdown(s);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [rateLimitReset]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsNarrativeOpen(Boolean(narrativeText));
  }, [narrativeText]);

  // Auto-expand logic when results or samples appear
  useEffect(() => {
    if (isMinimized) return;
    if (isRunning || narrativeText) {
      // Expanded height for narrative results
      if (containerHeight < 400) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setContainerHeight(Math.floor(window.innerHeight * 0.55));
      }
    } else if (isSamplesOpen) {
      // Tighter expanded height specifically for samples
      if (containerHeight < 300) {
        setContainerHeight(340);
      }
    } else {
      // Return to base height when nothing is active
      setContainerHeight(200);
    }

    if (isRunning) {
      setIsSamplesOpen(false);
    }
  }, [isRunning, narrativeText, isSamplesOpen, containerHeight, isMinimized]);

  // Resize logic
  const startResizing = useCallback(() => {
    isResizing.current = true;
    setIsDragging(true);
    document.body.style.cursor = 'ns-resize';
    document.body.style.userSelect = 'none';
  }, []);

  const stopResizing = useCallback(() => {
    isResizing.current = false;
    setIsDragging(false);
    document.body.style.cursor = 'default';
    document.body.style.userSelect = 'auto';
  }, []);

  const resize = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isResizing.current) return;

    const clientY = 'touches' in e ? e.touches[0]?.clientY : (e as MouseEvent).clientY;
    if (clientY === undefined) return;

    const newHeight = window.innerHeight - clientY;
    // Constrain height
    if (newHeight > 180 && newHeight < window.innerHeight * 0.9) {
      setContainerHeight(newHeight);
    }
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', resize);
    window.addEventListener('mouseup', stopResizing);
    window.addEventListener('touchmove', resize, { passive: false });
    window.addEventListener('touchend', stopResizing);
    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
      window.removeEventListener('touchmove', resize);
      window.removeEventListener('touchend', stopResizing);
    };
  }, [resize, stopResizing]);

  const handleSave = useCallback(async () => {
    if (!narrativeText || !currentQuery) return;
    setSaveStatus('saving');
    try {
      await authFetch(
        apiUrl('/api/records'),
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: currentQuery, contentText: narrativeText }),
        },
        token,
        refresh,
      );
      setSaveStatus('saved');
    } catch {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  }, [narrativeText, currentQuery, token, refresh]);

  const onRecordingComplete = useCallback(
    async (blob: Blob, _mimeType: string) => {
      try {
        const formData = new FormData();
        formData.append('audio', blob, 'recording.audio');

        const response = await authFetch(
          apiUrl('/api/voice/transcribe'),
          {
            method: 'POST',
            body: formData,
          },
          token,
          refresh,
        );

        const data = await response.json();
        if (data.text) {
          setInputValue(data.text);
          setCurrentQuery(data.text);
          setSaveStatus('idle');
          await run(data.text, selectedAncestor?.id, selectedVoiceId);
        }
      } catch (err) {
        if (err instanceof RateLimitError) {
          reset();
          setRateLimitReset(err.rateLimitReset);
          return;
        }
        console.error('Transcription error:', err);
      }
    },
    [run, reset, setRateLimitReset, token, refresh, selectedAncestor, selectedVoiceId],
  );

  const { isRecording, startRecording, stopRecording, isSupported, permissionDenied } =
    useMediaRecorder({ onComplete: onRecordingComplete });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isRunning || isRecording) return;
    setCurrentQuery(inputValue);
    setSaveStatus('idle');
    await run(inputValue, selectedAncestor?.id, selectedVoiceId);
  };

  const hasStatus =
    isRecording || isPlaying || pipelineError || permissionDenied || countdown !== null;

  const showClear = narrativeText || agentLog.length > 0 || pipelineError || rateLimitReset;

  return (
    <>
      {/* Minimized state — floating corner button to summon the panel back */}
      {isMinimized && (
        <button
          onClick={() => {
            setIsMinimized(false);
            onMinimizedChange?.(false);
          }}
          className="fixed bottom-5 right-5 z-40 pointer-events-auto flex items-center gap-2.5
            bg-cast-iron border border-brass px-5 py-3 rounded-sm
            shadow-[0_8px_30px_rgba(0,0,0,0.5)] hover:bg-cast-iron-dark transition-colors group
            animate-in fade-in slide-in-from-bottom-4 duration-300"
          aria-label="Reopen the interaction panel"
        >
          <Compass
            size={18}
            className="text-brass group-hover:rotate-45 transition-transform duration-500"
          />
          <span className="text-[11px] font-libre font-bold uppercase tracking-widest text-paper/80 group-hover:text-paper">
            Begin an Odyssey
          </span>
        </button>
      )}

      <div
        className={`fixed bottom-0 left-0 right-0 bg-cast-iron
          border-t border-brass shadow-[0_-10px_40px_rgba(0,0,0,0.5)]
          z-40 flex flex-col overflow-hidden
          ${isMinimized ? 'pointer-events-none' : 'pointer-events-auto'}
          ${!isDragging ? 'transition-[height,transform] duration-300 ease-in-out' : ''}`}
        style={{
          height: `${containerHeight}px`,
          transform: isMinimized ? 'translateY(100%)' : 'translateY(0)',
        }}
        aria-hidden={isMinimized}
      >
        {/* Draggable Handle Bar */}
        <div
          onMouseDown={startResizing}
          onTouchStart={startResizing}
          className="relative w-full h-9 flex items-center justify-center cursor-ns-resize hover:bg-brass/5 active:bg-brass/10 transition-colors group border-b border-brass/10 shrink-0"
        >
          <div className="flex flex-col items-center gap-0.5">
            <GripHorizontal
              size={14}
              className="text-brass/40 group-hover:text-brass transition-colors"
            />
          </div>
          <button
            onClick={() => {
              setIsMinimized(true);
              onMinimizedChange?.(true);
            }}
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5
              px-2.5 py-1 border border-rose-200/40 bg-rose-200/10 rounded-sm
              text-[10px] font-libre font-bold uppercase tracking-widest
              text-rose-200 hover:bg-rose-200/20 transition-all"
            aria-label="Hide panel"
            title="Hide panel"
          >
            <ChevronDown size={13} />
            Hide
          </button>
        </div>

        {/* Section 1 — scrollable content */}
        <div className="flex-1 overflow-y-auto min-h-0 px-4 md:px-6 pt-4 pb-2">
          <div className="max-w-2xl mx-auto w-full flex flex-col">
            {narrativeText && !isNarrativeOpen && (
              <button
                onClick={() => setIsNarrativeOpen(true)}
                className="text-[10px] font-mono text-brass/60 hover:text-brass uppercase tracking-widest transition-colors mb-3 border border-brass/20 hover:border-brass/40 px-3 py-1 self-start"
              >
                ▸ Read Narrative
              </button>
            )}

            <AgentProgressTrack log={agentLog} isRunning={isRunning} />
            <AgentObservabilityLog log={agentLog} isRunning={isRunning} />

            {showClear && (
              <button
                onClick={() => {
                  reset();
                  setInputValue('');
                }}
                className="text-[10px] font-mono text-stone/40 hover:text-paper/60 uppercase tracking-widest transition-colors self-end mb-2"
              >
                × New Query
              </button>
            )}

            {/* Status / Visualizer Area */}
            {hasStatus && (
              <div className="flex flex-col items-center mb-4 justify-center min-h-10">
                <AudioVisualizer isActive={isRecording} mode="recording" />
                <AudioVisualizer isActive={isPlaying} mode="playing" />

                {isPlaying && !isRunning && (
                  <div className="flex items-center gap-2 text-paper/80 text-xs font-spectral italic animate-in fade-in">
                    <Volume2 size={14} className="animate-pulse text-brass" />
                    <span>The Record Speaks...</span>
                  </div>
                )}

                {(pipelineError || permissionDenied) && (
                  <div className="text-paper/90 text-[10px] uppercase tracking-widest font-libre bg-red-950/40 px-4 py-1.5 border border-red-900/50 rounded-sm">
                    {pipelineError ? pipelineError : 'Microphone Access Restricted'}
                  </div>
                )}

                {countdown !== null && countdown > 0 && (
                  <div className="text-paper/70 text-[10px] font-mono uppercase tracking-widest mt-1">
                    Rate limit resets in {Math.floor(countdown / 60)}:
                    {String(countdown % 60).padStart(2, '0')}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Section 2 — pinned input, never scrolls */}
        <div className="shrink-0 px-4 md:px-6 pb-2 pt-2 border-t border-brass/10">
          <div className="max-w-2xl mx-auto w-full">
            {selectedAncestor && (
              <div className="flex items-center gap-2 mb-2 self-start">
                <span className="font-spectral italic text-[11px] text-brass/80 border border-brass/30 px-3 py-1">
                  Narrating for:{' '}
                  {!selectedAncestor.lastName ||
                  selectedAncestor.name.includes(selectedAncestor.lastName)
                    ? selectedAncestor.name
                    : `${selectedAncestor.name} ${selectedAncestor.lastName}`}
                </span>
                <button
                  onClick={onClearAncestor}
                  className="text-stone/40 hover:text-paper/60 transition-colors"
                  aria-label="Clear ancestor"
                >
                  <XIcon size={12} />
                </button>
              </div>
            )}

            {inputValue.length > 50 && (
              <p className="mb-2 font-spectral italic text-paper/40 line-clamp-2 leading-relaxed">
                {inputValue}
              </p>
            )}

            {/* Interaction Bar */}
            <div className="bg-cast-iron-dark border border-brass p-1.5 md:p-2 flex items-center gap-2 md:gap-3 shadow-2xl relative">
              {isSupported && (
                <button
                  onMouseDown={startRecording}
                  onMouseUp={stopRecording}
                  onTouchStart={startRecording}
                  onTouchEnd={stopRecording}
                  className={`shrink-0 w-12 h-12 md:w-14 md:h-14 rounded-sm flex items-center justify-center transition-all border-2 shadow-lg relative z-10 ${
                    isRecording
                      ? 'bg-brass text-cast-iron-dark scale-95 shadow-inner border-brass'
                      : 'bg-brass/10 text-brass hover:bg-brass/20 border-brass/40'
                  }`}
                  title="Hold to speak"
                >
                  {isRecording ? (
                    <Square size={20} fill="currentColor" />
                  ) : (
                    <Mic size={20} strokeWidth={1.5} />
                  )}
                </button>
              )}

              <form onSubmit={handleSubmit} className="grow flex items-center gap-2 relative z-10">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={
                    selectedAncestor
                      ? `Ask about ${selectedAncestor.name}...`
                      : 'Press & Hold Mic or Type to Search...'
                  }
                  className="grow bg-transparent border-none focus:ring-0 text-paper placeholder:text-paper/20 placeholder:uppercase placeholder:tracking-[0.15em] placeholder:text-[9px] md:placeholder:text-[10px] text-base py-3 px-2 font-spectral"
                  disabled={isRunning || isRecording}
                />

                <button
                  type="submit"
                  disabled={!inputValue.trim() || isRunning || isRecording}
                  className="w-10 h-10 md:w-12 md:h-12 bg-brass/10 text-brass border border-brass/30 flex items-center justify-center hover:bg-brass hover:text-cast-iron-dark disabled:opacity-10 transition-all rounded-sm shadow-md"
                >
                  <Send size={18} strokeWidth={1.5} />
                </button>
              </form>
            </div>

            {/* Voice picker — choose the narrating voice for generated audio */}
            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-brass/60 shrink-0">
                Narrating Voice
              </span>
              <div
                role="radiogroup"
                aria-label="Narrating voice"
                className="flex flex-wrap gap-1.5"
              >
                {VOICES.map((voice) => {
                  const isSelected = voice.id === selectedVoiceId;
                  return (
                    <button
                      key={voice.id}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      onClick={() => setSelectedVoiceId(voice.id)}
                      title={voice.description}
                      className={`px-3 py-1 rounded-sm border text-[11px] font-libre uppercase tracking-wider transition-colors ${
                        isSelected
                          ? 'bg-brass text-cast-iron-dark border-brass'
                          : 'bg-transparent text-paper/60 border-brass/30 hover:border-brass/60 hover:text-paper/90'
                      }`}
                    >
                      {voice.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {!isRunning && !narrativeText && (
              <div className="mt-3">
                <button
                  onClick={() => setIsSamplesOpen(!isSamplesOpen)}
                  className="text-xs font-mono text-brass/70 hover:text-paper uppercase tracking-widest transition-colors"
                >
                  {isSamplesOpen ? '▾ hide examples' : '▸ example queries'}
                </button>

                {isSamplesOpen && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {SAMPLE_QUERIES.map((q, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setInputValue(q);
                          setCurrentQuery(q);
                          setSaveStatus('idle');
                          setIsSamplesOpen(false);
                          run(q, selectedAncestor?.id, selectedVoiceId);
                        }}
                        className="text-xs font-spectral italic text-paper/60 hover:text-paper/90 border border-brass/10 hover:border-brass/30 px-3 py-1.5 transition-colors bg-transparent rounded-sm"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <p className="text-[8px] md:text-[10px] text-center text-paper/30 mt-2 uppercase tracking-[0.08em] md:tracking-[0.25em] font-libre font-bold">
              {isRecording
                ? 'Capturing Oral History...'
                : 'Authorized Personnel Only // Registry Access'}
            </p>
          </div>
        </div>

        {isNarrativeOpen && narrativeText && (
          <div
            className="fixed inset-0 z-60 flex items-center justify-center p-4 md:p-8"
            onClick={() => setIsNarrativeOpen(false)}
          >
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

            <div
              className="relative w-full max-w-2xl bg-paper border border-brass/30 shadow-2xl flex flex-col max-h-[65vh] md:max-h-[75vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="border-b border-brass/20 shrink-0">
                {/* Row 1 — title + document actions */}
                <div className="flex items-center justify-between px-6 py-2.5">
                  <span className="text-[10px] font-libre font-bold uppercase tracking-[0.2em] text-stone/60">
                    Historical Record
                  </span>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleSave}
                      disabled={saveStatus !== 'idle'}
                      className={`text-[10px] font-mono uppercase tracking-widest transition-colors ${
                        saveStatus === 'saved'
                          ? 'text-brass/50 cursor-default'
                          : saveStatus === 'error'
                            ? 'text-red-400/70 cursor-default'
                            : saveStatus === 'saving'
                              ? 'text-brass/40 cursor-wait'
                              : 'text-brass/70 hover:text-brass'
                      }`}
                    >
                      {saveStatus === 'saved'
                        ? '✓ saved'
                        : saveStatus === 'error'
                          ? '✕ error'
                          : saveStatus === 'saving'
                            ? 'saving...'
                            : '+ save'}
                    </button>
                    <button
                      onClick={() => setIsNarrativeOpen(false)}
                      className="text-[10px] font-mono text-stone/40 hover:text-ink/60 uppercase tracking-widest transition-colors"
                    >
                      ✕ close
                    </button>
                  </div>
                </div>

                {/* Row 2 — playback transport */}
                <div className="px-6 py-2 border-t border-brass/10">
                  <PlaybackControls
                    isPlaying={isPlaying}
                    onToggle={togglePlayback}
                    onRestart={restartPlayback}
                    onSeekBackward={seekBackward}
                    onSeekForward={seekForward}
                  />
                </div>
              </div>

              <div className="overflow-y-auto px-6 py-5">
                {narrativeText.split(/\n\n+/).map((para, i) => (
                  <p
                    key={i}
                    className="text-ink/80 text-sm md:text-base font-spectral leading-relaxed italic mb-4 last:mb-0"
                  >
                    {para.trim()}
                  </p>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default InteractionLayer;
