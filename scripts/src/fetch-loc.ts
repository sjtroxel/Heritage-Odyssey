import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, '../data/loc');

const KEYWORDS = ['steerage', 'Ellis Island', 'migration', 'homestead'];
// New LoC API endpoint as of 2026
const BASE_URL = 'https://www.loc.gov/collections/chronicling-america/';

interface LocItem {
  title: string;
  date: string;
  city: string[];
  state: string[];
  snippet: string;
  url: string;
}

interface RawLocResult {
  title?: string;
  date?: string;
  location_city?: string[];
  location_state?: string[];
  description?: string | string[];
  url?: string;
}

interface LocApiResponse {
  results?: RawLocResult[];
  content?: {
    results?: RawLocResult[];
  };
}

async function fetchLocData(keyword: string) {
  console.log(`Fetching data for keyword: "${keyword}"...`);
  const params = new URLSearchParams({
    q: keyword,
    fo: 'json',
    at: 'results',
    c: '25',
  });

  const url = `${BASE_URL}?${params.toString()}`;
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'HeritageOdysseyBot/1.0 (contact: sjtroxel@example.com)',
    },
  });
  if (!response.ok) {
    throw new Error(
      `Failed to fetch data for ${keyword}: ${response.status} ${response.statusText}`,
    );
  }

  const data = (await response.json()) as LocApiResponse;
  const rawResults = data.results || data.content?.results;

  if (!rawResults || !Array.isArray(rawResults)) {
    console.warn(`No items found for keyword: "${keyword}"`);
    return;
  }

  const items: LocItem[] = rawResults.map((item: RawLocResult) => ({
    title: item.title || 'Untitled',
    date: item.date || 'Unknown Date',
    city: item.location_city || [],
    state: item.location_state || [],
    snippet: Array.isArray(item.description) ? (item.description[0] ?? '') : item.description || '',
    url: item.url || '',
  }));

  const fileName = `${keyword.toLowerCase().replace(/\s+/g, '_')}.json`;
  const filePath = path.join(DATA_DIR, fileName);
  await fs.writeFile(filePath, JSON.stringify(items, null, 2));
  console.log(`Saved ${items.length} items to ${filePath}`);
}

async function main() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    for (const keyword of KEYWORDS) {
      await fetchLocData(keyword);
    }
    console.log('Finished fetching LoC data.');
  } catch (error) {
    console.error('Error fetching LoC data:', error);
    process.exit(1);
  }
}

main();
