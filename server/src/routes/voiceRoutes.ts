import { Router, Request, Response } from 'express';
import multer from 'multer';
import { rateLimit } from 'express-rate-limit';
import { authenticate } from '../middleware/auth.js';
import { transcribeAudio, streamNarrative } from '../services/voiceService.js';
import { generateNarrative, generateNarrativeStream } from '../services/narrativeService.js';
import { logger } from '../services/logger.js';

const router = Router();

const aiRateLimit = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Try again in 10 minutes.' },
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

/**
 * POST /api/voice/transcribe
 * Authenticated route, expects 'audio' file in multipart/form-data
 */
router.post(
  '/voice/transcribe',
  aiRateLimit,
  authenticate,
  upload.single('audio'),
  async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        res.status(400).json({ error: 'No audio file provided' });
        return;
      }

      const text = await transcribeAudio(req.file.buffer, req.file.mimetype);
      res.json({ text });
    } catch (error) {
      logger.error('Transcription error:', error);
      res.status(500).json({ error: 'Transcription failed' });
    }
  },
);

/**
 * POST /api/narrative/stream
 * Authenticated route, expects query in JSON body
 */
router.post('/narrative/stream', aiRateLimit, authenticate, async (req: Request, res: Response) => {
  try {
    const { query } = req.body;

    if (!query) {
      res.status(400).json({ error: 'No query provided' });
      return;
    }

    // Cast req to any to access user from authenticate middleware
    const userId = (req as Request & { user?: { id: string } }).user?.id;
    const result = await generateNarrative(query, userId);

    if (typeof result !== 'string') {
      // It's a HandoffPackage (insufficient retrieval)
      res.json(result);
      return;
    }

    // Set Content-Type for audio stream
    res.setHeader('Content-Type', 'audio/mpeg');

    const audioStream = await streamNarrative(result);
    audioStream.pipe(res);
  } catch (error) {
    logger.error({ err: error }, 'Narrative streaming error');
    // Only send JSON error if headers haven't been sent
    if (!res.headersSent) {
      res.status(500).json({ error: 'Narrative generation failed' });
    } else {
      // If headers sent, we can only end the response
      res.end();
    }
  }
});

/**
 * POST /api/narrative/generate
 * Authenticated SSE route, provides real-time agent step updates
 */
router.post(
  '/narrative/generate',
  aiRateLimit,
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const { query } = req.body;

      if (!query) {
        res.status(400).json({ error: 'No query provided' });
        return;
      }

      // SSE Headers
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders();

      const userId = (req as Request & { user?: { id: string } }).user?.id;
      let disconnected = false;

      req.on('close', () => {
        disconnected = true;
      });

      for await (const event of generateNarrativeStream(query, userId)) {
        if (disconnected) break;
        res.write(`event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`);
      }

      res.end();
    } catch (error) {
      logger.error({ err: error }, 'SSE narrative generation error');
      if (!res.headersSent) {
        res.write(
          `event: error\ndata: ${JSON.stringify({ error: 'Narrative generation failed' })}\n\n`,
        );
      }
      res.end();
    }
  },
);

/**
 * POST /api/narrative/tts
 * Authenticated route, converts text to streaming audio
 */
router.post('/narrative/tts', aiRateLimit, authenticate, async (req: Request, res: Response) => {
  try {
    const { text } = req.body;

    if (!text) {
      res.status(400).json({ error: 'No text provided' });
      return;
    }

    res.setHeader('Content-Type', 'audio/mpeg');
    const audioStream = await streamNarrative(text);
    audioStream.pipe(res);
  } catch (error) {
    logger.error({ err: error }, 'TTS streaming error');
    if (!res.headersSent) {
      res.status(500).json({ error: 'TTS failed' });
    } else {
      res.end();
    }
  }
});

export default router;
