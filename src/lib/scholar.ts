import type { Paper } from '../types/index.js';
import type { Theme } from './themes.js';

const S2_API = 'https://api.semanticscholar.org/graph/v1/paper/search';
const FIELDS = 'title,abstract,citationCount,influentialCitationCount,year,authors,externalIds,url';

interface S2Paper {
  paperId: string;
  title: string;
  abstract: string | null;
  citationCount: number;
  influentialCitationCount: number;
  year: number;
  authors: { name: string }[];
  externalIds: { ArXiv?: string; DOI?: string } | null;
  url: string;
}

interface S2Response {
  total: number;
  data: S2Paper[];
}

function s2ToPaper(raw: S2Paper): Paper & { citations: number } {
  const arxivId = raw.externalIds?.ArXiv || '';
  return {
    id: arxivId || raw.paperId,
    title: (raw.title || '').replace(/\s+/g, ' ').trim(),
    authors: (raw.authors || []).map((a) => a.name),
    abstract: (raw.abstract || '').replace(/\s+/g, ' ').trim(),
    published: raw.year ? `${raw.year}` : '',
    updated: '',
    categories: [],
    primaryCategory: '',
    pdfUrl: arxivId ? `https://arxiv.org/pdf/${arxivId}` : '',
    abstractUrl: arxivId ? `https://arxiv.org/abs/${arxivId}` : raw.url,
    citations: raw.citationCount || 0,
  };
}

export async function fetchScholarPapers(
  theme: Theme,
  limit: number = 50
): Promise<(Paper & { citations: number })[]> {
  const query = theme.keywords.slice(0, 3).join(' ');
  const currentYear = new Date().getFullYear();

  const params = new URLSearchParams({
    query,
    limit: String(limit),
    fields: FIELDS,
    year: `${currentYear - 1}-${currentYear}`,
  });

  const res = await fetch(`${S2_API}?${params}`);
  if (!res.ok) {
    throw new Error(`Semantic Scholar API error: ${res.status} ${res.statusText}`);
  }

  const data: S2Response = await res.json() as S2Response;
  const papers = (data.data || [])
    .filter((p) => p.abstract) // Skip papers without abstracts
    .map(s2ToPaper);

  // Sort by citation count descending
  papers.sort((a, b) => b.citations - a.citations);

  return papers.slice(0, limit);
}
