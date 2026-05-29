import bcrypt from 'bcrypt';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { db } from './index.js';
import { users, ancestorProfiles } from './schema.js';
import { eq, and } from 'drizzle-orm';
import { logger } from '../services/logger.js';
import { parseGedcom, type ParsedAncestor } from '../services/gedcomParser.js';
import { embedAncestorProfile } from '../services/embedding.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SAMPLE_FIXTURE_PATH = join(__dirname, '../../fixtures/sample-family.ged');

const DEMO_EMAIL = 'guest@heritage-odyssey.demo';
const DEMO_PASSWORD = 'guest-demo-2026';

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

async function seedDemoUser() {
  let demoUser = await db.query.users.findFirst({ where: eq(users.email, DEMO_EMAIL) });

  if (demoUser) {
    if (demoUser.authProvider !== 'demo') {
      const [updated] = await db
        .update(users)
        .set({ authProvider: 'demo' })
        .where(eq(users.id, demoUser.id))
        .returning();
      demoUser = updated!;
      logger.info('Updated existing guest user to authProvider=demo');
    } else {
      logger.info('Demo user already exists. Skipping creation.');
    }
  } else {
    const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
    const [created] = await db
      .insert(users)
      .values({ email: DEMO_EMAIL, passwordHash, authProvider: 'demo' })
      .returning();
    demoUser = created!;
    logger.info('Created demo user.');
  }

  return demoUser;
}

async function seedSampleFamily(userId: string) {
  const raw = readFileSync(SAMPLE_FIXTURE_PATH, 'utf-8');
  const { ancestors, warnings } = parseGedcom(raw);

  if (warnings.length > 0) {
    logger.warn({ warnings }, 'GEDCOM parse warnings during seed');
  }

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
              logger.warn({ err: e }, `Embed failed for ${ancestor.name}`),
            );
        } else {
          const [inserted] = await db.insert(ancestorProfiles).values(values).returning();
          if (inserted)
            await embedAncestorProfile(inserted, userId).catch((e) =>
              logger.warn({ err: e }, `Embed failed for ${ancestor.name}`),
            );
        }
      } else {
        const [inserted] = await db.insert(ancestorProfiles).values(values).returning();
        if (inserted)
          await embedAncestorProfile(inserted, userId).catch((e) =>
            logger.warn({ err: e }, `Embed failed for ${ancestor.name}`),
          );
      }

      imported++;
    } catch (err) {
      logger.warn({ err }, `Failed to seed ancestor ${ancestor.name}`);
    }
  }

  logger.info({ imported }, 'Sample family pre-imported for demo namespace');
}

async function seed() {
  try {
    const demoUser = await seedDemoUser();
    await seedSampleFamily(demoUser.id);
  } catch (error) {
    logger.error({ err: error }, 'Error seeding database');
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

seed();
