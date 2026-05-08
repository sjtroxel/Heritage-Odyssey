import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * Hook to handle playback of the streaming audio from the narrative endpoint.
 * Uses fetch + createObjectURL to support POST requests for audio data.
 */
export const useAudioStream = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);

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
    async (query: string, token?: string) => {
      // Stop any current playback and clear previous errors
      cleanup();
      setError(null);
      setIsPlaying(true);

      try {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };

        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch('/api/narrative/stream', {
          method: 'POST',
          headers,
          body: JSON.stringify({ query }),
        });

        if (!response.ok) {
          let errorMessage = `Stream failed with status ${response.status}`;
          try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
          } catch {
            // Fallback to default message if response isn't JSON
          }
          throw new Error(errorMessage);
        }

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
    [cleanup],
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
