import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Mic, Send, Square, Loader2, Volume2, GripHorizontal } from 'lucide-react';
import { useMediaRecorder } from '../hooks/useMediaRecorder.js';
import { useNarrativePipeline } from '../hooks/useNarrativePipeline.js';
import { apiUrl, authFetch, RateLimitError } from '../lib/api.js';
import AudioVisualizer from './AudioVisualizer.js';
import { useAuthContext } from '../context/AuthContext.js';
import AgentObservabilityLog from './AgentObservabilityLog.js';

const SAMPLE_QUERIES = [
  'Describe the journey of immigrants crossing the Atlantic in the nineteenth century',
  'What was daily life like for European settlers arriving in American cities in the 1890s?',
  'Tell me about the experience of arriving at Ellis Island around 1900',
  'Describe conditions aboard immigrant ships during the great migration era',
];

/**
 * Sticky-bottom interaction layer providing voice and text input.
 * Includes a draggable handle to adjust height for better mobile usability.
 */
const InteractionLayer: React.FC = () => {
  const [inputValue, setInputValue] = useState('');
  const [containerHeight, setContainerHeight] = useState(180); // Default height
  const [countdown, setCountdown] = useState<number | null>(null);
  const isResizing = useRef(false);

  const { token, refresh } = useAuthContext();
  const {
    run,
    reset,
    agentStep,
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

  // Resize logic
  const startResizing = useCallback(() => {
    isResizing.current = true;
    document.body.style.cursor = 'ns-resize';
    document.body.style.userSelect = 'none';
  }, []);

  const stopResizing = useCallback(() => {
    isResizing.current = false;
    document.body.style.cursor = 'default';
    document.body.style.userSelect = 'auto';
  }, []);

  const resize = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isResizing.current) return;

    const clientY = 'touches' in e ? e.touches[0]?.clientY : (e as MouseEvent).clientY;
    if (clientY === undefined) return;

    const newHeight = window.innerHeight - clientY;
    // Constrain height
    if (newHeight > 140 && newHeight < window.innerHeight * 0.8) {
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
          await run(data.text);
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
    [run, reset, setRateLimitReset, token, refresh],
  );

  const { isRecording, startRecording, stopRecording, isSupported, permissionDenied } =
    useMediaRecorder({ onComplete: onRecordingComplete });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isRunning || isRecording) return;
    await run(inputValue);
  };

  const hasStatus = isRecording || isPlaying || isRunning || pipelineError || permissionDenied;

  const showClear = narrativeText || agentLog.length > 0 || pipelineError || rateLimitReset;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 bg-cast-iron border-t border-brass shadow-[0_-10px_40px_rgba(0,0,0,0.5)] pointer-events-auto z-40 flex flex-col transition-[height] duration-75 ease-out"
      style={{ height: `${containerHeight}px` }}
    >
      {/* Draggable Handle Bar */}
      <div
        onMouseDown={startResizing}
        onTouchStart={startResizing}
        className="w-full h-8 flex items-center justify-center cursor-ns-resize hover:bg-brass/5 active:bg-brass/10 transition-colors group border-b border-brass/10 shrink-0"
      >
        <div className="flex flex-col items-center gap-0.5">
          <GripHorizontal
            size={16}
            className="text-brass/40 group-hover:text-brass transition-colors"
          />
          <div className="w-12 h-0.5 bg-brass/20 group-hover:bg-brass/40 rounded-full"></div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 md:px-6 pb-6 pt-0 flex flex-col justify-start">
        <div className="max-w-2xl mx-auto w-full pt-4">
          {narrativeText && (
            <div className="mb-4 p-3 border border-brass/20 bg-cast-iron-dark/50 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {narrativeText.split(/\n\n+/).map((para, i) => (
                <p
                  key={i}
                  className="text-paper/90 text-sm font-spectral leading-relaxed italic mb-3 last:mb-0"
                >
                  {para.trim()}
                </p>
              ))}
            </div>
          )}

          {!isRunning && !narrativeText && (
            <div className="mb-4">
              <p className="text-[9px] uppercase tracking-widest font-libre text-paper/30 mb-2 text-center">
                Example Queries
              </p>
              <div className="flex flex-col gap-1.5">
                {SAMPLE_QUERIES.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setInputValue(q);
                      run(q);
                    }}
                    className="text-left text-[10px] font-spectral italic text-paper/50 hover:text-paper/80 border border-brass/10 hover:border-brass/30 px-3 py-1.5 transition-colors bg-transparent"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

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

              {isRunning && agentStep && (
                <div className="flex items-center gap-2 text-paper/80 text-xs font-spectral italic animate-in fade-in slide-in-from-bottom-2">
                  <Loader2 size={14} className="animate-spin text-brass" />
                  <span>{agentStep}</span>
                </div>
              )}

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
                placeholder="Press & Hold Mic or Type to Search..."
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

          <p className="text-[9px] md:text-[10px] text-center text-paper/30 mt-4 uppercase tracking-[0.25em] font-libre font-bold">
            {isRecording
              ? 'Capturing Oral History...'
              : 'Authorized Personnel Only // Registry Access'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default InteractionLayer;
