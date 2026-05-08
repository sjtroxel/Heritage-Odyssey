/* eslint-disable @typescript-eslint/no-explicit-any */
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useMediaRecorder } from '../../src/hooks/useMediaRecorder.js';

describe('useMediaRecorder', () => {
  const onComplete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock MediaRecorder
    global.MediaRecorder = vi.fn().mockImplementation(function (this: any) {
      this.start = vi.fn().mockImplementation(() => {
        this.state = 'recording';
        // Simulate data available immediately for simple testing
        if (this.ondataavailable) {
          this.ondataavailable({ data: new Blob(['test'], { type: 'audio/webm' }) });
        }
      });
      this.stop = vi.fn().mockImplementation(() => {
        this.state = 'inactive';
        if (this.onstop) {
          this.onstop();
        }
      });
      this.state = 'inactive';
      this.ondataavailable = null;
      this.onstop = null;
    }) as any;
    (global.MediaRecorder as any).isTypeSupported = vi.fn().mockReturnValue(true);

    // Mock getUserMedia
    const mockStream = {
      getTracks: vi.fn().mockReturnValue([{ stop: vi.fn() }]),
    };

    // Using Object.defineProperty because navigator.mediaDevices is read-only in some environments
    Object.defineProperty(global.navigator, 'mediaDevices', {
      value: {
        getUserMedia: vi.fn().mockResolvedValue(mockStream),
      },
      writable: true,
      configurable: true,
    });
  });

  it('initializes with default values', () => {
    const { result } = renderHook(() => useMediaRecorder({ onComplete }));
    expect(result.current.isRecording).toBe(false);
    expect(result.current.permissionDenied).toBe(false);
    expect(result.current.isSupported).toBe(true);
  });

  it('updates state when recording starts', async () => {
    const { result } = renderHook(() => useMediaRecorder({ onComplete }));

    await act(async () => {
      await result.current.startRecording();
    });

    expect(result.current.isRecording).toBe(true);
    expect(global.navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({ audio: true });
  });

  it('updates state when recording stops', async () => {
    const { result } = renderHook(() => useMediaRecorder({ onComplete }));

    await act(async () => {
      await result.current.startRecording();
    });

    // Verify it started
    expect(result.current.isRecording).toBe(true);

    act(() => {
      result.current.stopRecording();
    });

    expect(result.current.isRecording).toBe(false);
  });

  it('calls onComplete with blob and mimeType when recording stops', async () => {
    const { result } = renderHook(() => useMediaRecorder({ onComplete }));

    await act(async () => {
      await result.current.startRecording();
    });

    act(() => {
      result.current.stopRecording();
    });

    expect(onComplete).toHaveBeenCalledWith(expect.any(Blob), expect.any(String));
    const [blob, mimeType] = onComplete.mock.calls[0];
    expect(blob.size).toBeGreaterThan(0);
    expect(typeof mimeType).toBe('string');
  });

  it('handles permission denied', async () => {
    const error = new Error('Permission denied');
    error.name = 'NotAllowedError';
    (global.navigator.mediaDevices.getUserMedia as any).mockRejectedValueOnce(error);

    const { result } = renderHook(() => useMediaRecorder({ onComplete }));

    await act(async () => {
      await result.current.startRecording();
    });

    expect(result.current.isRecording).toBe(false);
    expect(result.current.permissionDenied).toBe(true);
  });
});
