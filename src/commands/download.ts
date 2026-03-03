import pc from 'picocolors';
import { downloadPdf, parseArxivId } from '../lib/download.js';
import { fetchPaperById } from '../lib/arxiv.js';
import { createSpinner } from '../lib/spinner.js';

export async function downloadCommand(
  target: string,
  opts: { dir?: string }
): Promise<void> {
  if (!target) {
    console.log(pc.red('\n  Provide an arXiv link or paper ID.'));
    console.log(pc.dim('  Examples:'));
    console.log(pc.dim('    xivvy download https://arxiv.org/abs/2602.24286'));
    console.log(pc.dim('    xivvy download 2602.24286\n'));
    process.exit(1);
  }

  try {
    // Fetch metadata to get title and authors for filename
    const id = parseArxivId(target);
    const spinner = createSpinner('Fetching paper metadata...');
    const paper = await fetchPaperById(id);
    spinner.stop('');

    await downloadPdf(target, paper?.title, paper?.authors);
  } catch (err: any) {
    console.error(pc.red(`\n  Error: ${err.message}\n`));
    process.exit(1);
  }
}
