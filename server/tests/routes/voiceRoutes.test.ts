import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app.js';
import * as voiceService from '../../src/services/voiceService.js';
import * as narrativeService from '../../src/services/narrativeService.js';
import jwt from 'jsonwebtoken';
import { Readable } from 'stream';

// Bypass rate limiting so tests don't exhaust the 10-req window
vi.mock('express-rate-limit', () => ({
  rateLimit: () => (_req: unknown, _res: unknown, next: () => void) => next(),
}));

// Mock services to isolate route logic
vi.mock('../../src/services/voiceService.js', () => ({
  transcribeAudio: vi.fn(),
  streamNarrative: vi.fn(),
}));

vi.mock('../../src/services/narrativeService.js', () => ({
  generateNarrative: vi.fn(),
  generateNarrativeStream: vi.fn(),
}));

// Mock jwt for authentication middleware
vi.mock('jsonwebtoken', () => ({
  default: {
    verify: vi.fn(),
  },
}));

describe('Voice Routes Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Simulate successful authentication by default
    vi.mocked(jwt.verify).mockReturnValue({ sub: 'user-123' } as string | jwt.JwtPayload);
  });

  describe('POST /api/voice/transcribe', () => {
    it('should return 200 and transcribed text on success', async () => {
      // Mock result as if openai.audio.transcriptions.create returned { text: "hello" }
      vi.mocked(voiceService.transcribeAudio).mockResolvedValue('hello');

      const response = await request(app)
        .post('/api/voice/transcribe')
        .set('Authorization', 'Bearer valid-token')
        .attach('audio', Buffer.from('dummy-audio-data'), {
          filename: 'audio.webm',
          contentType: 'audio/webm',
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ text: 'hello' });
      expect(voiceService.transcribeAudio).toHaveBeenCalled();
    });

    it('should return 400 when no audio file is provided', async () => {
      const response = await request(app)
        .post('/api/voice/transcribe')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'No audio file provided' });
    });

    it('should return 401 when authentication fails', async () => {
      vi.mocked(jwt.verify).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const response = await request(app)
        .post('/api/voice/transcribe')
        .attach('audio', Buffer.from('dummy-audio-data'), 'audio.webm');

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/narrative/stream', () => {
    it('should return 200 and audio stream on success', async () => {
      const mockScript = 'A historical narrative script.';
      const mockAudioStream = Readable.from([Buffer.from('mock-audio-bytes')]);

      vi.mocked(narrativeService.generateNarrative).mockResolvedValue(mockScript);
      vi.mocked(voiceService.streamNarrative).mockResolvedValue(
        mockAudioStream as unknown as Readable,
      );

      const response = await request(app)
        .post('/api/narrative/stream')
        .set('Authorization', 'Bearer valid-token')
        .send({ query: 'Tell me about my ancestors' });

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toBe('audio/mpeg');
      expect(response.body.toString()).toBe('mock-audio-bytes');

      expect(narrativeService.generateNarrative).toHaveBeenCalledWith(
        'Tell me about my ancestors',
        'user-123',
      );
      expect(voiceService.streamNarrative).toHaveBeenCalledWith(mockScript);
    });

    it('should return 400 when no query is provided', async () => {
      const response = await request(app)
        .post('/api/narrative/stream')
        .set('Authorization', 'Bearer valid-token')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'No query provided' });
    });

    it('should return 500 when narrative generation fails', async () => {
      vi.mocked(narrativeService.generateNarrative).mockRejectedValue(
        new Error('Generation failed'),
      );

      const response = await request(app)
        .post('/api/narrative/stream')
        .set('Authorization', 'Bearer valid-token')
        .send({ query: 'Trigger error' });

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Narrative generation failed' });
    });
  });

  describe('POST /api/narrative/generate', () => {
    it('returns 200 with SSE content-type and calls generateNarrativeStream', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.mocked(narrativeService.generateNarrativeStream as any).mockImplementation(
        async function* () {
          yield { type: 'agent_step', agent: 'researcher', meta: { contextCount: 3 } };
          yield { type: 'complete', text: 'A historical narrative.' };
        },
      );

      const response = await request(app)
        .post('/api/narrative/generate')
        .set('Authorization', 'Bearer valid-token')
        .send({ query: 'Tell me about immigrants' });

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('text/event-stream');
      expect(narrativeService.generateNarrativeStream).toHaveBeenCalledWith(
        'Tell me about immigrants',
        expect.anything(),
        null,
      );
    });

    it('calls generateNarrativeStream once even when generator yields a handoff', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.mocked(narrativeService.generateNarrativeStream as any).mockImplementation(
        async function* () {
          yield { type: 'agent_step', agent: 'researcher', meta: {} };
          yield {
            type: 'handoff',
            package: { reason: 'insufficient_retrieval', retrievedCount: 0 },
          };
        },
      );

      const response = await request(app)
        .post('/api/narrative/generate')
        .set('Authorization', 'Bearer valid-token')
        .send({ query: 'obscure query' });

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('text/event-stream');
      expect(narrativeService.generateNarrativeStream).toHaveBeenCalledTimes(1);
    });

    it('returns 400 when query is missing', async () => {
      const response = await request(app)
        .post('/api/narrative/generate')
        .set('Authorization', 'Bearer valid-token')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'No query provided' });
    });

    it('ends the SSE stream gracefully when the generator throws', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.mocked(narrativeService.generateNarrativeStream as any).mockImplementation(() => {
        throw new Error('Generator failed');
      });

      const response = await request(app)
        .post('/api/narrative/generate')
        .set('Authorization', 'Bearer valid-token')
        .send({ query: 'Trigger error' });

      // Headers already flushed before the generator runs, so status is always 200
      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('text/event-stream');
    });
  });

  describe('POST /api/narrative/tts', () => {
    it('returns 200 with audio/mpeg content-type on success', async () => {
      vi.mocked(voiceService.streamNarrative).mockResolvedValue(
        Readable.from([Buffer.from('mock-audio-bytes')]) as unknown as Readable,
      );

      const response = await request(app)
        .post('/api/narrative/tts')
        .set('Authorization', 'Bearer valid-token')
        .send({ text: 'A narrative to speak aloud.' });

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toBe('audio/mpeg');
      expect(response.body.toString()).toBe('mock-audio-bytes');
      expect(voiceService.streamNarrative).toHaveBeenCalledWith('A narrative to speak aloud.');
    });

    it('returns 400 when text is missing', async () => {
      const response = await request(app)
        .post('/api/narrative/tts')
        .set('Authorization', 'Bearer valid-token')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'No text provided' });
    });

    it('returns 500 when streamNarrative fails before headers are sent', async () => {
      vi.mocked(voiceService.streamNarrative).mockRejectedValue(new Error('ElevenLabs error'));

      const response = await request(app)
        .post('/api/narrative/tts')
        .set('Authorization', 'Bearer valid-token')
        .send({ text: 'Trigger error' });

      expect(response.status).toBe(500);
      // Body may arrive as Buffer when Content-Type: audio/mpeg was set before the throw
      const bodyText = Buffer.isBuffer(response.body) ? response.body.toString() : response.text;
      expect(bodyText).toContain('TTS failed');
    });
  });
});
