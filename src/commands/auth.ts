import * as readline from 'node:readline';
import pc from 'picocolors';
import { loadConfig, saveConfig, getConfigDir, getApiKey } from '../lib/config.js';

export async function setKeyCommand(): Promise<void> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const ask = (q: string): Promise<string> =>
    new Promise((resolve) => rl.question(q, (a) => resolve(a.trim())));

  console.log(`\n  ${pc.bold('Set your Anthropic API key')}`);
  console.log(pc.dim(`  Get one at https://console.anthropic.com/settings/keys\n`));

  const key = await ask(`  ${pc.bold('API key')}: `);
  rl.close();

  if (!key) {
    console.log(pc.red('\n  No key provided. Aborted.\n'));
    process.exit(1);
  }

  if (!key.startsWith('sk-ant-')) {
    console.log(pc.yellow('\n  Warning: key doesn\'t start with sk-ant-. Saving anyway.\n'));
  }

  const config = loadConfig();
  config.apiKey = key;
  saveConfig(config);

  console.log(pc.green(`\n  Key saved to ${getConfigDir()}/config.json`));
  console.log(pc.dim(`  (ANTHROPIC_API_KEY env var will override this if set)\n`));
}

export async function statusCommand(): Promise<void> {
  const key = getApiKey();

  if (!key) {
    console.log(`\n  ${pc.red('No API key configured.')}`);
    console.log(pc.dim(`  Run: xivvy auth set-key\n`));
    return;
  }

  const source = process.env.ANTHROPIC_API_KEY ? 'environment variable' : 'config file';
  const masked = key.slice(0, 10) + '...' + key.slice(-4);
  console.log(`\n  ${pc.green('API key configured')} ${pc.dim(`(from ${source})`)}`);
  console.log(`  ${pc.dim(masked)}\n`);
}
