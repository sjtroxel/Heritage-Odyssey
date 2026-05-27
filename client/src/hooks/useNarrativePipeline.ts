import { useState, useCallback, useRef, useEffect } from 'react';
import { apiUrl, authFetch } from '../lib/api.js';
import { useAuthContext } from '../context/AuthContext.js';

const AGENT_LABELS: Record<string, string> = {
  researcher: 'Consulting the Historical Archive...',
  synthesizer: 'Weaving the Ancestral Narrative...',
  narrator: 'Voicing the Chronicle...',
};

interface AgentStepData {
  agent: string;
}

interface CompleteData {
  text: string;
}

interface HandoffData {
  package: {
    suggestion?: string;
  };
}

interface ErrorData {
  error: string;
}

/**
 * Hook to manage the full narrative pipeline:
 * 1. SSE stream from /api/narrative/generate for agent progress and text.
 * 2. POST to /api/narrative/tts for audio playback.
 */
export const useNarrativePipeline = () => {
  const [agentStep, setAgentStep] = useState<string | null>(null);
  const [narrativeText, setNarrativeText] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const { token, refresh } = useAuthContext();

  const cleanup = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
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

  const playTTS = useCallback(
    async (text: string) => {
      try {
        setIsPlaying(true);
        const response = await authFetch(
          apiUrl('/api/narrative/tts'),
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ text }),
          },
          token,
          refresh,
        );

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        objectUrlRef.current = url;

        if (!audioRef.current) {
          audioRef.current = new Audio();
        }

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
        setError(err instanceof Error ? err.message : 'TTS playback failed');
        setIsPlaying(false);
      }
    },
    [token, refresh],
  );

  const run = useCallback(
    async (query: string) => {
      cleanup();
      setAgentStep(null);
      setNarrativeText(null);
      setError(null);
      setIsRunning(true);
      setIsPlaying(false);

      try {
        const response = await authFetch(
          apiUrl('/api/narrative/generate'),
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query }),
          },
          token,
          refresh,
        );

        if (!response.body) {
          throw new Error('Response body is empty');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const messages = buffer.split('\n\n');
          buffer = messages.pop() || '';

          for (const message of messages) {
            const lines = message.split('\n');
            let type = '';
            let rawData = '';

            for (const line of lines) {
              if (line.startsWith('event: ')) {
                type = line.replace('event: ', '').trim();
              } else if (line.startsWith('data: ')) {
                rawData = line.replace('data: ', '').trim();
              }
            }

            if (!rawData) continue;

            if (type === 'agent_step') {
              const data = JSON.parse(rawData) as AgentStepData;
              if (data.agent) {
                setAgentStep(AGENT_LABELS[data.agent] || data.agent);
              }
            } else if (type === 'complete') {
              const data = JSON.parse(rawData) as CompleteData;
              if (data.text) {
                setNarrativeText(data.text);
                setAgentStep(null);
                setIsRunning(false);
                await playTTS(data.text);
              }
            } else if (type === 'handoff') {
              const data = JSON.parse(rawData) as HandoffData;
              if (data.package) {
                setError(data.package.suggestion || 'No records found for this query.');
                setIsRunning(false);
                return;
              }
            } else if (type === 'error') {
              const data = JSON.parse(rawData) as ErrorData;
              setError(data.error || 'Narrative generation failed');
              setIsRunning(false);
              return;
            }
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Pipeline execution failed');
      } finally {
        setIsRunning(false);
      }
    },
    [cleanup, playTTS, token, refresh],
  );

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return {
    run,
    agentStep,
    narrativeText,
    isRunning,
    isPlaying,
    error,
  };
};
