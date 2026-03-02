import pc from 'picocolors';
import { pick } from '../lib/picker.js';
import { getThemes } from '../lib/themes.js';
import { fetchTrendingPapers } from '../lib/huggingface.js';
import { fetchScholarPapers } from '../lib/scholar.js';
import { summarizePapers } from '../lib/summarizer.js';
import { displayBrief } from '../lib/display.js';
import { createSpinner } from '../lib/spinner.js';
import { startSession } from './session.js';
import { getApiKey } from '../lib/config.js';
import type { Paper } from '../types/index.js';

export async function briefCommand(opts: {
  source?: string;
  limit?: string;
  noSession?: boolean;
}): Promise<void> {
  const themes = getThemes();
  const source = opts.source || 'hf';
  const limit = opts.limit ? parseInt(opts.limit, 10) : 10;

  // Theme picker
  const themeNames = themes.map((t) => t.name);
  const selected = await pick(themeNames, 'Select a theme:');
  const theme = themes[selected];

  console.log(pc.dim(`\n  Selected: ${pc.bold(theme.name)}`));

  const spinner = createSpinner(
    source === 'scholar'
      ? 'Fetching from Semantic Scholar...'
      : 'Fetching trending papers from HuggingFace...'
  );

  let papers: Paper[] = [];
  let metrics: { label: string; values: number[] } | undefined;

  try {
    if (source === 'scholar') {
      const results = await fetchScholarPapers(theme, limit * 3);

      // Split: papers with citations vs without
      const withCitations = results.filter((p) => p.citations > 0);
      const withoutCitations = results.filter((p) => p.citations === 0);

      let ranked: (Paper & { citations: number })[];

      if (withCitations.length >= limit) {
        ranked = withCitations.slice(0, limit);
      } else {
        // Fill remaining slots with LLM-ranked zero-citation papers
        ranked = [...withCitations];
        const remaining = limit - ranked.length;

        if (withoutCitations.length > 0 && remaining > 0 && getApiKey()) {
          spinner.update('Ranking recent papers with Claude...');
          const candidates = withoutCitations.slice(0, remaining * 2);
          try {
            const summarized = await summarizePapers(candidates);
            ranked.push(
              ...summarized.slice(0, remaining).map((p) => ({ ...p, citations: 0 }))
            );
          } catch {
            // LLM failed, just use what we have
            ranked.push(...withoutCitations.slice(0, remaining).map((p) => ({ ...p, citations: 0 })));
          }
        } else {
          ranked.push(...withoutCitations.slice(0, remaining).map((p) => ({ ...p, citations: 0 })));
        }
      }

      papers = ranked;
      metrics = {
        label: 'citations',
        values: ranked.map((p) => p.citations),
      };
    } else {
      // HuggingFace source
      const results = await fetchTrendingPapers(theme, limit);
      papers = results;
      metrics = {
        label: '▲',
        values: results.map((p) => p.upvotes),
      };
    }
  } catch (err: any) {
    spinner.stop('');
    console.error(pc.red(`\n  Error: ${err.message}\n`));
    process.exit(1);
  }

  spinner.stop('');

  const sourceName = source === 'scholar' ? 'Semantic Scholar' : 'HuggingFace';
  displayBrief(papers, theme.name, sourceName, metrics);

  if (!opts.noSession && papers.length > 0) {
    await startSession(papers);
  }
}
