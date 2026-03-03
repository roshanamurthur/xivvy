import pc from 'picocolors';

export function helpCommand(): void {
  const c = pc.cyan;
  const d = pc.dim;
  const b = pc.bold;
  const w = pc.white;

  console.log(`
  ${b(pc.magenta('xivvy'))} — arXiv paper browser + AI research assistant

  ${b('COMMANDS')}

    ${b(c('brief'))} ${d('[topic] [duration] [source]')}
      Get a natural-language briefing on trending papers.
      If no topic is given, shows an interactive theme picker.

      ${d('Examples:')}
        ${w('xivvy brief')}                              ${d('interactive theme picker')}
        ${w('xivvy brief "attention" 7d hf')}            ${d('HuggingFace, last 7 days')}
        ${w('xivvy brief "diffusion models" 3d arxiv')}  ${d('arXiv, last 3 days')}
        ${w('xivvy brief "RL" 14d scholar')}             ${d('Semantic Scholar, 2 weeks')}

      ${d('Sources:')} hf ${d('(HuggingFace, default)')}, arxiv, scholar ${d('(Semantic Scholar)')}
      ${d('Duration:')} 1d, 3d, 7d, 2w, 1m ${d('(default: 7d)')}

    ${b(c('search'))} ${d('[query]')}
      Search arXiv papers by keyword or category.

      ${d('Examples:')}
        ${w('xivvy search "transformer attention"')}
        ${w('xivvy search --cat cs.AI --limit 20')}
        ${w('xivvy search "neural nets" --cat cs.LG')}

    ${b(c('latest'))} ${d('<category>')}
      Latest papers in an arXiv category.

      ${d('Examples:')}
        ${w('xivvy latest cs.AI')}
        ${w('xivvy latest cs.CL --limit 5')}

    ${b(c('auth'))} ${d('<command>')}
      ${w('xivvy auth set-key')}     ${d('save your Anthropic API key')}
      ${w('xivvy auth status')}      ${d('check API key configuration')}

    ${b(c('help'))}
      Show this guide.

  ${b('SESSION MODE')}

    After results display, you enter an interactive session.
    Ask questions in natural language, or use commands:

      ${c('full')} ${d('<n>')}        full abstract for paper #n
      ${c('bullets')} ${d('<n>')}     AI bullet-point breakdown
      ${c('open')} ${d('<n>')}        open paper page in browser
      ${c('pdf')} ${d('<n>')}         open PDF in browser
      ${c('search')} ${d('<query>')}  run a new search
      ${c('list')}              re-display current papers
      ${c('help')}              show session commands
      ${c('exit')}              quit

    Anything else is sent to Claude as a question about the papers.
    Conversation history is maintained for follow-ups.

  ${b('SETUP')}

    ${w('xivvy auth set-key')}                    ${d('save key to ~/.config/xivvy/')}
    ${w('export ANTHROPIC_API_KEY=sk-ant-...')}   ${d('or use env var')}

  ${b('CATEGORIES')}

    ${d('cs.AI')}  AI    ${d('cs.CL')}  NLP    ${d('cs.CV')}  Vision    ${d('cs.LG')}  ML
    ${d('cs.RO')}  Robotics    ${d('cs.SE')}  Software    ${d('math.CO')}  Combinatorics
    ${d('stat.ML')}  Stats/ML    ${d('Full list: arxiv.org/category_taxonomy')}
`);
}
