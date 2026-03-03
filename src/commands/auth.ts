import * as readline from 'node:readline';
import pc from 'picocolors';
import { loadConfig, saveConfig, getConfigDir, getLLMConfig } from '../lib/config.js';

export async function setKeyCommand(): Promise<void> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const ask = (q: string): Promise<string> =>
    new Promise((resolve) => rl.question(q, (a) => resolve(a.trim())));

  console.log(`\n  ${pc.bold('Set your LLM API key')}`);
  console.log(pc.dim(`  Supports Anthropic (Claude) and OpenAI (GPT)`));
  console.log(pc.dim(`  Anthropic: https://console.anthropic.com/settings/keys`));
  console.log(pc.dim(`  OpenAI:    https://platform.openai.com/api-keys\n`));

  const key = await ask(`  ${pc.bold('API key')}: `);
  rl.close();

  if (!key) {
    console.log(pc.red('\n  No key provided. Aborted.\n'));
    process.exit(1);
  }

  const config = loadConfig();

  // Auto-detect provider from key prefix
  if (key.startsWith('sk-ant-')) {
    config.anthropicKey = key;
    console.log(pc.green(`\n  Anthropic key saved to ${getConfigDir()}/config.json`));
  } else if (key.startsWith('sk-')) {
    config.openaiKey = key;
    console.log(pc.green(`\n  OpenAI key saved to ${getConfigDir()}/config.json`));
  } else {
    // Unknown prefix, save as Anthropic by default
    config.anthropicKey = key;
    console.log(pc.yellow(`\n  Unknown key prefix. Saved as Anthropic key.`));
    console.log(pc.green(`  Saved to ${getConfigDir()}/config.json`));
  }

  saveConfig(config);
  console.log(pc.dim(`  (env vars ANTHROPIC_API_KEY / OPENAI_API_KEY override this)\n`));
}

export async function statusCommand(): Promise<void> {
  const llm = getLLMConfig();

  if (!llm) {
    console.log(`\n  ${pc.red('No API key configured.')}`);
    console.log(pc.dim(`  Run: xivvy auth set-key\n`));
    return;
  }

  const envVar = llm.provider === 'anthropic' ? 'ANTHROPIC_API_KEY' : 'OPENAI_API_KEY';
  const fromEnv =
    (llm.provider === 'anthropic' && process.env.ANTHROPIC_API_KEY) ||
    (llm.provider === 'openai' && process.env.OPENAI_API_KEY);
  const source = fromEnv ? 'environment variable' : 'config file';
  const provider = llm.provider === 'anthropic' ? 'Anthropic (Claude)' : 'OpenAI (GPT)';
  const masked = llm.apiKey.slice(0, 10) + '...' + llm.apiKey.slice(-4);

  console.log(`\n  ${pc.green('API key configured')}`);
  console.log(`  ${pc.bold('Provider:')} ${provider}`);
  console.log(`  ${pc.bold('Source:')}   ${source}`);
  console.log(`  ${pc.bold('Key:')}      ${pc.dim(masked)}\n`);
}
