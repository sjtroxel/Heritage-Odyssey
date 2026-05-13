import { useState, useCallback, useRef, useEffect } from 'react';
import { apiUrl, authFetch } from '../lib/api.js';
import { useAuthContext } from '../context/AuthContext.js';

/**
 * Hook to handle playback of the streaming audio from the narrative endpoint.
 * Uses fetch + createObjectURL to support POST requests for audio data.
 */
export const useAudioStream = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const { token, refresh } = useAuthContext();

  const cleanup = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      // Remove listeners to avoid memory leaks or unexpected state updates
      audioRef.current.onplay = null;
      audioRef.current.onpause = null;
      audioRef.current.onended = null;
      audioRef.current.onerror = null;
      audioRef.current.src = '';
    }
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  }, []);

  const playStream = useCallback(
    async (query: string, overrideToken?: string) => {
      // Stop any current playback and clear previous errors
      cleanup();
      setError(null);
      setIsPlaying(true);

      try {
        const response = await authFetch(
          apiUrl('/api/narrative/stream'),
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query }),
          },
          overrideToken || token,
          refresh,
        );

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        objectUrlRef.current = url;

        if (!audioRef.current) {
          audioRef.current = new Audio();
        }

        // Attach listeners for state synchronization
        audioRef.current.onplay = () => setIsPlaying(true);
        audioRef.current.onpause = () => setIsPlaying(false);
        audioRef.current.onended = () => setIsPlaying(false);
        audioRef.current.onerror = () => {
          setError('Audio playback error');
          setIsPlaying(false);
        };

        audioRef.current.src = url;
        await audioRef.current.play();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error during audio streaming');
        setIsPlaying(false);
      }
    },
    [cleanup, token, refresh],
  );

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return {
    playStream,
    isPlaying,
    error,
  };
};
