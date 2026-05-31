import { Router, Request, Response } from 'express';
import multer from 'multer';
import { rateLimit } from 'express-rate-limit';
import { eq } from 'drizzle-orm';
import { authenticate } from '../middleware/auth.js';
import { transcribeAudio, streamNarrative } from '../services/voiceService.js';
import { generateNarrative, generateNarrativeStream } from '../services/narrativeService.js';
import { logger } from '../services/logger.js';
import { db } from '../db/index.js';
import { ancestorProfiles, savedNarratives } from '../db/schema.js';

const router = Router();

const aiRateLimit = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Try again in 10 minutes.' },
  skip: (req) => {
    const bypassToken = process.env.EVAL_BYPASS_TOKEN;
    return !!bypassToken && req.header('x-eval-bypass') === bypassToken;
  },
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
      const { query, ancestorId } = req.body;

      if (!query) {
        res.status(400).json({ error: 'No query provided' });
        return;
      }

      const userId = (req as Request & { user?: { id: string } }).user?.id;

      // Ancestor profile lookup and ownership check before opening SSE
      let ancestorProfile = null;
      if (ancestorId) {
        const found = await db.query.ancestorProfiles.findFirst({
          where: eq(ancestorProfiles.id, ancestorId),
        });
        if (!found || found.userId !== userId) {
          res.status(403).json({ error: 'Ancestor profile not found or access denied' });
          return;
        }
        ancestorProfile = { ...found, createdAt: found.createdAt.toISOString() };
      }

      // SSE Headers
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders();

      let disconnected = false;
      let completedText: string | null = null;

      req.on('close', () => {
        disconnected = true;
      });

      for await (const event of generateNarrativeStream(query, userId, ancestorProfile)) {
        if (disconnected) break;
        if (event.type === 'complete') completedText = event.text;
        res.write(`event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`);
      }

      res.end();

      if (completedText && userId) {
        db.insert(savedNarratives)
          .values({
            userId,
            query,
            contentText: completedText,
            ancestorProfileId: ancestorId ?? null,
          })
          .catch((err: unknown) => logger.error({ err }, 'Auto-save narrative failed'));
      }
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
    const { text, voiceId } = req.body;

    if (!text) {
      res.status(400).json({ error: 'No text provided' });
      return;
    }

    res.setHeader('Content-Type', 'audio/mpeg');
    const audioStream = await streamNarrative(text, voiceId);
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
