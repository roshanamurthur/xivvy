import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import pc from 'picocolors';
import { loadConfig } from './config.js';
import { createSpinner } from './spinner.js';

const DEFAULT_DIR = join(homedir(), 'papers');

export function getDownloadDir(): string {
  const config = loadConfig();
  return config.downloadDir || DEFAULT_DIR;
}

function sanitizeFilename(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9\s\-_]/g, '')
    .replace(/\s+/g, '_')
    .slice(0, 80);
}

function parseArxivId(input: string): string {
  // Handle full URLs like https://arxiv.org/abs/2602.24286v1
  // or https://arxiv.org/pdf/2602.24286v1
  // or just the ID like 2602.24286 or 2602.24286v1
  const urlMatch = input.match(/arxiv\.org\/(?:abs|pdf)\/([^\s?#]+)/);
  if (urlMatch) return urlMatch[1];

  // Raw ID (with or without version)
  const idMatch = input.match(/^(\d{4}\.\d{4,5}(?:v\d+)?)$/);
  if (idMatch) return idMatch[1];

  // Old-style IDs like hep-ex/0307015
  const oldMatch = input.match(/^([a-z-]+\/\d+(?:v\d+)?)$/);
  if (oldMatch) return oldMatch[1];

  return input.trim();
}

export async function downloadPdf(
  idOrUrl: string,
  title?: string
): Promise<string> {
  const id = parseArxivId(idOrUrl);
  const pdfUrl = `https://arxiv.org/pdf/${id}`;

  const dir = getDownloadDir();
  mkdirSync(dir, { recursive: true });

  const safeName = title ? sanitizeFilename(title) : id.replace('/', '_');
  const filename = `${safeName}.pdf`;
  const filepath = join(dir, filename);

  const spinner = createSpinner(`Downloading ${id}...`);

  try {
    const res = await fetch(pdfUrl, { redirect: 'follow' });

    if (!res.ok) {
      spinner.stop('');
      throw new Error(`Failed to download: ${res.status} ${res.statusText}`);
    }

    const buffer = Buffer.from(await res.arrayBuffer());
    writeFileSync(filepath, buffer);

    spinner.stop('');
    console.log(pc.green(`\n  Downloaded: ${filepath}`));
    console.log(pc.dim(`  Source: ${pdfUrl}\n`));

    return filepath;
  } catch (err: any) {
    spinner.stop('');
    throw err;
  }
}
