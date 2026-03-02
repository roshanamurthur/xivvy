import { searchPapers } from '../lib/arxiv.js';
import { summarizePapers } from '../lib/summarizer.js';
import { displayPapers } from '../lib/display.js';
import { createSpinner } from '../lib/spinner.js';
import { startSession } from './session.js';
import type { SearchOptions } from '../types/index.js';

export async function searchCommand(
  query: string | undefined,
  opts: { cat?: string; limit?: string; sort?: string; noSession?: boolean }
): Promise<void> {
  if (!query && !opts.cat) {
    console.error('Provide a search query or --cat category. Run xivvy --help.');
    process.exit(1);
  }

  const searchOpts: SearchOptions = {
    query: query,
    category: opts.cat,
    limit: opts.limit ? parseInt(opts.limit, 10) : 10,
    sortBy: (opts.sort as SearchOptions['sortBy']) || 'submittedDate',
  };

  // Fetch papers
  const spinner = createSpinner('Searching arXiv...');
  let papers;
  try {
    papers = await searchPapers(searchOpts);
  } catch (err: any) {
    spinner.stop('');
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }

  if (papers.length === 0) {
    spinner.stop('');
    console.log('No papers found for that query.');
    return;
  }

  // Summarize with Claude
  spinner.update('Summarizing with Claude...');
  try {
    papers = await summarizePapers(papers);
  } catch (err: any) {
    spinner.stop('');
    console.error(`Summarization error: ${err.message}`);
    // Still show papers without summaries
    displayPapers(papers);
    return;
  }

  spinner.stop('');
  displayPapers(papers);

  // Enter session mode unless --no-session
  if (!opts.noSession) {
    await startSession(papers);
  }
}
