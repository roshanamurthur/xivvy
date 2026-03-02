# xivvy

A lightweight CLI for browsing arXiv papers with AI-powered summaries and an interactive research session.

Search by topic or category, get concise AI summaries, then drop into a conversational session to explore the papers further — ask questions, compare approaches, get bullet-point breakdowns.

```
$ xivvy search "transformer attention" --cat cs.AI --limit 5

  ┌─ [1] ─────────────────────────────────────────────────────────────────
  │
  │  Attention Is All You Need
  │  Vaswani, Shazeer, Parmar + 5 more
  │  2017-06-12 · cs.CL
  │
  │  Proposes the Transformer, a model architecture based entirely on
  │  attention mechanisms, achieving state-of-the-art on translation tasks.
  │
  │  https://arxiv.org/abs/1706.03762
  └────────────────────────────────────────────────────────────────────────

  Session started. Ask questions about these papers, or type help.

  xivvy > which of these papers focuses on efficient inference?
```

## Install

```bash
# Clone and build
git clone https://github.com/roshanamurthur/xivvy.git
cd xivvy
npm install
npm run build
npm link
```

Requires Node.js 20+.

## Setup

Set your Anthropic API key for AI summaries and the interactive session:

```bash
export ANTHROPIC_API_KEY=sk-ant-...
```

Without it, xivvy still works — it shows truncated abstracts instead of AI summaries.

## Usage

### Search papers

```bash
# Search by keyword
xivvy search "diffusion models"

# Filter by arXiv category
xivvy search "reinforcement learning" --cat cs.LG

# Control result count and sort order
xivvy search "quantum computing" --limit 20 --sort relevance
```

### Latest papers in a category

```bash
xivvy latest cs.AI
xivvy latest math.CO --limit 5
```

### Interactive mode

Run `xivvy` with no arguments to be guided through a search:

```bash
xivvy
```

### Print-only mode

Skip the interactive session and just print results:

```bash
xivvy search "neural radiance fields" --no-session
```

## Session commands

After results display, you enter an interactive session:

| Command | Description |
|---------|-------------|
| `full <n>` | Show full abstract for paper #n |
| `bullets <n>` | AI bullet-point breakdown of paper #n |
| `open <n>` | Open paper page in browser |
| `pdf <n>` | Open PDF in browser |
| `search <query>` | Run a new search |
| `list` | Re-display current papers |
| `help` | Show all commands |
| `exit` | Quit |

Any other input is treated as a natural language question about the loaded papers. The session maintains conversation history, so follow-up questions work naturally.

## Stack

Four runtime dependencies:

- **commander** — CLI framework
- **picocolors** — terminal colors
- **fast-xml-parser** — parse arXiv Atom feeds
- **@anthropic-ai/sdk** — AI summaries and Q&A

## arXiv categories

Some commonly used categories:

| Category | Field |
|----------|-------|
| `cs.AI` | Artificial Intelligence |
| `cs.CL` | Computation and Language (NLP) |
| `cs.CV` | Computer Vision |
| `cs.LG` | Machine Learning |
| `cs.SE` | Software Engineering |
| `math.CO` | Combinatorics |
| `stat.ML` | Machine Learning (Stats) |
| `physics.optics` | Optics |
| `q-bio.NC` | Neurons and Cognition |

Full list: [arxiv.org/category_taxonomy](https://arxiv.org/category_taxonomy)

## License

MIT
