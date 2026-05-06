import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import OpenAI from 'openai';
import { Pinecone, type RecordMetadata } from '@pinecone-database/pinecone';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';

// Load environment variables from server/.env
dotenv.config({ path: path.resolve(process.cwd(), '../server/.env') });

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, '../data');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const pc = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

const indexName = process.env.PINECONE_INDEX!;

interface Document {
  pageContent: string;
  metadata: {
    source_type: 'gutenberg' | 'loc' | 'owid';
    year: string | number;
    region: string;
    title: string;
    url?: string;
    [key: string]: string | number | boolean | string[] | undefined;
  };
}

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000,
  chunkOverlap: 200,
});

async function loadGutenberg(): Promise<Document[]> {
  const dir = path.join(DATA_DIR, 'gutenberg');
  const docs: Document[] = [];
  try {
    const files = await fs.readdir(dir);
    for (const file of files) {
      if (file.endsWith('.txt')) {
        const content = await fs.readFile(path.join(dir, file), 'utf-8');
        docs.push({
          pageContent: content,
          metadata: {
            source_type: 'gutenberg',
            year: 'various',
            region: 'various',
            title: file.replace('.txt', ''),
          },
        });
      }
    }
  } catch (_error) {
    console.warn('Gutenberg directory not found or empty.');
  }
  return docs;
}

async function loadLoc(): Promise<Document[]> {
  const dir = path.join(DATA_DIR, 'loc');
  const docs: Document[] = [];
  try {
    const files = await fs.readdir(dir);
    for (const file of files) {
      if (file.endsWith('.json')) {
        const content = await fs.readFile(path.join(dir, file), 'utf-8');
        const items = JSON.parse(content);
        for (const item of items) {
          docs.push({
            pageContent: item.snippet || item.title,
            metadata: {
              source_type: 'loc',
              year: item.date,
              region: item.state.join(', ') || item.city.join(', ') || 'USA',
              title: item.title,
              url: item.url,
            },
          });
        }
      }
    }
  } catch (_error) {
    console.warn('LoC directory not found or empty.');
  }
  return docs;
}

async function loadOwid(): Promise<Document[]> {
  const dir = path.join(DATA_DIR, 'owid/processed');
  const docs: Document[] = [];
  try {
    const files = await fs.readdir(dir);
    for (const file of files) {
      if (file.endsWith('.txt')) {
        const content = await fs.readFile(path.join(dir, file), 'utf-8');
        const lines = content.split('\n').filter((l) => l.trim());
        for (const line of lines) {
          // Attempt to extract year and region from OWID string
          // Format: "In 1910, the ... for Italy (ITA) was ..."
          const yearMatch = line.match(/In (\d{4})/);
          const regionMatch = line.match(/for (.*?) \(/);

          docs.push({
            pageContent: line,
            metadata: {
              source_type: 'owid',
              year: yearMatch ? parseInt(yearMatch[1]!, 10) : 'various',
              region: regionMatch ? regionMatch[1]!.trim() : 'global',
              title: file.replace('.txt', ''),
            },
          });
        }
      }
    }
  } catch (_error) {
    console.warn('OWID processed directory not found or empty.');
  }
  return docs;
}

async function ingest() {
  console.log('Starting ingestion pipeline...');

  const rawDocs = [...(await loadGutenberg()), ...(await loadLoc()), ...(await loadOwid())];

  if (rawDocs.length === 0) {
    console.log('No documents found to ingest.');
    return;
  }

  console.log(`Loaded ${rawDocs.length} source documents.`);

  const chunks: { pageContent: string; metadata: RecordMetadata }[] = [];
  for (const doc of rawDocs) {
    const splitDocs = await splitter.createDocuments([doc.pageContent], [doc.metadata]);
    // LangChain docs have metadata as Record<string, any>, cast to Pinecone's RecordMetadata
    for (const splitDoc of splitDocs) {
      chunks.push({
        pageContent: splitDoc.pageContent,
        metadata: splitDoc.metadata as RecordMetadata,
      });
    }
  }

  console.log(`Split into ${chunks.length} chunks.`);

  const index = pc.index(indexName);

  const batchSize = 100;
  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize);
    console.log(
      `Processing batch ${Math.floor(i / batchSize) + 1} / ${Math.ceil(chunks.length / batchSize)}...`,
    );

    const embeddings = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: batch.map((c) => c.pageContent.replace(/\n/g, ' ')),
    });

    const vectors = batch.map((chunk, j) => ({
      id: `doc_${i + j}_${Date.now()}`,
      values: embeddings.data[j]!.embedding,
      metadata: chunk.metadata,
    }));

    await index.upsert({ records: vectors });
  }

  console.log('Ingestion complete.');
}

ingest().catch((err) => {
  console.error('Ingestion failed:', err);
  process.exit(1);
});
