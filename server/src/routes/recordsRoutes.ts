import { Router, Request, Response } from 'express';
import { eq, and, desc } from 'drizzle-orm';
import { z } from 'zod';
import { authenticate } from '../middleware/auth.js';
import { db } from '../db/index.js';
import { savedNarratives } from '../db/schema.js';
import { logger } from '../services/logger.js';

const router = Router();

const saveRecordSchema = z.object({
  query: z.string().min(1),
  contentText: z.string().min(1),
});

router.post('/records', authenticate, async (req: Request, res: Response) => {
  const parsed = saveRecordSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'query and contentText are required' });
    return;
  }

  const userId = req.user!.id;
  const { query, contentText } = parsed.data;

  try {
    const [record] = await db
      .insert(savedNarratives)
      .values({ userId, query, contentText })
      .returning();
    res.status(201).json(record);
  } catch (error) {
    logger.error({ err: error }, 'Failed to save record');
    res.status(500).json({ error: 'Failed to save record' });
  }
});

router.get('/records', authenticate, async (req: Request, res: Response) => {
  const userId = req.user!.id;

  try {
    const records = await db
      .select()
      .from(savedNarratives)
      .where(eq(savedNarratives.userId, userId))
      .orderBy(desc(savedNarratives.createdAt));
    res.json(records);
  } catch (error) {
    logger.error({ err: error }, 'Failed to fetch records');
    res.status(500).json({ error: 'Failed to fetch records' });
  }
});

router.delete('/records/:id', authenticate, async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const id = req.params['id'];

  if (!id) {
    res.status(400).json({ error: 'Record id is required' });
    return;
  }

  try {
    const deleted = await db
      .delete(savedNarratives)
      .where(and(eq(savedNarratives.id, id), eq(savedNarratives.userId, userId)))
      .returning();

    if (deleted.length === 0) {
      res.status(404).json({ error: 'Record not found' });
      return;
    }

    res.status(204).send();
  } catch (error) {
    logger.error({ err: error }, 'Failed to delete record');
    res.status(500).json({ error: 'Failed to delete record' });
  }
});

export default router;
