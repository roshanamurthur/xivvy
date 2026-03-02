import type { Paper } from '../types/index.js';
import type { Theme } from './themes.js';

const HF_API = 'https://huggingface.co/api/daily_papers';

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

export async function fetchTrendingPapers(
  theme: Theme,
  limit: number = 10
): Promise<(Paper & { upvotes: number })[]> {
  const res = await fetch(HF_API);
  if (!res.ok) {
    throw new Error(`HuggingFace API error: ${res.status} ${res.statusText}`);
  }

  const raw: HFRawPaper[] = await res.json() as HFRawPaper[];
  const papers = raw.map(hfToPaper);

  // Filter by theme keywords
  const matched = papers.filter((p) => matchesTheme(p, theme));

  // Sort by upvotes descending
  matched.sort((a, b) => b.upvotes - a.upvotes);

  return matched.slice(0, limit);
}
