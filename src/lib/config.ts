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
  apiKey?: string;
  themes?: ThemeConfig[];
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
    mode: 0o600, // owner-only read/write
  });
}

export function getApiKey(): string | undefined {
  // Env var takes precedence over config file
  return process.env.ANTHROPIC_API_KEY || loadConfig().apiKey;
}
