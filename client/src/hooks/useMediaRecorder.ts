import { useState, useCallback, useRef, useEffect } from 'react';

interface UseMediaRecorderProps {
  onComplete: (blob: Blob, mimeType: string) => void;
}

/**
 * Hook to manage audio recording using the MediaRecorder API.
 * Handles microphone permissions, MIME type detection, and provides recording controls.
 */
export const useMediaRecorder = ({ onComplete }: UseMediaRecorderProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  /**
   * Detects the best supported audio MIME type.
   * Prefer "audio/webm;codecs=opus" (Chrome/Android), fall back to "audio/mp4" (iOS Safari).
   */
  const getSupportedMimeType = useCallback(() => {
    if (typeof MediaRecorder === 'undefined') return '';

    const types = ['audio/webm;codecs=opus', 'audio/mp4'];
    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }
    return '';
  }, []);

  const [isSupported] = useState(() => !!getSupportedMimeType());

  const startRecording = useCallback(async () => {
    if (!isSupported) {
      console.warn('MediaRecorder or supported MIME types not available.');
      return;
    }

    try {
      const mimeType = getSupportedMimeType();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        onComplete(blob, mimeType);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setPermissionDenied(false);
    } catch (err) {
      if (err instanceof Error && err.name === 'NotAllowedError') {
        setPermissionDenied(true);
      } else {
        console.error('Error accessing microphone:', err);
      }
    }
  }, [onComplete, getSupportedMimeType, isSupported]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);

      // Cleanup stream tracks immediately on stop to release the microphone
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  return {
    isRecording,
    permissionDenied,
    isSupported,
    startRecording,
    stopRecording,
  };
};
