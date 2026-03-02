import Anthropic from '@anthropic-ai/sdk';
import type { Paper, SessionContext } from '../types/index.js';

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error(
        'ANTHROPIC_API_KEY not set. Export it or pass --api-key.\n\n  export ANTHROPIC_API_KEY=sk-ant-...'
      );
    }
    client = new Anthropic({ apiKey });
  }
  return client;
}

export async function summarizePapers(papers: Paper[]): Promise<Paper[]> {
  const c = getClient();

  const paperList = papers
    .map(
      (p, i) =>
        `[${i + 1}] "${p.title}"\nAbstract: ${p.abstract}`
    )
    .join('\n\n');

  const msg = await c.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2048,
    messages: [
      {
        role: 'user',
        content: `Summarize each paper below in exactly 1-2 sentences. Focus on what the paper does and its key contribution. Return ONLY a numbered list matching the paper numbers, nothing else.

${paperList}`,
      },
    ],
  });

  const text =
    msg.content[0].type === 'text' ? msg.content[0].text : '';

  // Parse numbered summaries
  const lines = text.split('\n').filter((l) => l.trim());
  const summaries: string[] = [];

  for (const line of lines) {
    const match = line.match(/^\[?(\d+)\]?\.?\s*(.+)/);
    if (match) {
      summaries.push(match[2].trim());
    }
  }

  return papers.map((p, i) => ({
    ...p,
    summary: summaries[i] || p.abstract.slice(0, 200) + '...',
  }));
}

export async function bulletSummary(paper: Paper): Promise<string> {
  const c = getClient();

  const msg = await c.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `Give a concise bullet-point summary of this paper. Use 3-5 bullets covering: problem, approach, key results, and significance.

Title: ${paper.title}
Abstract: ${paper.abstract}`,
      },
    ],
  });

  return msg.content[0].type === 'text' ? msg.content[0].text : '';
}

export async function queryPapers(
  ctx: SessionContext,
  question: string
): Promise<string> {
  const c = getClient();

  const paperContext = ctx.papers
    .map(
      (p, i) =>
        `[${i + 1}] "${p.title}"\nAuthors: ${p.authors.join(', ')}\nCategories: ${p.categories.join(', ')}\nPublished: ${p.published}\nAbstract: ${p.abstract}`
    )
    .join('\n\n---\n\n');

  const messages = [
    ...ctx.history.map((h) => ({
      role: h.role as 'user' | 'assistant',
      content: h.content,
    })),
    { role: 'user' as const, content: question },
  ];

  const msg = await c.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    system: `You are a research assistant helping the user explore arXiv papers. You have access to these papers:\n\n${paperContext}\n\nAnswer questions concisely. Refer to papers by their number. If asked about something not in the papers, say so.`,
    messages,
  });

  return msg.content[0].type === 'text' ? msg.content[0].text : '';
}
