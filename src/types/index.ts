export interface Paper {
  id: string;
  title: string;
  authors: string[];
  abstract: string;
  summary?: string;
  published: string;
  updated: string;
  categories: string[];
  primaryCategory: string;
  pdfUrl: string;
  abstractUrl: string;
}

export interface SearchOptions {
  query?: string;
  category?: string;
  limit?: number;
  sortBy?: 'relevance' | 'lastUpdatedDate' | 'submittedDate';
  dateRange?: { from: Date; to: Date };
}

export interface SessionContext {
  papers: Paper[];
  history: { role: 'user' | 'assistant'; content: string }[];
}
