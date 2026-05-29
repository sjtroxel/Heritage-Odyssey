import OpenAI from 'openai';
import { env } from '../config/env.js';
import { MODELS } from '@heritage-odyssey/shared/models';
import { index } from './pinecone.js';
import { ancestorProfiles } from '../db/schema.js';

const openai = new OpenAI({
  apiKey: env.OPENAI_API_KEY,
});

export async function createEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: MODELS.EMBEDDINGS,
    input: text.replace(/\n/g, ' '),
  });

  return response.data[0]!.embedding;
}

export async function createEmbeddings(texts: string[]): Promise<number[][]> {
  const response = await openai.embeddings.create({
    model: MODELS.EMBEDDINGS,
    input: texts.map((t) => t.replace(/\n/g, ' ')),
  });

  return response.data.map((d) => d.embedding);
}

type AncestorRow = typeof ancestorProfiles.$inferSelect;

function buildAncestorDocuments(profile: AncestorRow): string[] {
  const docs: string[] = [];
  const displayName = profile.name;

  const birthInfo = [profile.birthDate, profile.birthPlace].filter(Boolean).join(' in ');
  const deathInfo = [profile.deathDate, profile.deathPlace].filter(Boolean).join(' in ');
  let bio = displayName;
  if (birthInfo) bio += `, born ${birthInfo}`;
  if (deathInfo) bio += `, died ${deathInfo}`;
  if (bio !== displayName) docs.push(`${bio}.`);

  const migrationParts: string[] = [];
  if (profile.departurePort) migrationParts.push(`emigrated from ${profile.departurePort}`);
  if (profile.arrivalDate || profile.arrivalPort) {
    let arrival = 'arrived';
    if (profile.arrivalDate) arrival += ` on ${profile.arrivalDate}`;
    if (profile.arrivalPort) arrival += ` in ${profile.arrivalPort}`;
    migrationParts.push(arrival);
  }
  if (profile.shipName) migrationParts.push(`aboard ${profile.shipName}`);
  if (migrationParts.length > 0) docs.push(`${displayName} ${migrationParts.join(', ')}.`);

  if (profile.occupations && profile.occupations.length > 0) {
    docs.push(`${displayName} worked as ${profile.occupations.join(', ')}.`);
  }

  return docs;
}

export async function embedAncestorProfile(profile: AncestorRow, userId: string): Promise<void> {
  const hasLocation = !!(
    profile.birthPlace ||
    profile.deathPlace ||
    profile.arrivalPort ||
    profile.departurePort
  );
  const hasDate = !!(
    profile.birthDate ||
    profile.deathDate ||
    profile.arrivalDate ||
    profile.birthYear
  );
  if (!hasLocation || !hasDate) return;

  const docs = buildAncestorDocuments(profile);
  if (docs.length === 0) return;

  const vectors = await Promise.all(
    docs.map(async (text, i) => ({
      id: `anc_${profile.id}_${i}`,
      values: await createEmbedding(text),
      metadata: { text, ancestorId: profile.id, kind: 'personal_record' },
    })),
  );

  await index.namespace(`user-${userId}`).upsert({ records: vectors });
}
