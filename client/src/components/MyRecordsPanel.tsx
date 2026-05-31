import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Trash2, X, Square, Info } from 'lucide-react';
import PlaybackControls from './PlaybackControls.js';
import { apiUrl, authFetch, RateLimitError } from '../lib/api.js';
import { useAuthContext } from '../context/AuthContext.js';
import { useDailyQuota } from '../hooks/useDailyQuota.js';
import { VOICES } from '@heritage-odyssey/shared/voices';

interface SavedRecord {
  id: string;
  query: string;
  contentText: string;
  createdAt: string;
  ancestorProfileId: string | null;
  ancestorName?: string | null;
}

interface MyRecordsPanelProps {
  onClose: () => void;
}

const MyRecordsPanel: React.FC<MyRecordsPanelProps> = ({ onClose }) => {
  const { token, refresh } = useAuthContext();
  const { quota, refreshQuota } = useDailyQuota();
  const quotaExhausted = quota?.remaining === 0;
  const [records, setRecords] = useState<SavedRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [renaratingId, setRenaratingId] = useState<string | null>(null);
  const [activeVoiceId, setActiveVoiceId] = useState<string | null>(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [isAudioLoaded, setIsAudioLoaded] = useState(false);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const objectUrlRef = React.useRef<string | null>(null);
  // Bumped whenever playback is stopped/superseded, so an in-flight re-narrate
  // request that resolves after a stop knows to bail instead of orphaning audio.
  const playGenRef = React.useRef(0);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpanded = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await authFetch(apiUrl('/api/records'), {}, token, refresh);
      const data: SavedRecord[] = await res.json();
      setRecords(data);
    } catch {
      setError('Failed to load records. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [token, refresh]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchRecords();
  }, [fetchRecords]);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
  }, []);

  const handleToggleAudio = useCallback(() => {
    if (!audioRef.current) return;
    if (isAudioPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(() => {});
    }
  }, [isAudioPlaying]);

  const handleRestartAudio = useCallback(() => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = 0;
    audioRef.current.play().catch(() => {});
  }, []);

  const handleSeekBackward = useCallback(() => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 10);
  }, []);

  const handleSeekForward = useCallback(() => {
    if (!audioRef.current) return;
    const dur = audioRef.current.duration;
    audioRef.current.currentTime = isFinite(dur)
      ? Math.min(dur, audioRef.current.currentTime + 10)
      : audioRef.current.currentTime + 10;
  }, []);

  const handleStopAudio = useCallback(() => {
    playGenRef.current += 1;
    audioRef.current?.pause();
    if (audioRef.current) audioRef.current.src = '';
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    audioRef.current = null;
    setIsAudioPlaying(false);
    setIsAudioLoaded(false);
    setRenaratingId(null);
    setActiveVoiceId(null);
  }, []);

  const handleDelete = useCallback(
    async (id: string) => {
      setDeletingId(id);
      try {
        await authFetch(apiUrl(`/api/records/${id}`), { method: 'DELETE' }, token, refresh);
        setRecords((prev) => prev.filter((r) => r.id !== id));
      } catch {
        // silently leave the card — a retry will work
      } finally {
        setDeletingId(null);
      }
    },
    [token, refresh],
  );

  const handleRenarrate = useCallback(
    async (record: SavedRecord, voiceId: string) => {
      // No early-return guard: clicking another voice (or another record) while
      // audio is playing should supersede the current playback, not be ignored.
      const gen = (playGenRef.current += 1);
      audioRef.current?.pause();
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
      setRenaratingId(record.id);
      setActiveVoiceId(voiceId);
      setIsAudioPlaying(false);
      setIsAudioLoaded(false);
      try {
        const res = await authFetch(
          apiUrl('/api/narrative/tts'),
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: record.contentText, voiceId }),
          },
          token,
          refresh,
        );
        const blob = await res.blob();
        // If playback was stopped (or a newer re-narrate started) while this
        // request was in flight, bail before creating/playing any audio.
        if (playGenRef.current !== gen) return;
        const url = URL.createObjectURL(blob);
        objectUrlRef.current = url;
        const audio = new Audio(url);
        audioRef.current = audio;
        setIsAudioLoaded(true);
        refreshQuota(); // a synthesis consumed one unit
        audio.onplay = () => setIsAudioPlaying(true);
        audio.onpause = () => setIsAudioPlaying(false);
        audio.onended = () => {
          URL.revokeObjectURL(url);
          objectUrlRef.current = null;
          audioRef.current = null;
          setIsAudioPlaying(false);
          setIsAudioLoaded(false);
          setRenaratingId(null);
          setActiveVoiceId(null);
        };
        await audio.play();
      } catch (err) {
        setRenaratingId(null);
        setActiveVoiceId(null);
        if (err instanceof RateLimitError) {
          // Server says the allowance is spent — sync the counter to reflect it.
          refreshQuota();
        }
      }
    },
    [token, refresh, refreshQuota],
  );

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <motion.div
      className="fixed inset-0 z-60 flex items-center justify-center p-4 md:p-8"
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      <motion.div
        className="relative w-full max-w-2xl bg-paper border border-brass/30 shadow-2xl flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 8 }}
        transition={{ type: 'spring', stiffness: 320, damping: 30 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-brass/20 shrink-0">
          <span className="text-[10px] font-libre font-bold uppercase tracking-[0.2em] text-stone/60">
            My Records
          </span>
          <button
            onClick={onClose}
            className="text-[10px] font-mono text-stone/40 hover:text-ink/60 uppercase tracking-widest transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-4 sm:px-6 py-5">
          {loading && (
            <div className="flex items-center justify-center py-12 gap-3 text-stone/50">
              <Loader2 size={16} className="animate-spin" />
              <span className="text-xs font-mono uppercase tracking-widest">
                Consulting the Registry...
              </span>
            </div>
          )}

          {!loading && error && (
            <p className="text-center text-xs font-mono text-red-400/70 py-8 uppercase tracking-widest">
              {error}
            </p>
          )}

          {!loading && !error && records.length === 0 && (
            <p className="text-center text-sm font-spectral italic text-stone/50 py-12">
              No records have been committed to the Registry.
            </p>
          )}

          {!loading && !error && records.length > 0 && quota && (
            <div
              className={`flex items-center gap-2 mb-4 px-3 py-2 border rounded-sm text-[10px] font-mono uppercase tracking-widest ${
                quotaExhausted
                  ? 'border-rose-300/40 bg-rose-200/10 text-rose-300/90'
                  : 'border-brass/20 bg-brass/5 text-stone/60'
              }`}
            >
              <Info size={12} className="shrink-0" />
              <span>
                {quotaExhausted
                  ? 'Daily narration limit reached · resets midnight UTC'
                  : `Choosing a voice re-narrates · uses 1 of ${quota.limit} daily · ${quota.remaining} left`}
              </span>
            </div>
          )}

          {!loading && !error && records.length > 0 && (
            <ul className="flex flex-col gap-4">
              {records.map((record) => {
                const isExpanded = expandedIds.has(record.id);
                return (
                  <li
                    key={record.id}
                    className="border border-brass/15 bg-stone/5 p-4 flex flex-col gap-2"
                  >
                    <p className="text-xs font-libre font-bold uppercase tracking-wider text-ink/80 line-clamp-2">
                      {record.query}
                    </p>

                    {record.ancestorName && (
                      <p className="text-[10px] font-mono uppercase tracking-widest text-brass/70">
                        Narrated for: {record.ancestorName}
                      </p>
                    )}

                    {isExpanded ? (
                      <div className="flex flex-col gap-3 pt-1">
                        {record.contentText.split(/\n\n+/).map((para, i) => (
                          <p
                            key={i}
                            className="text-sm font-spectral italic text-ink/70 leading-relaxed"
                          >
                            {para.trim()}
                          </p>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs font-spectral italic text-stone/60 line-clamp-3 leading-relaxed">
                        {record.contentText}
                      </p>
                    )}

                    <button
                      onClick={() => toggleExpanded(record.id)}
                      className="text-[9px] font-mono uppercase tracking-widest text-brass/50 hover:text-brass transition-colors self-start"
                    >
                      {isExpanded ? '▾ collapse' : '▸ read record'}
                    </button>

                    {/* Narration voice switcher — re-narrate the saved text in any voice */}
                    <div className="border-t border-brass/15 pt-2 mt-1 flex flex-col gap-2">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
                        <span className="text-[9px] font-mono uppercase tracking-widest text-stone/40 shrink-0">
                          Narrate in
                        </span>
                        <div
                          role="radiogroup"
                          aria-label="Narration voice"
                          className="flex flex-wrap gap-1"
                        >
                          {VOICES.map((voice) => {
                            const isActiveVoice =
                              renaratingId === record.id && activeVoiceId === voice.id;
                            return (
                              <button
                                key={voice.id}
                                type="button"
                                role="radio"
                                aria-checked={isActiveVoice}
                                disabled={quotaExhausted && !isActiveVoice}
                                onClick={() => handleRenarrate(record, voice.id)}
                                title={
                                  quotaExhausted
                                    ? 'Daily narration limit reached'
                                    : voice.description
                                }
                                className={`px-2 py-0.5 rounded-sm border text-[9px] font-mono uppercase tracking-widest transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
                                  isActiveVoice
                                    ? 'bg-brass text-paper border-brass'
                                    : 'border-brass/25 text-brass/60 hover:border-brass/50 hover:text-brass'
                                }`}
                              >
                                {voice.label}
                              </button>
                            );
                          })}
                        </div>
                        {renaratingId === record.id && (
                          <button
                            onClick={handleStopAudio}
                            className="flex items-center gap-1 text-[9px] font-mono uppercase tracking-widest text-brass/60 hover:text-red-400/70 transition-colors ml-auto"
                          >
                            {isAudioLoaded ? (
                              <Square size={10} fill="currentColor" />
                            ) : (
                              <Loader2 size={10} className="animate-spin" />
                            )}
                            {isAudioLoaded ? 'stop' : 'loading...'}
                          </button>
                        )}
                      </div>

                      {renaratingId === record.id && isAudioLoaded && (
                        <PlaybackControls
                          isPlaying={isAudioPlaying}
                          onToggle={handleToggleAudio}
                          onRestart={handleRestartAudio}
                          onSeekBackward={handleSeekBackward}
                          onSeekForward={handleSeekForward}
                        />
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[9px] font-mono text-stone/40 uppercase tracking-widest">
                        {formatDate(record.createdAt)}
                      </span>
                      <button
                        onClick={() => handleDelete(record.id)}
                        disabled={deletingId === record.id}
                        className="flex items-center gap-1 text-[9px] font-mono uppercase tracking-widest text-stone/40 hover:text-red-400/70 disabled:opacity-30 transition-colors"
                      >
                        {deletingId === record.id ? (
                          <Loader2 size={10} className="animate-spin" />
                        ) : (
                          <Trash2 size={10} />
                        )}
                        delete
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default MyRecordsPanel;
