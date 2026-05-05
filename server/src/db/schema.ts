import { pgTable, text, timestamp, uuid, integer } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').unique().notNull(),
  passwordHash: text('password_hash').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const ancestorProfiles = pgTable('ancestor_profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  name: text('name').notNull(),
  birthRegion: text('birth_region').notNull(),
  era: text('era').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const savedNarratives = pgTable('saved_narratives', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  ancestorProfileId: uuid('ancestor_profile_id')
    .references(() => ancestorProfiles.id, { onDelete: 'cascade' })
    .notNull(),
  contentText: text('content_text').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const modelUsage = pgTable('model_usage', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  modelName: text('model_name').notNull(),
  promptTokens: integer('prompt_tokens').notNull(),
  completionTokens: integer('completion_tokens').notNull(),
  totalTokens: integer('total_tokens').notNull(),
  endpoint: text('endpoint').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
