import { XMLParser } from 'fast-xml-parser';
import type { Paper, SearchOptions } from '../types/index.js';

const API_BASE = 'https://export.arxiv.org/api/query';

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  isArray: (_name, jpath) => {
    return [
      'feed.entry',
      'feed.entry.author',
      'feed.entry.category',
      'feed.entry.link',
    ].includes(jpath);
  },
});

function formatArxivDate(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  const h = String(date.getUTCHours()).padStart(2, '0');
  const min = String(date.getUTCMinutes()).padStart(2, '0');
  return `${y}${m}${d}${h}${min}`;
}

function buildQuery(opts: SearchOptions): string {
  const parts: string[] = [];

  if (opts.query) {
    parts.push(`all:${opts.query}`);
  }
  if (opts.category) {
    parts.push(`cat:${opts.category}`);
  }
  if (opts.dateRange) {
    const from = formatArxivDate(opts.dateRange.from);
    const to = formatArxivDate(opts.dateRange.to);
    parts.push(`submittedDate:[${from}+TO+${to}]`);
  }

  return parts.join('+AND+');
}

function parsePaper(entry: any): Paper {
  const authors: string[] = (entry.author || []).map(
    (a: any) => a.name || 'Unknown'
  );

  const categories: string[] = (entry.category || []).map(
    (c: any) => c['@_term']
  );

  const primaryCategory =
    entry['arxiv:primary_category']?.['@_term'] || categories[0] || '';

  const links = entry.link || [];
  const pdfLink = links.find(
    (l: any) => l['@_title'] === 'pdf' || l['@_type'] === 'application/pdf'
  );
  const abstractLink = links.find(
    (l: any) => l['@_rel'] === 'alternate'
  );

  // Extract clean ID from the URL
  const rawId: string = entry.id || '';
  const id = rawId.replace('http://arxiv.org/abs/', '').replace('https://arxiv.org/abs/', '');

  // Clean up title (remove newlines/extra whitespace)
  const title = (entry.title || '').replace(/\s+/g, ' ').trim();
  const abstract = (entry.summary || '').replace(/\s+/g, ' ').trim();

  return {
    id,
    title,
    authors,
    abstract,
    published: entry.published || '',
    updated: entry.updated || '',
    categories,
    primaryCategory,
    pdfUrl: pdfLink?.['@_href'] || `https://arxiv.org/pdf/${id}`,
    abstractUrl: abstractLink?.['@_href'] || `https://arxiv.org/abs/${id}`,
  };
}

export async function fetchPaperById(arxivId: string): Promise<Paper | null> {
  const url = `${API_BASE}?id_list=${arxivId}&max_results=1`;
  const res = await fetch(url);
  if (!res.ok) return null;

  const xml = await res.text();
  const parsed = parser.parse(xml);
  const entries = parsed?.feed?.entry;
  if (!entries || entries.length === 0) return null;

  const entry = entries[0];
  // ArXiv returns a stub entry with no title when ID is not found
  if (!entry.title || entry.title === 'Error') return null;

  return parsePaper(entry);
}

export async function searchPapers(opts: SearchOptions): Promise<Paper[]> {
  const query = buildQuery(opts);
  const limit = opts.limit || 10;
  const sortBy = opts.sortBy || 'submittedDate';

  const params = new URLSearchParams({
    search_query: query,
    start: '0',
    max_results: String(limit),
    sortBy,
    sortOrder: 'descending',
  });

  const url = `${API_BASE}?${params}`;
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`ArXiv API error: ${res.status} ${res.statusText}`);
  }

  const xml = await res.text();
  const parsed = parser.parse(xml);

  const entries = parsed?.feed?.entry;
  if (!entries || entries.length === 0) {
    return [];
  }

  return entries.map(parsePaper);
}
