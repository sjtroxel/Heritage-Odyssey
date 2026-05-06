import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'csv-parse/sync';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RAW_DIR = path.resolve(__dirname, '../data/owid/raw');
const PROCESSED_DIR = path.resolve(__dirname, '../data/owid/processed');

interface MigrationData {
  Entity: string;
  Code: string;
  Year: string;
  'Annual net migration rate'?: string;
  'Annual net migration rate (Projected)'?: string;
  'Total number of international immigrants'?: string;
}

async function processNetMigration() {
  const filePath = path.join(RAW_DIR, 'annual-net-migration-rate.csv');
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const records = parse(content, {
      columns: true,
      skip_empty_lines: true,
    }) as MigrationData[];

    const output: string[] = [];

    for (const row of records) {
      const rate = row['Annual net migration rate'] || row['Annual net migration rate (Projected)'];
      if (rate && row.Entity && row.Year) {
        const type = row['Annual net migration rate'] ? '' : '(projected) ';
        output.push(
          `In ${row.Year}, the ${type}annual net migration rate for ${row.Entity} (${row.Code || 'N/A'}) was ${rate} per 1,000 population.`,
        );
      }
    }

    const outputPath = path.join(PROCESSED_DIR, 'annual-net-migration-rate.txt');
    await fs.writeFile(outputPath, output.join('\n'));
    console.log(`Processed ${output.length} records from annual-net-migration-rate.csv`);
  } catch (error: unknown) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      console.warn(`File not found: ${filePath}`);
    } else {
      throw error;
    }
  }
}

async function processMigrantStock() {
  const filePath = path.join(RAW_DIR, 'migrant-stock-total.csv');
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const records = parse(content, {
      columns: true,
      skip_empty_lines: true,
    }) as MigrationData[];

    const output: string[] = [];

    for (const row of records) {
      const stock = row['Total number of international immigrants'];
      if (stock && row.Entity && row.Year) {
        output.push(
          `In ${row.Year}, the total number of international immigrants in ${row.Entity} (${row.Code || 'N/A'}) was ${stock}.`,
        );
      }
    }

    const outputPath = path.join(PROCESSED_DIR, 'migrant-stock-total.txt');
    await fs.writeFile(outputPath, output.join('\n'));
    console.log(`Processed ${output.length} records from migrant-stock-total.csv`);
  } catch (error: unknown) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      console.warn(`File not found: ${filePath}`);
    } else {
      throw error;
    }
  }
}

async function main() {
  try {
    await fs.mkdir(PROCESSED_DIR, { recursive: true });
    await processNetMigration();
    await processMigrantStock();
    console.log('OWID data conversion complete.');
  } catch (error) {
    console.error('Error processing OWID data:', error);
    process.exit(1);
  }
}

main();
