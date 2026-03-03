import type { Paper } from '../types/index.js';
import type { Theme } from './themes.js';

const HF_DAILY_API = 'https://huggingface.co/api/daily_papers';
const HF_SEARCH_API = 'https://huggingface.co/api/papers/search';

interface HFRawPaper {
  paper: {
    id: string;
    title: string;
    summary: string;
    authors: { name: string }[];
    publishedAt: string;
    upvotes: number;
    ai_summary?: string;
    ai_keywords?: string[];
  };
  publishedAt: string;
  numComments: number;
}

function toArray(val: unknown): unknown[] {
  return Array.isArray(val) ? val : [];
}

function hfToPaper(raw: HFRawPaper): Paper & { upvotes: number; aiKeywords: string[] } {
  const p = raw.paper;
  const id = p.id || '';
  return {
    id,
    title: (p.title || '').replace(/\s+/g, ' ').trim(),
    authors: toArray(p.authors).map((a: any) => a.name || 'Unknown'),
    abstract: (p.summary || '').replace(/\s+/g, ' ').trim(),
    summary: p.ai_summary || undefined,
    published: p.publishedAt || raw.publishedAt || '',
    updated: '',
    categories: [],
    primaryCategory: '',
    pdfUrl: `https://arxiv.org/pdf/${id}`,
    abstractUrl: `https://arxiv.org/abs/${id}`,
    upvotes: p.upvotes || 0,
    aiKeywords: p.ai_keywords || [],
  };
}

function matchesTheme(
  paper: Paper & { aiKeywords: string[] },
  theme: Theme
): boolean {
  const text = `${paper.title} ${paper.abstract} ${paper.aiKeywords.join(' ')}`.toLowerCase();
  return theme.keywords.some((kw) => text.includes(kw.toLowerCase()));
}

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function deduplicateById(papers: (Paper & { upvotes: number; aiKeywords: string[] })[]): (Paper & { upvotes: number; aiKeywords: string[] })[] {
  const seen = new Set<string>();
  return papers.filter((p) => {
    if (seen.has(p.id)) return false;
    seen.add(p.id);
    return true;
  });
}

export async function fetchTrendingPapers(
  theme: Theme,
  limit: number = 10,
  days: number = 1
): Promise<(Paper & { upvotes: number })[]> {
  const allPapers: (Paper & { upvotes: number; aiKeywords: string[] })[] = [];

  // Fetch papers for each day in the range
  const today = new Date();
  for (let i = 0; i < days; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = formatDate(date);

    try {
      const res = await fetch(`${HF_DAILY_API}?date=${dateStr}`);
      if (!res.ok) continue;
      const raw: HFRawPaper[] = (await res.json()) as HFRawPaper[];
      allPapers.push(...raw.map(hfToPaper));
    } catch {
      // Skip days that fail (weekends, gaps)
      continue;
    }
  }

  const unique = deduplicateById(allPapers);

  // Filter by theme keywords
  const matched = unique.filter((p) => matchesTheme(p, theme));

  // Sort by upvotes descending
  matched.sort((a, b) => b.upvotes - a.upvotes);

  return matched.slice(0, limit);
}

export async function searchHFPapers(
  query: string,
  limit: number = 20
): Promise<(Paper & { upvotes: number })[]> {
  const res = await fetch(`${HF_SEARCH_API}?q=${encodeURIComponent(query)}&limit=${limit}`);
  if (!res.ok) {
    throw new Error(`HuggingFace search error: ${res.status} ${res.statusText}`);
  }

  const raw: HFRawPaper[] = (await res.json()) as HFRawPaper[];
  const papers = raw.map(hfToPaper);

  papers.sort((a, b) => b.upvotes - a.upvotes);
  return papers.slice(0, limit);
}
