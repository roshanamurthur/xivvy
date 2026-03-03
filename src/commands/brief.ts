import pc from 'picocolors';
import { pick } from '../lib/picker.js';
import { getThemes, matchTheme } from '../lib/themes.js';
import { fetchTrendingPapers, searchHFPapers } from '../lib/huggingface.js';
import { fetchScholarPapers } from '../lib/scholar.js';
import { searchPapers } from '../lib/arxiv.js';
import { generateBriefing, summarizePapers } from '../lib/summarizer.js';
import { displayBriefing } from '../lib/display.js';
import { createSpinner } from '../lib/spinner.js';
import { startSession } from './session.js';
import { getApiKey } from '../lib/config.js';
import type { Paper } from '../types/index.js';
import type { Theme } from '../lib/themes.js';

function parseDuration(input: string): { days: number; label: string } {
  const match = input.match(/^(\d+)([dwm])$/i);
  if (!match) return { days: 7, label: '7d' };

  const amount = parseInt(match[1], 10);
  const unit = match[2].toLowerCase();

  switch (unit) {
    case 'd': return { days: amount, label: `${amount}d` };
    case 'w': return { days: amount * 7, label: `${amount}w` };
    case 'm': return { days: amount * 30, label: `${amount}m` };
    default: return { days: 7, label: '7d' };
  }
}

export async function briefCommand(
  topic: string | undefined,
  duration: string | undefined,
  source: string | undefined,
  opts: { limit?: string; noSession?: boolean }
): Promise<void> {
  const limit = opts.limit ? parseInt(opts.limit, 10) : 10;
  const { days, label: durationLabel } = parseDuration(duration || '7d');
  const src = source || 'hf';

  // Resolve theme: match to closest if topic given, otherwise pick interactively
  let theme: Theme;
  let topicQuery: string;

  if (topic) {
    theme = matchTheme(topic);
    topicQuery = topic;
    console.log(pc.dim(`\n  Matched theme: ${pc.bold(theme.name)}`));
  } else {
    const themes = getThemes();
    const themeNames = themes.map((t) => t.name);
    const selected = await pick(themeNames, 'Select a theme:');
    theme = themes[selected];
    topicQuery = theme.keywords.slice(0, 3).join(' ');
    console.log(pc.dim(`\n  Selected: ${pc.bold(theme.name)}`));
  }

  const sourceLabels: Record<string, string> = {
    hf: 'HuggingFace',
    arxiv: 'arXiv',
    scholar: 'Semantic Scholar',
  };
  const sourceName = sourceLabels[src] || src;

  const spinner = createSpinner(`Fetching from ${sourceName}...`);

  let papers: Paper[] = [];
  let metrics: { label: string; values: number[] } | undefined;

  try {
    if (src === 'arxiv') {
      const to = new Date();
      const from = new Date();
      from.setDate(from.getDate() - days);

      const results = await searchPapers({
        query: topicQuery,
        category: theme.categories?.[0],
        limit: limit * 3, // Fetch extra, will trim after
        sortBy: 'submittedDate',
        dateRange: { from, to },
      });

      papers = results.slice(0, limit);

    } else if (src === 'scholar') {
      const results = await fetchScholarPapers(theme, limit * 3);
      const withCitations = results.filter((p) => p.citations > 0);
      const withoutCitations = results.filter((p) => p.citations === 0);

      let ranked: (Paper & { citations: number })[];

      if (withCitations.length >= limit) {
        ranked = withCitations.slice(0, limit);
      } else {
        ranked = [...withCitations];
        const remaining = limit - ranked.length;
        ranked.push(
          ...withoutCitations.slice(0, remaining).map((p) => ({ ...p, citations: 0 }))
        );
      }

      papers = ranked;
      metrics = {
        label: 'citations',
        values: ranked.map((p) => p.citations),
      };

    } else {
      // HuggingFace — multi-day fetch + theme filter
      if (topic) {
        // Use search endpoint for freeform topics
        const searchResults = await searchHFPapers(topicQuery, limit * 2);
        // Also fetch daily papers for upvote data
        const dailyResults = await fetchTrendingPapers(theme, limit * 2, days);
        // Merge: prefer daily (has upvotes), add search results
        const seen = new Set(dailyResults.map((p) => p.id));
        const merged = [...dailyResults];
        for (const p of searchResults) {
          if (!seen.has(p.id)) {
            seen.add(p.id);
            merged.push(p);
          }
        }
        merged.sort((a, b) => b.upvotes - a.upvotes);
        papers = merged.slice(0, limit);
        metrics = { label: '▲', values: merged.slice(0, limit).map((p) => p.upvotes) };
      } else {
        const results = await fetchTrendingPapers(theme, limit, days);
        papers = results;
        metrics = { label: '▲', values: results.map((p) => p.upvotes) };
      }
    }
  } catch (err: any) {
    spinner.stop('');
    console.error(pc.red(`\n  Error: ${err.message}\n`));
    process.exit(1);
  }

  if (papers.length === 0) {
    spinner.stop('');
    console.log(pc.yellow(`\n  No papers found for "${theme.name}" in the last ${durationLabel}.\n`));
    return;
  }

  // Generate natural-language briefing with Claude
  let bullets: string[] = [];
  const hasKey = !!getApiKey();

  if (hasKey) {
    spinner.update('Writing briefing with Claude...');
    try {
      bullets = await generateBriefing(papers);
    } catch (err: any) {
      // Fall back to raw summaries/abstracts
      bullets = papers.map((p) =>
        p.summary || p.abstract.slice(0, 200) + '...'
      );
    }
  } else {
    bullets = papers.map((p) =>
      p.summary || p.abstract.slice(0, 200) + '...'
    );
  }

  spinner.stop('');

  displayBriefing(papers, bullets, theme.name, durationLabel, sourceName, metrics);

  // Auto-enter session
  if (!opts.noSession && papers.length > 0) {
    await startSession(papers);
  }
}
