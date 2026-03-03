import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';

const CONFIG_DIR = join(homedir(), '.config', 'xivvy');
const CONFIG_FILE = join(CONFIG_DIR, 'config.json');

interface ThemeConfig {
  name: string;
  keywords: string[];
  categories?: string[];
}

interface Config {
  apiKey?: string;       // legacy / Anthropic
  anthropicKey?: string;
  openaiKey?: string;
  themes?: ThemeConfig[];
}

export type Provider = 'anthropic' | 'openai';

export interface LLMConfig {
  provider: Provider;
  apiKey: string;
}

export function getConfigDir(): string {
  return CONFIG_DIR;
}

export function loadConfig(): Config {
  try {
    const raw = readFileSync(CONFIG_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export function saveConfig(config: Config): void {
  mkdirSync(CONFIG_DIR, { recursive: true });
  writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2) + '\n', {
    mode: 0o600,
  });
}

export function getLLMConfig(): LLMConfig | undefined {
  // Env vars take precedence
  if (process.env.ANTHROPIC_API_KEY) {
    return { provider: 'anthropic', apiKey: process.env.ANTHROPIC_API_KEY };
  }
  if (process.env.OPENAI_API_KEY) {
    return { provider: 'openai', apiKey: process.env.OPENAI_API_KEY };
  }

  // Then config file
  const config = loadConfig();
  if (config.anthropicKey || config.apiKey) {
    return { provider: 'anthropic', apiKey: (config.anthropicKey || config.apiKey)! };
  }
  if (config.openaiKey) {
    return { provider: 'openai', apiKey: config.openaiKey };
  }

  return undefined;
}

// Backwards compat
export function getApiKey(): string | undefined {
  return getLLMConfig()?.apiKey;
}
