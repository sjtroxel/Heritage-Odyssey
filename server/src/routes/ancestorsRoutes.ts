import { Router, Request, Response } from 'express';
import { eq, and, desc } from 'drizzle-orm';
import { z } from 'zod';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';
import multer from 'multer';
import { authenticate } from '../middleware/auth.js';
import { db } from '../db/index.js';
import { ancestorProfiles } from '../db/schema.js';
import { logger } from '../services/logger.js';
import { parseGedcom, type ParsedAncestor } from '../services/gedcomParser.js';
import { embedAncestorProfile } from '../services/embedding.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SAMPLE_FIXTURE_PATH = join(__dirname, '../../../fixtures/sample-family.ged');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

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

async function importAncestors(
  userId: string,
  raw: string,
): Promise<{ imported: number; warnings: string[] }> {
  const { ancestors, warnings } = parseGedcom(raw);
  let imported = 0;

  for (const ancestor of ancestors) {
    try {
      const values = buildAncestorValues(userId, ancestor);

      if (ancestor.gedcomId) {
        const existing = await db.query.ancestorProfiles.findFirst({
          where: and(
            eq(ancestorProfiles.userId, userId),
            eq(ancestorProfiles.gedcomId, ancestor.gedcomId),
          ),
        });

        if (existing) {
          const [updated] = await db
            .update(ancestorProfiles)
            .set(values)
            .where(eq(ancestorProfiles.id, existing.id))
            .returning();
          if (updated)
            await embedAncestorProfile(updated, userId).catch((e) =>
              warnings.push(
                `Embed failed for ${ancestor.name}: ${e instanceof Error ? e.message : String(e)}`,
              ),
            );
        } else {
          const [inserted] = await db.insert(ancestorProfiles).values(values).returning();
          if (inserted)
            await embedAncestorProfile(inserted, userId).catch((e) =>
              warnings.push(
                `Embed failed for ${ancestor.name}: ${e instanceof Error ? e.message : String(e)}`,
              ),
            );
        }
      } else {
        const [inserted] = await db.insert(ancestorProfiles).values(values).returning();
        if (inserted)
          await embedAncestorProfile(inserted, userId).catch((e) =>
            warnings.push(
              `Embed failed for ${ancestor.name}: ${e instanceof Error ? e.message : String(e)}`,
            ),
          );
      }

      imported++;
    } catch (err) {
      warnings.push(
        `Failed to save ${ancestor.name}: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  return { imported, warnings };
}

function buildAncestorValues(userId: string, ancestor: ParsedAncestor) {
  return {
    userId,
    name: ancestor.name,
    birthRegion: ancestor.birthPlace ?? ancestor.departurePort ?? 'Unknown',
    era: ancestor.birthYear ? String(ancestor.birthYear) : 'Unknown',
    lastName: ancestor.lastName ?? null,
    birthYear: ancestor.birthYear ?? null,
    deathYear: ancestor.deathYear ?? null,
    originCountry: ancestor.departurePort ?? null,
    destination: ancestor.arrivalPort ?? null,
    gedcomId: ancestor.gedcomId || null,
    birthDate: ancestor.birthDate ?? null,
    birthPlace: ancestor.birthPlace ?? null,
    deathDate: ancestor.deathDate ?? null,
    deathPlace: ancestor.deathPlace ?? null,
    arrivalDate: ancestor.arrivalDate ?? null,
    arrivalPort: ancestor.arrivalPort ?? null,
    departurePort: ancestor.departurePort ?? null,
    shipName: ancestor.shipName ?? null,
    occupations: ancestor.occupations ?? null,
    sourceSummary: ancestor.sourceSummary ?? null,
  };
}

router.post(
  '/ancestors/import/gedcom',
  authenticate,
  upload.single('file'),
  async (req: Request, res: Response) => {
    const userId = req.user!.id;

    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    try {
      const raw = req.file.buffer.toString('utf-8');
      const result = await importAncestors(userId, raw);
      res.json(result);
    } catch (err) {
      logger.error({ err }, 'GEDCOM import failed');
      res.status(500).json({ error: 'Import failed' });
    }
  },
);

router.post('/ancestors/import/sample', authenticate, async (req: Request, res: Response) => {
  const userId = req.user!.id;

  try {
    const raw = readFileSync(SAMPLE_FIXTURE_PATH, 'utf-8');
    const result = await importAncestors(userId, raw);
    res.json(result);
  } catch (err) {
    logger.error({ err }, 'Sample import failed');
    res.status(500).json({ error: 'Sample import failed' });
  }
});

export default router;
