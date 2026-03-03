import { Command } from 'commander';
import * as readline from 'node:readline';
import pc from 'picocolors';
import { searchCommand } from './commands/search.js';
import { setKeyCommand, removeKeyCommand, statusCommand } from './commands/auth.js';
import { briefCommand } from './commands/brief.js';
import { helpCommand } from './commands/help.js';

const program = new Command();

program
  .name('xivvy')
  .description('Browse and query arXiv papers with AI summaries')
  .version('0.1.0');

const auth = program
  .command('auth')
  .description('Manage API key');

auth
  .command('set-key')
  .description('Set your Anthropic API key (saved to ~/.config/xivvy/config.json)')
  .action(setKeyCommand);

auth
  .command('remove <provider>')
  .description('Remove a saved API key (anthropic or openai)')
  .action(removeKeyCommand);

auth
  .command('status')
  .description('Check if an API key is configured')
  .action(statusCommand);

program
  .command('help')
  .description('Show full guide with examples')
  .action(helpCommand);

program
  .command('brief [topic] [duration] [source]')
  .description('Trending paper briefing — e.g. xivvy brief "attention" 7d hf')
  .option('--limit <n>', 'Number of papers', '10')
  .option('--no-session', 'Print results and exit')
  .action(briefCommand);

program
  .command('search [query]')
  .description('Search arXiv papers by topic, keyword, or category')
  .option('--cat <category>', 'arXiv category (e.g. cs.AI, math.CO, physics.optics)')
  .option('--limit <n>', 'Number of papers to return', '10')
  .option('--sort <field>', 'Sort by: relevance, lastUpdatedDate, submittedDate', 'submittedDate')
  .option('--no-session', 'Print results and exit (no interactive session)')
  .action(searchCommand);

program
  .command('latest <category>')
  .description('Latest papers in a category (shortcut for search --cat --sort submittedDate)')
  .option('--limit <n>', 'Number of papers', '10')
  .option('--no-session', 'Print results and exit')
  .action(async (category: string, opts: { limit?: string; noSession?: boolean }) => {
    await searchCommand(undefined, { cat: category, limit: opts.limit, sort: 'submittedDate', noSession: opts.noSession });
  });

// If no subcommand given, run interactive mode
program.action(async () => {
  console.log(`
  ${pc.bold(pc.magenta('xivvy'))} — arXiv paper browser + AI research assistant

  ${pc.dim('No arguments provided. Starting interactive mode...')}
`);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const ask = (q: string): Promise<string> =>
    new Promise((resolve) => rl.question(q, (a) => resolve(a.trim())));

  const query = await ask(`  ${pc.bold('Search query')} ${pc.dim('(keywords or topic)')}: `);
  const cat = await ask(`  ${pc.bold('Category')} ${pc.dim('(e.g. cs.AI, leave blank for any)')}: `);
  const limitStr = await ask(`  ${pc.bold('How many papers?')} ${pc.dim('[10]')}: `);

  rl.close();

  const limit = limitStr || '10';
  await searchCommand(query || undefined, {
    cat: cat || undefined,
    limit,
    sort: 'submittedDate',
  });
});

program.parse();
