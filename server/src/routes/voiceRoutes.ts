import { Router, Request, Response } from 'express';
import multer from 'multer';
import { authenticate } from '../middleware/auth.js';
import { transcribeAudio, streamNarrative } from '../services/voiceService.js';
import { generateNarrative } from '../services/narrativeService.js';
import { logger } from '../services/logger.js';

const router = Router();
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
router.post('/narrative/stream', authenticate, async (req: Request, res: Response) => {
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
    logger.error('Narrative streaming error:', error);
    // Only send JSON error if headers haven't been sent
    if (!res.headersSent) {
      res.status(500).json({ error: 'Narrative generation failed' });
    } else {
      // If headers sent, we can only end the response
      res.end();
    }
  }
});

export default router;
