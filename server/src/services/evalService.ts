import { readFile, writeFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { logger } from './logger.js';

/**
 * Exports a trace of the narrative generation for evaluation purposes.
 * Logic is a no-op if EVAL_MODE is not set to 'true'.
 *
 * @param question - The original user query.
 * @param contexts - Historical contexts retrieved by the agents.
 * @param answer - The final generated narrative or draft.
 */
export async function exportTrace(
  question: string,
  contexts: string[],
  answer: string,
): Promise<void> {
  if (process.env.EVAL_MODE !== 'true') {
    return;
  }

  try {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);

    // Path resolution:
    // Source: server/src/services/evalService.ts
    // Dist: server/dist/services/evalService.js
    // Project root is 3 directories up from dist/services/evalService.js
    const tracePath = resolve(__dirname, '../../../evaluation/traces/latest_run.json');

    let traces: Array<{ question: string; contexts: string[]; answer: string }> = [];

    try {
      const data = await readFile(tracePath, 'utf-8');
      traces = JSON.parse(data);
      if (!Array.isArray(traces)) {
        traces = [];
      }
    } catch (error: unknown) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        logger.warn('Failed to read existing trace file:', error);
      }
      // If file doesn't exist or is invalid, start with empty array
      traces = [];
    }

    traces.push({ question, contexts, answer });

    await writeFile(tracePath, JSON.stringify(traces, null, 2), 'utf-8');
  } catch (error) {
    logger.warn('Failed to export evaluation trace:', error);
  }
}
