import React, { useState, useCallback } from 'react';
import { Mic, Send, Square, Loader2, Volume2, VolumeX } from 'lucide-react';
import { useMediaRecorder } from '../hooks/useMediaRecorder';
import { useAudioStream } from '../hooks/useAudioStream';
import { apiUrl } from '../lib/api';
import AudioVisualizer from './AudioVisualizer';

/**
 * Sticky-bottom interaction layer providing voice and text input.
 * Handles the orchestration between recording, transcription, and narrative streaming.
 */
const InteractionLayer: React.FC = () => {
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const { playStream, isPlaying, error: audioError } = useAudioStream();

  const onRecordingComplete = useCallback(
    async (blob: Blob, _mimeType: string) => {
      setIsProcessing(true);
      try {
        const formData = new FormData();
        // Use a generic name, the server will detect the type
        formData.append('audio', blob, 'recording.audio');

        const response = await fetch(apiUrl('/api/voice/transcribe'), {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Failed to transcribe audio');
        }

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
    [playStream],
  );

  const { isRecording, startRecording, stopRecording, isSupported, permissionDenied } =
    useMediaRecorder({ onComplete: onRecordingComplete });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isProcessing || isRecording) return;

    await playStream(inputValue);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 md:p-6 bg-linear-to-t from-slate-50 via-slate-50/90 to-transparent pointer-events-none">
      <div className="max-w-xl mx-auto pointer-events-auto">
        {/* Status / Visualizer Area */}
        <div className="flex flex-col items-center mb-4">
          <AudioVisualizer isActive={isRecording} mode="recording" />
          <AudioVisualizer isActive={isPlaying} mode="playing" />

          {isProcessing && (
            <div className="flex items-center gap-2 text-indigo-600 text-sm font-medium bg-white px-3 py-1 rounded-full shadow-xs border border-indigo-100 animate-in fade-in slide-in-from-bottom-2">
              <Loader2 size={14} className="animate-spin" />
              <span>Synthesizing History...</span>
            </div>
          )}

          {audioError && (
            <div className="text-red-500 text-xs bg-red-50 px-3 py-1 rounded-full border border-red-100">
              {audioError}
            </div>
          )}

          {permissionDenied && (
            <div className="text-amber-600 text-xs bg-amber-50 px-3 py-1 rounded-full border border-amber-100">
              Microphone access denied.
            </div>
          )}
        </div>

        {/* Interaction Bar */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-2 flex items-center gap-2">
          {isSupported && (
            <button
              onMouseDown={startRecording}
              onMouseUp={stopRecording}
              onTouchStart={startRecording}
              onTouchEnd={stopRecording}
              className={`shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                isRecording
                  ? 'bg-red-500 text-white scale-95 shadow-inner'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
              title="Hold to speak"
            >
              {isRecording ? <Square size={20} fill="currentColor" /> : <Mic size={20} />}
            </button>
          )}

          <form onSubmit={handleSubmit} className="grow flex items-center gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask about your ancestors..."
              className="grow bg-transparent border-none focus:ring-0 text-slate-900 placeholder:text-slate-400 text-base py-2 px-1"
              disabled={isProcessing || isRecording}
            />

            <div className="flex items-center gap-1 pr-1">
              {isPlaying ? (
                <div className="text-indigo-600 p-2">
                  <Volume2 size={20} className="animate-pulse" />
                </div>
              ) : (
                <div className="text-slate-300 p-2">
                  <VolumeX size={20} />
                </div>
              )}

              <button
                type="submit"
                disabled={!inputValue.trim() || isProcessing || isRecording}
                className="w-10 h-10 rounded-lg bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-700 disabled:opacity-30 disabled:hover:bg-indigo-600 transition-colors"
              >
                <Send size={18} />
              </button>
            </div>
          </form>
        </div>

        <p className="text-[10px] text-center text-slate-400 mt-2 uppercase tracking-widest font-semibold">
          {isRecording ? 'Release to Send' : 'Press & Hold Mic or Type to Search'}
        </p>
      </div>
    </div>
  );
};

export default InteractionLayer;
