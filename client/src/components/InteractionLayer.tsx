import React, { useState, useCallback } from 'react';
import { Mic, Send, Square, Loader2, Volume2 } from 'lucide-react';
import { useMediaRecorder } from '../hooks/useMediaRecorder.js';
import { useAudioStream } from '../hooks/useAudioStream.js';
import { apiUrl, authFetch } from '../lib/api.js';
import AudioVisualizer from './AudioVisualizer.js';
import { useAuthContext } from '../context/AuthContext.js';

/**
 * Sticky-bottom interaction layer providing voice and text input.
 * Handles the orchestration between recording, transcription, and narrative streaming.
 */
const InteractionLayer: React.FC = () => {
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const { token, refresh } = useAuthContext();

  const { playStream, isPlaying, error: audioError } = useAudioStream();

  const onRecordingComplete = useCallback(
    async (blob: Blob, _mimeType: string) => {
      setIsProcessing(true);
      try {
        const formData = new FormData();
        // Use a generic name, the server will detect the type
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
    <div className="fixed bottom-0 left-0 right-0 bg-cast-iron-dark border-t border-brass p-4 md:px-6 md:py-8 pointer-events-auto z-40">
      <div className="max-w-2xl mx-auto">
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

          {audioError && (
            <div className="text-paper/90 text-xs font-spectral bg-red-950/30 px-3 py-1 border border-red-900/50">
              {audioError}
            </div>
          )}

          {permissionDenied && (
            <div className="text-paper/90 text-xs font-spectral bg-amber-950/30 px-3 py-1 border border-amber-900/50">
              Microphone access denied.
            </div>
          )}
        </div>

        {/* Interaction Bar */}
        <div className="bg-cast-iron-dark/50 border border-brass/30 p-2 flex items-center gap-3">
          {isSupported && (
            <button
              onMouseDown={startRecording}
              onMouseUp={stopRecording}
              onTouchStart={startRecording}
              onTouchEnd={stopRecording}
              className={`shrink-0 w-14 h-14 rounded-full flex items-center justify-center transition-all border-2 ${
                isRecording
                  ? 'bg-brass text-cast-iron-dark scale-95 shadow-inner border-brass'
                  : 'bg-brass/10 text-brass hover:bg-brass/20 border-brass/40'
              }`}
              title="Hold to speak"
            >
              {isRecording ? (
                <Square size={24} fill="currentColor" />
              ) : (
                <Mic size={24} strokeWidth={1.5} />
              )}
            </button>
          )}

          <form onSubmit={handleSubmit} className="grow flex items-center gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Press & Hold Mic or Type to Search the Archive"
              className="grow bg-cast-iron border-none focus:ring-1 focus:ring-brass/30 text-paper placeholder:text-paper/20 text-base py-3 px-4 font-spectral"
              disabled={isProcessing || isRecording}
            />

            <div className="flex items-center gap-2 pr-1">
              <button
                type="submit"
                disabled={!inputValue.trim() || isProcessing || isRecording}
                className="w-12 h-12 bg-brass text-cast-iron-dark flex items-center justify-center hover:bg-brass/90 disabled:opacity-20 transition-all"
              >
                <Send size={20} strokeWidth={1.5} />
              </button>
            </div>
          </form>
        </div>

        <p className="text-[10px] text-center text-paper/30 mt-4 uppercase tracking-[0.2em] font-spectral font-bold">
          {isRecording
            ? 'Capturing Oral History...'
            : 'Authorized Personnel Only // Archive Access'}
        </p>
      </div>
    </div>
  );
};

export default InteractionLayer;
