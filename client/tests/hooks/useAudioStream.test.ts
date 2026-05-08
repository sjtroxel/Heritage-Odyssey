/* eslint-disable @typescript-eslint/no-explicit-any */
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useAudioStream } from '../../src/hooks/useAudioStream.js';

describe('useAudioStream', () => {
  let mockAudio: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockAudio = {
      play: vi.fn().mockResolvedValue(undefined),
      pause: vi.fn(),
      src: '',
      onplay: null,
      onpause: null,
      onended: null,
      onerror: null,
    };

    // Mock global fetch
    global.fetch = vi.fn();

    // Mock URL.createObjectURL and URL.revokeObjectURL
    global.URL.createObjectURL = vi.fn().mockReturnValue('blob:mock-url');
    global.URL.revokeObjectURL = vi.fn();

    // Mock Audio constructor
    global.Audio = vi.fn().mockImplementation(function (this: any) {
      return mockAudio;
    }) as any;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('initializes with default values', () => {
    const { result } = renderHook(() => useAudioStream());
    expect(result.current.isPlaying).toBe(false);
    expect(result.current.error).toBe(null);
  });

  it('plays audio from stream successfully with a token', async () => {
    const mockBlob = new Blob(['audio data'], { type: 'audio/mpeg' });
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      blob: vi.fn().mockResolvedValue(mockBlob),
    });

    const { result } = renderHook(() => useAudioStream());

    await act(async () => {
      await result.current.playStream('test query', 'mock-token');
    });

    expect(global.fetch).toHaveBeenCalledWith('/api/narrative/stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer mock-token',
      },
      body: JSON.stringify({ query: 'test query' }),
    });
    expect(global.URL.createObjectURL).toHaveBeenCalledWith(mockBlob);
    expect(mockAudio.src).toBe('blob:mock-url');
    expect(mockAudio.play).toHaveBeenCalled();
    expect(result.current.isPlaying).toBe(true);
  });

  it('plays audio from stream successfully without a token', async () => {
    const mockBlob = new Blob(['audio data'], { type: 'audio/mpeg' });
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      blob: vi.fn().mockResolvedValue(mockBlob),
    });

    const { result } = renderHook(() => useAudioStream());

    await act(async () => {
      await result.current.playStream('test query');
    });

    expect(global.fetch).toHaveBeenCalledWith('/api/narrative/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: 'test query' }),
    });
    expect(result.current.isPlaying).toBe(true);
  });

  it('handles fetch errors', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: vi.fn().mockResolvedValue({ error: 'Internal Server Error' }),
    });

    const { result } = renderHook(() => useAudioStream());

    await act(async () => {
      await result.current.playStream('test query');
    });

    expect(result.current.error).toBe('Internal Server Error');
    expect(result.current.isPlaying).toBe(false);
  });

  it('handles playback errors', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      blob: vi.fn().mockResolvedValue(new Blob()),
    });

    const { result } = renderHook(() => useAudioStream());

    await act(async () => {
      await result.current.playStream('test query');
    });

    // Simulate audio error
    act(() => {
      if (mockAudio.onerror) mockAudio.onerror();
    });

    expect(result.current.error).toBe('Audio playback error');
    expect(result.current.isPlaying).toBe(false);
  });

  it('updates state when audio starts playing and ends', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      blob: vi.fn().mockResolvedValue(new Blob()),
    });

    const { result } = renderHook(() => useAudioStream());

    await act(async () => {
      await result.current.playStream('test query');
    });

    // Initially true because playStream sets it
    expect(result.current.isPlaying).toBe(true);

    // Simulate pause
    act(() => {
      if (mockAudio.onpause) mockAudio.onpause();
    });
    expect(result.current.isPlaying).toBe(false);

    // Simulate play
    act(() => {
      if (mockAudio.onplay) mockAudio.onplay();
    });
    expect(result.current.isPlaying).toBe(true);

    // Simulate end
    act(() => {
      if (mockAudio.onended) mockAudio.onended();
    });
    expect(result.current.isPlaying).toBe(false);
  });

  it('cleans up on unmount', async () => {
    const { result, unmount } = renderHook(() => useAudioStream());

    // Trigger audio creation
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      blob: vi.fn().mockResolvedValue(new Blob()),
    });

    await act(async () => {
      await result.current.playStream('test query');
    });

    unmount();

    expect(mockAudio.pause).toHaveBeenCalled();
    expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
  });
});
