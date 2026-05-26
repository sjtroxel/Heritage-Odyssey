import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Mic, Send, Square, Loader2, Volume2, GripHorizontal } from 'lucide-react';
import { useMediaRecorder } from '../hooks/useMediaRecorder.js';
import { useAudioStream } from '../hooks/useAudioStream.js';
import { apiUrl, authFetch } from '../lib/api.js';
import AudioVisualizer from './AudioVisualizer.js';
import { useAuthContext } from '../context/AuthContext.js';

/**
 * Sticky-bottom interaction layer providing voice and text input.
 * Includes a draggable handle to adjust height for better mobile usability.
 */
const InteractionLayer: React.FC = () => {
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [containerHeight, setContainerHeight] = useState(180); // Default height
  const isResizing = useRef(false);

  const { token, refresh } = useAuthContext();
  const { playStream, isPlaying, error: audioError } = useAudioStream();

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
      setIsProcessing(true);
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
          await playStream(data.text);
        }
      } catch (err) {
        console.error('Transcription error:', err);
      } finally {
        setIsProcessing(false);
      }
    },
    [playStream, token, refresh],
  );

  const { isRecording, startRecording, stopRecording, isSupported, permissionDenied } =
    useMediaRecorder({ onComplete: onRecordingComplete });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isProcessing || isRecording) return;
    await playStream(inputValue);
  };

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

      <div className="flex-1 overflow-y-auto px-4 md:px-6 pb-6 flex flex-col justify-center">
        <div className="max-w-2xl mx-auto w-full">
          {/* Status / Visualizer Area */}
          <div className="flex flex-col items-center mb-6 h-10 justify-center">
            <AudioVisualizer isActive={isRecording} mode="recording" />
            <AudioVisualizer isActive={isPlaying} mode="playing" />

            {isProcessing && (
              <div className="flex items-center gap-2 text-paper/80 text-xs font-spectral italic animate-in fade-in slide-in-from-bottom-2">
                <Loader2 size={14} className="animate-spin text-brass" />
                <span>Transcribing the Record...</span>
              </div>
            )}

            {isPlaying && !isProcessing && (
              <div className="flex items-center gap-2 text-paper/80 text-xs font-spectral italic animate-in fade-in">
                <Volume2 size={14} className="animate-pulse text-brass" />
                <span>Consulting the Registry...</span>
              </div>
            )}

            {(audioError || permissionDenied) && (
              <div className="text-paper/90 text-[10px] uppercase tracking-widest font-libre bg-red-950/40 px-4 py-1.5 border border-red-900/50 rounded-sm">
                {audioError ? 'Record Unreadable — Please Retry' : 'Microphone Access Restricted'}
              </div>
            )}
          </div>

          {/* Interaction Bar */}
          <div className="bg-cast-iron-dark border border-brass p-1.5 md:p-2 flex items-center gap-2 md:gap-3 shadow-2xl relative">
            <div className="absolute inset-0 bg-brass/5 pointer-events-none"></div>

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
                disabled={isProcessing || isRecording}
              />

              <button
                type="submit"
                disabled={!inputValue.trim() || isProcessing || isRecording}
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
