import Anthropic from '@anthropic-ai/sdk';
import type { Paper, SessionContext } from '../types/index.js';
import { getLLMConfig, type LLMConfig } from './config.js';

let anthropicClient: Anthropic | null = null;

function getConfig(): LLMConfig {
  const config = getLLMConfig();
  if (!config) {
    throw new Error(
      'No API key configured. Run:\n\n  xivvy auth set-key'
    );
  }
  return config;
}

function getAnthropicClient(apiKey: string): Anthropic {
  if (!anthropicClient) {
    anthropicClient = new Anthropic({ apiKey });
  }
  return anthropicClient;
}

async function chat(opts: {
  system?: string;
  message: string;
  maxTokens: number;
}): Promise<string> {
  const config = getConfig();

  if (config.provider === 'openai') {
    const messages: { role: string; content: string }[] = [];
    if (opts.system) messages.push({ role: 'system', content: opts.system });
    messages.push({ role: 'user', content: opts.message });

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages,
        max_tokens: opts.maxTokens,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`OpenAI API error: ${res.status} ${body.slice(0, 200)}`);
    }

    const data = (await res.json()) as any;
    return data.choices?.[0]?.message?.content || '';
  }

  // Anthropic
  const client = getAnthropicClient(config.apiKey);
  const msg = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: opts.maxTokens,
    ...(opts.system ? { system: opts.system } : {}),
    messages: [{ role: 'user', content: opts.message }],
  });

  return msg.content[0].type === 'text' ? msg.content[0].text : '';
}

async function chatMultiTurn(opts: {
  system?: string;
  messages: { role: 'user' | 'assistant'; content: string }[];
  maxTokens: number;
}): Promise<string> {
  const config = getConfig();

  if (config.provider === 'openai') {
    const messages: { role: string; content: string }[] = [];
    if (opts.system) messages.push({ role: 'system', content: opts.system });
    messages.push(...opts.messages);

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages,
        max_tokens: opts.maxTokens,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`OpenAI API error: ${res.status} ${body.slice(0, 200)}`);
    }

    const data = (await res.json()) as any;
    return data.choices?.[0]?.message?.content || '';
  }

  // Anthropic
  const client = getAnthropicClient(config.apiKey);
  const msg = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: opts.maxTokens,
    ...(opts.system ? { system: opts.system } : {}),
    messages: opts.messages,
  });

  return msg.content[0].type === 'text' ? msg.content[0].text : '';
}

// --- Public API ---

export async function summarizePapers(papers: Paper[]): Promise<Paper[]> {
  const paperList = papers
    .map((p, i) => `[${i + 1}] "${p.title}"\nAbstract: ${p.abstract}`)
    .join('\n\n');

  const text = await chat({
    message: `Summarize each paper below in exactly 1-2 sentences. Focus on what the paper does and its key contribution. Return ONLY a numbered list matching the paper numbers, nothing else.\n\n${paperList}`,
    maxTokens: 2048,
  });

  const lines = text.split('\n').filter((l) => l.trim());
  const summaries: string[] = [];
  for (const line of lines) {
    const match = line.match(/^\[?(\d+)\]?\.?\s*(.+)/);
    if (match) summaries.push(match[2].trim());
  }

  return papers.map((p, i) => ({
    ...p,
    summary: summaries[i] || p.abstract.slice(0, 200) + '...',
  }));
}

export async function generateBriefing(papers: Paper[]): Promise<string[]> {
  const paperList = papers
    .map((p, i) => `[${i + 1}] "${p.title}"\nAbstract: ${p.abstract}`)
    .join('\n\n');

  const text = await chat({
    message: `You are writing a research briefing for a busy person. For each paper below, write exactly ONE bullet point that:
- Uses plain English with minimal jargon
- States what the paper actually contributes (the new thing they built/discovered/proved)
- Explains what this enables or what their key conclusion was
- Is 1-2 sentences max

Return ONLY a numbered list. No headers, no extra text.

${paperList}`,
    maxTokens: 3000,
  });

  const bullets: string[] = [];
  for (const line of text.split('\n').filter((l) => l.trim())) {
    const match = line.match(/^\[?(\d+)\]?\.?\s*[-•]?\s*(.+)/);
    if (match) bullets.push(match[2].trim());
  }
  return bullets;
}

export async function bulletSummary(paper: Paper): Promise<string> {
  return chat({
    message: `Give a concise bullet-point summary of this paper. Use 3-5 bullets covering: problem, approach, key results, and significance.\n\nTitle: ${paper.title}\nAbstract: ${paper.abstract}`,
    maxTokens: 1024,
  });
}

export async function queryPapers(
  ctx: SessionContext,
  question: string
): Promise<string> {
  const paperContext = ctx.papers
    .map(
      (p, i) =>
        `[${i + 1}] "${p.title}"\nAuthors: ${p.authors.join(', ')}\nCategories: ${p.categories.join(', ')}\nPublished: ${p.published}\nAbstract: ${p.abstract}`
    )
    .join('\n\n---\n\n');

  const messages: { role: 'user' | 'assistant'; content: string }[] = [
    ...ctx.history,
    { role: 'user', content: question },
  ];

  return chatMultiTurn({
    system: `You are a research assistant helping the user explore arXiv papers. You have access to these papers:\n\n${paperContext}\n\nAnswer questions concisely. Refer to papers by their number. If asked about something not in the papers, say so.`,
    messages,
    maxTokens: 1024,
  });
}
