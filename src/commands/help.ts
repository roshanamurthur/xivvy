import pc from 'picocolors';

export function helpCommand(): void {
  const cmd = (s: string) => pc.bold(pc.green(s));
  const arg = (s: string) => pc.cyan(s);
  const d = pc.dim;
  const w = pc.white;
  const ex = (s: string) => `  ${w(s)}`;

  console.log(`
  ${pc.bold(pc.magenta('xivvy'))} — arXiv paper browser + AI research assistant

  ${pc.bold(pc.underline('COMMANDS'))}

  ${cmd('brief')} ${arg('[topic]')} ${arg('[duration]')} ${arg('[source]')}
    Get a natural-language briefing on trending papers.
    Shows only papers published within the duration, ranked by traction.
    If no topic given, shows an interactive theme picker.

    ${d('Examples:')}
      ${ex('xivvy brief')}                              ${d('interactive theme picker')}
      ${ex('xivvy brief "attention" 7d hf')}            ${d('HuggingFace, last 7 days')}
      ${ex('xivvy brief "diffusion models" 3d arxiv')}  ${d('arXiv, last 3 days')}
      ${ex('xivvy brief "RL" 2w scholar')}              ${d('Semantic Scholar, 2 weeks')}

    ${d('Sources:')} hf ${d('(HuggingFace, default)')}, arxiv, scholar ${d('(Semantic Scholar)')}
    ${d('Duration:')} 1d, 3d, 7d, 2w, 1m ${d('(default: 7d)')}
    ${d('Flags:')}    --limit <n>  --no-session

  ${cmd('search')} ${arg('[query]')}
    Search arXiv papers by keyword or category.

    ${d('Examples:')}
      ${ex('xivvy search "transformer attention"')}
      ${ex('xivvy search --cat cs.AI --limit 20')}
      ${ex('xivvy search "neural nets" --cat cs.LG')}

    ${d('Flags:')} --cat <category>  --limit <n>  --sort <field>  --no-session

  ${cmd('latest')} ${arg('<category>')}
    Latest papers in an arXiv category.

    ${d('Examples:')}
      ${ex('xivvy latest cs.AI')}
      ${ex('xivvy latest cs.CL --limit 5')}

    ${d('Flags:')} --limit <n>  --no-session

  ${cmd('auth')} ${arg('<command>')}
    Manage API keys (Anthropic or OpenAI).

      ${cmd('auth set-key')}     ${d('save an API key (auto-detects provider from prefix)')}
      ${cmd('auth status')}      ${d('show current provider, key source, and masked key')}

  ${cmd('help')}
    Show this guide.

  ${pc.bold(pc.underline('SESSION MODE'))}

    After results display, you enter an interactive session.
    Ask questions in natural language, or use commands:

      ${cmd('full')} ${arg('<n>')}        ${d('full abstract for paper #n')}
      ${cmd('bullets')} ${arg('<n>')}     ${d('AI bullet-point breakdown')}
      ${cmd('open')} ${arg('<n>')}        ${d('open paper page in browser')}
      ${cmd('pdf')} ${arg('<n>')}         ${d('open PDF in browser')}
      ${cmd('search')} ${arg('<query>')}  ${d('run a new search')}
      ${cmd('list')}              ${d('re-display current papers')}
      ${cmd('help')}              ${d('show session commands')}
      ${cmd('exit')}              ${d('quit')}

    Anything else is sent as a question about the loaded papers.
    Conversation history is maintained for follow-ups.

  ${pc.bold(pc.underline('SETUP'))}

    ${w('xivvy auth set-key')}                    ${d('save key (Anthropic or OpenAI)')}
    ${w('export ANTHROPIC_API_KEY=sk-ant-...')}   ${d('or set env var for Claude')}
    ${w('export OPENAI_API_KEY=sk-...')}          ${d('or set env var for GPT')}

    ${d('Priority: env var > config file. Anthropic checked before OpenAI.')}

  ${pc.bold(pc.underline('CATEGORIES'))}

    ${d('cs.AI')}  AI        ${d('cs.CL')}  NLP       ${d('cs.CV')}  Vision     ${d('cs.LG')}  ML
    ${d('cs.RO')}  Robotics  ${d('cs.SE')}  Software  ${d('math.CO')}  Combinatorics
    ${d('stat.ML')}  Stats/ML              ${d('Full list: arxiv.org/category_taxonomy')}
`);
}
