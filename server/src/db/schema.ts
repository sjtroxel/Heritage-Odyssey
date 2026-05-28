import { pgTable, text, timestamp, uuid, integer, boolean, date } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').unique().notNull(),
  passwordHash: text('password_hash').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  firstName: text('first_name'),
  lastName: text('last_name'),
  dateOfBirth: date('date_of_birth'),
  birthLocation: text('birth_location'),
  currentLocation: text('current_location'),
  heritageRegions: text('heritage_regions').array(),
  researchInterests: text('research_interests'),
  profileComplete: boolean('profile_complete').notNull().default(false),
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
  lastName: text('last_name'),
  birthYear: integer('birth_year'),
  deathYear: integer('death_year'),
  originCountry: text('origin_country'),
  destination: text('destination'),
  relationship: text('relationship'),
  notes: text('notes'),
});

export const savedNarratives = pgTable('saved_narratives', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  ancestorProfileId: uuid('ancestor_profile_id').references(() => ancestorProfiles.id, {
    onDelete: 'cascade',
  }),
  query: text('query').notNull(),
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
