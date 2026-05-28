import { Router, Request, Response } from 'express';
import { eq, and, desc } from 'drizzle-orm';
import { z } from 'zod';
import { authenticate } from '../middleware/auth.js';
import { db } from '../db/index.js';
import { ancestorProfiles } from '../db/schema.js';
import { logger } from '../services/logger.js';

const router = Router();

const ancestorCreateSchema = z.object({
  name: z.string().min(1),
  birthRegion: z.string().min(1),
  era: z.string().min(1),
  lastName: z.string().optional(),
  birthYear: z.number().int().optional(),
  deathYear: z.number().int().optional(),
  originCountry: z.string().optional(),
  destination: z.string().optional(),
  relationship: z.string().optional(),
  notes: z.string().optional(),
});

const ancestorUpdateSchema = ancestorCreateSchema.partial();

router.post('/ancestors', authenticate, async (req: Request, res: Response) => {
  const parsed = ancestorCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'name, birthRegion, and era are required' });
    return;
  }

  const userId = req.user!.id;

  try {
    const [record] = await db
      .insert(ancestorProfiles)
      .values({ userId, ...parsed.data })
      .returning();
    res.status(201).json(record);
  } catch (error) {
    logger.error({ err: error }, 'Failed to create ancestor profile');
    res.status(500).json({ error: 'Failed to create ancestor profile' });
  }
});

router.get('/ancestors', authenticate, async (req: Request, res: Response) => {
  const userId = req.user!.id;

  try {
    const records = await db
      .select()
      .from(ancestorProfiles)
      .where(eq(ancestorProfiles.userId, userId))
      .orderBy(desc(ancestorProfiles.createdAt));
    res.json(records);
  } catch (error) {
    logger.error({ err: error }, 'Failed to fetch ancestor profiles');
    res.status(500).json({ error: 'Failed to fetch ancestor profiles' });
  }
});

router.get('/ancestors/:id', authenticate, async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const id = req.params['id'];

  if (!id) {
    res.status(400).json({ error: 'Ancestor id is required' });
    return;
  }

  try {
    const record = await db.query.ancestorProfiles.findFirst({
      where: and(eq(ancestorProfiles.id, id), eq(ancestorProfiles.userId, userId)),
    });

    if (!record) {
      res.status(404).json({ error: 'Ancestor profile not found' });
      return;
    }

    res.json(record);
  } catch (error) {
    logger.error({ err: error }, 'Failed to fetch ancestor profile');
    res.status(500).json({ error: 'Failed to fetch ancestor profile' });
  }
});

router.patch('/ancestors/:id', authenticate, async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const id = req.params['id'];

  if (!id) {
    res.status(400).json({ error: 'Ancestor id is required' });
    return;
  }

  const parsed = ancestorUpdateSchema.safeParse(req.body);
  if (!parsed.success || Object.keys(parsed.data).length === 0) {
    res.status(400).json({ error: 'No valid fields provided' });
    return;
  }

  try {
    const existing = await db.query.ancestorProfiles.findFirst({
      where: eq(ancestorProfiles.id, id),
    });

    if (!existing) {
      res.status(404).json({ error: 'Ancestor profile not found' });
      return;
    }

    if (existing.userId !== userId) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const [updated] = await db
      .update(ancestorProfiles)
      .set(parsed.data)
      .where(eq(ancestorProfiles.id, id))
      .returning();

    res.json(updated);
  } catch (error) {
    logger.error({ err: error }, 'Failed to update ancestor profile');
    res.status(500).json({ error: 'Failed to update ancestor profile' });
  }
});

router.delete('/ancestors/:id', authenticate, async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const id = req.params['id'];

  if (!id) {
    res.status(400).json({ error: 'Ancestor id is required' });
    return;
  }

  try {
    const existing = await db.query.ancestorProfiles.findFirst({
      where: eq(ancestorProfiles.id, id),
    });

    if (!existing) {
      res.status(404).json({ error: 'Ancestor profile not found' });
      return;
    }

    if (existing.userId !== userId) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    await db
      .delete(ancestorProfiles)
      .where(and(eq(ancestorProfiles.id, id), eq(ancestorProfiles.userId, userId)));

    res.status(204).send();
  } catch (error) {
    logger.error({ err: error }, 'Failed to delete ancestor profile');
    res.status(500).json({ error: 'Failed to delete ancestor profile' });
  }
});

export default router;
