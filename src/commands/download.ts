import pc from 'picocolors';
import { downloadPdf, getDownloadDir } from '../lib/download.js';

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
    await downloadPdf(target);
  } catch (err: any) {
    console.error(pc.red(`\n  Error: ${err.message}\n`));
    process.exit(1);
  }
}
