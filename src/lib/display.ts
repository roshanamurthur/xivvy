import pc from 'picocolors';
import type { Paper } from '../types/index.js';

const WIDTH = Math.min(process.stdout.columns || 80, 90);

function truncateAuthors(authors: string[], max: number = 3): string {
  if (authors.length <= max) return authors.join(', ');
  return authors.slice(0, max).join(', ') + ` + ${authors.length - max} more`;
}

function wrapText(text: string, indent: number, width: number): string {
  const maxWidth = width - indent;
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    if (currentLine.length + word.length + 1 > maxWidth) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = currentLine ? `${currentLine} ${word}` : word;
    }
  }
  if (currentLine) lines.push(currentLine);

  const pad = ' '.repeat(indent);
  return lines.map((l) => `${pad}${l}`).join('\n');
}

export function displayPaper(paper: Paper, index: number): void {
  const num = pc.bold(pc.cyan(`[${index + 1}]`));
  const title = pc.bold(pc.white(paper.title));
  const authors = pc.dim(truncateAuthors(paper.authors));
  const date = paper.published.split('T')[0];
  const meta = pc.yellow(`${date} · ${paper.primaryCategory}`);
  const summary = paper.summary || paper.abstract.slice(0, 200) + '...';
  const url = pc.dim(pc.underline(paper.abstractUrl));

  const border = pc.dim('│');

  console.log('');
  console.log(`  ${pc.dim('┌─')} ${num} ${pc.dim('─'.repeat(Math.max(0, WIDTH - 12)))}`);
  console.log(`  ${border}`);
  console.log(`  ${border}  ${title}`);
  console.log(`  ${border}  ${authors}`);
  console.log(`  ${border}  ${meta}`);
  console.log(`  ${border}`);
  console.log(wrapText(summary, 0, WIDTH - 6).split('\n').map(l => `  ${border}  ${l.trimStart()}`).join('\n'));
  console.log(`  ${border}`);
  console.log(`  ${border}  ${url}`);
  console.log(`  ${pc.dim('└' + '─'.repeat(WIDTH - 3))}`);
}

export function displayPapers(papers: Paper[]): void {
  if (papers.length === 0) {
    console.log(pc.yellow('\n  No papers found.\n'));
    return;
  }

  console.log(
    pc.dim(`\n  Found ${papers.length} paper${papers.length !== 1 ? 's' : ''}:`)
  );

  for (let i = 0; i < papers.length; i++) {
    displayPaper(papers[i], i);
  }
}

export function displayBriefPaper(
  paper: Paper,
  index: number,
  metric?: { label: string; value: number }
): void {
  const num = pc.bold(pc.cyan(`[${index + 1}]`));
  const title = pc.bold(pc.white(paper.title));
  const badge = metric ? pc.green(` ${metric.label} ${metric.value}`) : '';
  const authors = pc.dim(truncateAuthors(paper.authors));
  const date = paper.published.split('T')[0];
  const cat = paper.primaryCategory ? ` · ${paper.primaryCategory}` : '';
  const meta = pc.yellow(`${date}${cat}`);
  const summary = paper.summary || paper.abstract.slice(0, 150) + '...';
  const url = pc.dim(paper.abstractUrl);

  const border = pc.dim('│');

  console.log('');
  console.log(`  ${pc.dim('┌─')} ${num}${badge} ${pc.dim('─'.repeat(Math.max(0, WIDTH - 18 - (metric ? metric.label.length + String(metric.value).length : 0))))}`);
  console.log(`  ${border}  ${title}`);
  console.log(`  ${border}  ${authors} ${pc.dim('·')} ${meta}`);
  console.log(wrapText(summary, 0, WIDTH - 6).split('\n').map(l => `  ${border}  ${l.trimStart()}`).join('\n'));
  console.log(`  ${border}  ${url}`);
  console.log(`  ${pc.dim('└' + '─'.repeat(WIDTH - 3))}`);
}

export function displayBrief(
  papers: Paper[],
  themeName: string,
  source: string,
  metrics?: { label: string; values: number[] }
): void {
  if (papers.length === 0) {
    console.log(pc.yellow(`\n  No trending papers found for ${themeName}.\n`));
    return;
  }

  console.log(`\n  ${pc.bold(pc.magenta('Trending in ' + themeName))} ${pc.dim('· ' + papers.length + ' papers · via ' + source)}`);

  for (let i = 0; i < papers.length; i++) {
    const metric = metrics ? { label: metrics.label, value: metrics.values[i] } : undefined;
    displayBriefPaper(papers[i], i, metric);
  }
}

export function displayFullAbstract(paper: Paper, index: number): void {
  const num = pc.bold(pc.cyan(`[${index + 1}]`));
  const title = pc.bold(pc.white(paper.title));

  console.log(`\n  ${num} ${title}\n`);
  console.log(wrapText(paper.abstract, 4, WIDTH));
  console.log('');
}

export function displayBullets(paper: Paper, index: number, bullets: string): void {
  const num = pc.bold(pc.cyan(`[${index + 1}]`));
  const title = pc.bold(pc.white(paper.title));

  console.log(`\n  ${num} ${title}\n`);
  // Indent bullet text
  const lines = bullets.split('\n');
  for (const line of lines) {
    console.log(`    ${line}`);
  }
  console.log('');
}
