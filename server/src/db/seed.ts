import bcrypt from 'bcrypt';
import { db } from './index.js';
import { users } from './schema.js';
import { eq } from 'drizzle-orm';
import { logger } from '../services/logger.js';

/**
 * Seeds the database with a demo user for testing and local development.
 */
async function seed() {
  const email = 'guest@heritage-odyssey.demo';
  const password = 'guest-demo-2026';
  const saltRounds = 10;

  try {
    logger.info('Checking for existing demo user...');
    const [existingUser] = await db.select().from(users).where(eq(users.email, email)).limit(1);

    if (existingUser) {
      logger.info('Demo user already exists. Skipping creation.');
      return;
    }

    logger.info('Creating demo user...');
    const passwordHash = await bcrypt.hash(password, saltRounds);

    await db.insert(users).values({
      email,
      passwordHash,
    });

    logger.info('Demo user created successfully.');
  } catch (error) {
    logger.error('Error seeding database:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

seed();
