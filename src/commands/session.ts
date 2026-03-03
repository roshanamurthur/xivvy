import * as readline from 'node:readline';
import { execSync } from 'node:child_process';
import { platform } from 'node:os';
import pc from 'picocolors';
import { displayFullAbstract, displayBullets, displayPapers } from '../lib/display.js';
import { bulletSummary, queryPapers, summarizePapers } from '../lib/summarizer.js';
import { searchPapers } from '../lib/arxiv.js';
import { downloadPdf, getDownloadDir } from '../lib/download.js';
import { createSpinner } from '../lib/spinner.js';
import type { Paper, SessionContext } from '../types/index.js';

function openUrl(url: string): void {
  const cmd =
    platform() === 'darwin'
      ? 'open'
      : platform() === 'win32'
        ? 'start'
        : 'xdg-open';
  try {
    execSync(`${cmd} "${url}"`, { stdio: 'ignore' });
  } catch {
    console.log(pc.dim(`  Open manually: ${url}`));
  }
}

function printHelp(): void {
  console.log(`
  ${pc.bold('Session commands:')}

    ${pc.cyan('full <n>')}       Show full abstract for paper #n
    ${pc.cyan('bullets <n>')}    Bullet-point summary of paper #n
    ${pc.cyan('download <n>')}   Download PDF for paper #n
    ${pc.cyan('open <n>')}       Open paper in browser
    ${pc.cyan('pdf <n>')}        Open PDF in browser
    ${pc.cyan('search <query>')} New search (replaces current papers)
    ${pc.cyan('list')}           Re-display current papers
    ${pc.cyan('help')}           Show this help
    ${pc.cyan('exit')}           Quit session

  ${pc.dim(`Downloads go to: ${getDownloadDir()}`)}

  Or just type a question about the papers.
`);
}

function parsePaperNum(arg: string, papers: Paper[]): number | null {
  const n = parseInt(arg, 10);
  if (isNaN(n) || n < 1 || n > papers.length) {
    console.log(pc.red(`  Invalid paper number. Use 1-${papers.length}.`));
    return null;
  }
  return n - 1; // 0-indexed
}

export async function startSession(papers: Paper[]): Promise<void> {
  const ctx: SessionContext = { papers, history: [] };

  console.log(
    `\n  ${pc.bold(pc.green('Session started.'))} Ask questions about these papers, or type ${pc.cyan('help')}.`
  );

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: `\n  ${pc.bold(pc.magenta('xivvy'))} ${pc.dim('>')} `,
  });

  rl.prompt();

  rl.on('line', async (line: string) => {
    const input = line.trim();
    if (!input) {
      rl.prompt();
      return;
    }

    // Parse commands
    const parts = input.split(/\s+/);
    const cmd = parts[0].toLowerCase();

    try {
      if (cmd === 'exit' || cmd === 'quit' || cmd === 'q') {
        console.log(pc.dim('\n  Goodbye.\n'));
        rl.close();
        process.exit(0);
      }

      if (cmd === 'help' || cmd === '?') {
        printHelp();
        rl.prompt();
        return;
      }

      if (cmd === 'list' || cmd === 'ls') {
        displayPapers(ctx.papers);
        rl.prompt();
        return;
      }

      if (cmd === 'full' && parts[1]) {
        const idx = parsePaperNum(parts[1], ctx.papers);
        if (idx !== null) {
          displayFullAbstract(ctx.papers[idx], idx);
        }
        rl.prompt();
        return;
      }

      if (cmd === 'bullets' && parts[1]) {
        const idx = parsePaperNum(parts[1], ctx.papers);
        if (idx !== null) {
          const spinner = createSpinner('Generating bullet summary...');
          const bullets = await bulletSummary(ctx.papers[idx]);
          spinner.stop('');
          displayBullets(ctx.papers[idx], idx, bullets);
        }
        rl.prompt();
        return;
      }

      if ((cmd === 'download' || cmd === 'dl') && parts[1]) {
        const idx = parsePaperNum(parts[1], ctx.papers);
        if (idx !== null) {
          try {
            await downloadPdf(ctx.papers[idx].id, ctx.papers[idx].title);
          } catch (err: any) {
            console.error(pc.red(`\n  Download failed: ${err.message}\n`));
          }
        }
        rl.prompt();
        return;
      }

      if (cmd === 'open' && parts[1]) {
        const idx = parsePaperNum(parts[1], ctx.papers);
        if (idx !== null) {
          console.log(pc.dim(`  Opening ${ctx.papers[idx].abstractUrl}...`));
          openUrl(ctx.papers[idx].abstractUrl);
        }
        rl.prompt();
        return;
      }

      if (cmd === 'pdf' && parts[1]) {
        const idx = parsePaperNum(parts[1], ctx.papers);
        if (idx !== null) {
          console.log(pc.dim(`  Opening PDF...`));
          openUrl(ctx.papers[idx].pdfUrl);
        }
        rl.prompt();
        return;
      }

      if (cmd === 'search') {
        const query = parts.slice(1).join(' ');
        if (!query) {
          console.log(pc.red('  Provide a search query: search <query>'));
          rl.prompt();
          return;
        }

        const spinner = createSpinner('Searching arXiv...');
        let newPapers = await searchPapers({ query, limit: 10, sortBy: 'submittedDate' });

        if (newPapers.length === 0) {
          spinner.stop('');
          console.log(pc.yellow('  No papers found.'));
          rl.prompt();
          return;
        }

        spinner.update('Summarizing...');
        newPapers = await summarizePapers(newPapers);
        spinner.stop('');

        ctx.papers = newPapers;
        ctx.history = []; // Reset conversation for new papers
        displayPapers(ctx.papers);
        rl.prompt();
        return;
      }

      // Natural language query — send to Claude
      const spinner = createSpinner('Thinking...');
      const answer = await queryPapers(ctx, input);
      spinner.stop('');

      console.log(`\n${answer.split('\n').map(l => `  ${l}`).join('\n')}\n`);

      // Save to conversation history
      ctx.history.push({ role: 'user', content: input });
      ctx.history.push({ role: 'assistant', content: answer });

      // Keep history manageable
      if (ctx.history.length > 20) {
        ctx.history = ctx.history.slice(-16);
      }
    } catch (err: any) {
      console.error(pc.red(`\n  Error: ${err.message}\n`));
    }

    rl.prompt();
  });

  rl.on('close', () => {
    process.exit(0);
  });
}
