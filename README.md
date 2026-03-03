<div align="center">

```
          ██╗  ██╗██╗██╗   ██╗██╗   ██╗██╗   ██╗
          ╚██╗██╔╝██║██║   ██║██║   ██║╚██╗ ██╔╝
           ╚███╔╝ ██║██║   ██║██║   ██║ ╚████╔╝
           ██╔██╗ ██║╚██╗ ██╔╝╚██╗ ██╔╝  ╚██╔╝
          ██╔╝ ██╗██║ ╚████╔╝  ╚████╔╝    ██║
          ╚═╝  ╚═╝╚═╝  ╚═══╝    ╚═══╝     ╚═╝
```

**Your daily arXiv research briefing in the terminal.**

[![Node.js](https://img.shields.io/badge/node-%3E%3D20-brightgreen?style=flat-square&logo=node.js)](https://nodejs.org)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue?style=flat-square)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?style=flat-square&logo=typescript)](https://typescriptlang.org)
[![4 deps](https://img.shields.io/badge/dependencies-4-orange?style=flat-square)]()

<br/>

[Quick Start](#-quick-start) · [Commands](#-commands) · [Session Mode](#-session-mode) · [Setup](#-setup) · [Categories](#-categories)

</div>

---

<br/>

## What is xivvy?

xivvy fetches trending papers from **arXiv**, **HuggingFace**, and **Semantic Scholar**, summarizes them in plain English using AI, and drops you into an **interactive research session** where you can ask questions about the papers.

```
$ xivvy brief

  ┌─────────────────────────────────────────────────────────────────────
  │  ML / AI / Agents · last 1d · via HuggingFace
  │  5 papers with traction
  └─────────────────────────────────────────────────────────────────────

  [1] ▲ 68 · dLLM: Simple Diffusion Language Modeling
      2026-02-26 · https://arxiv.org/abs/2602.22661
      An open-source framework that standardizes diffusion language modeling,
      making it easy to reproduce and customize alternatives to autoregressive
      text generation.

  [2] ▲ 42 · Enhancing Spatial Understanding in Image Generation
      2026-02-27 · https://arxiv.org/abs/2602.24233
      A new reward model improves how image generators handle spatial
      relationships, so "a cat on top of a box" actually looks right.

  [3] ▲ 34 · CUDA Agent: Agentic RL for Kernel Generation
      2026-02-27 · https://arxiv.org/abs/2602.24286
      Uses reinforcement learning to automatically write high-performance
      GPU code, outperforming hand-tuned kernels and top proprietary models.

  Session started. Ask questions about these papers, or type help.

  xivvy > which paper would be most relevant for speeding up inference?
```

<br/>

## ⚡ Quick Start

```bash
git clone https://github.com/roshanamurthur/xivvy.git
cd xivvy && npm install && npm run build && npm link
```

Set up an API key for AI summaries (works without one too — you'll just see raw abstracts):

```bash
# Option A: use the built-in command
xivvy auth set-key

# Option B: env var
export ANTHROPIC_API_KEY=sk-ant-...   # Claude
export OPENAI_API_KEY=sk-...          # or GPT
```

Then just run:

```bash
xivvy brief
```

<br/>

## 📖 Commands

### `brief` — your daily research briefing

The main command. No args = today's top ML/AI/Agents papers, ranked by community upvotes, with plain-English AI summaries.

```bash
xivvy brief                              # today's top papers
xivvy brief "attention" 7d               # specific topic, last 7 days
xivvy brief "diffusion models" 3d arxiv  # arXiv source, last 3 days
xivvy brief "RL" 2w scholar              # Semantic Scholar, 2 weeks
```

| Argument | Description | Default |
|----------|-------------|---------|
| `topic` | Freeform search text | ML / AI / Agents |
| `duration` | `1d`, `3d`, `7d`, `2w`, `1m` | `1d` |
| `source` | `hf`, `arxiv`, `scholar` | `hf` |

> **Sources:** `hf` pulls from HuggingFace daily papers (has community upvotes). `arxiv` queries the arXiv API directly with date filtering. `scholar` uses Semantic Scholar citation data.

---

### `search` — query arXiv directly

```bash
xivvy search "transformer attention"
xivvy search --cat cs.AI --limit 20
xivvy search "neural nets" --cat cs.LG --sort relevance
```

---

### `latest` — newest papers in a category

```bash
xivvy latest cs.AI
xivvy latest cs.CL --limit 5
```

---

### `auth` — manage API keys

```bash
xivvy auth set-key          # save a key (auto-detects Anthropic vs OpenAI)
xivvy auth status            # check current provider and key
xivvy auth remove anthropic  # remove a provider's key
xivvy auth remove openai
```

---

### `help` — full command reference

```bash
xivvy help
```

<br/>

## 💬 Session Mode

Every command drops you into an **interactive research session** after displaying results. Think of it as a conversation with a research assistant who has read all the papers.

```
  xivvy > compare papers 1 and 3 — which has stronger empirical results?

  Paper [1] provides extensive benchmarks across 4 datasets with ablation
  studies, while Paper [3] focuses on a single large-scale experiment...

  xivvy > give me the key equation from paper 2

  xivvy > which of these could I apply to my recommendation system?
```

### Session commands

| Command | What it does |
|---------|-------------|
| `full 3` | Full abstract for paper #3 |
| `bullets 3` | AI bullet-point breakdown |
| `open 3` | Open paper in browser |
| `pdf 3` | Open PDF directly |
| `search "new query"` | Start a new search |
| `list` | Re-display papers |
| `exit` | Quit |

Anything else you type is a natural language question. The session remembers your conversation, so follow-ups work.

<br/>

## 🔧 Setup

### API Keys

xivvy supports **Anthropic (Claude)** and **OpenAI (GPT)**. You need at least one for AI features.

| Method | Command |
|--------|---------|
| Built-in prompt | `xivvy auth set-key` |
| Anthropic env var | `export ANTHROPIC_API_KEY=sk-ant-...` |
| OpenAI env var | `export OPENAI_API_KEY=sk-...` |
| Config file | `~/.config/xivvy/config.json` |

**Priority:** env var > config file. Anthropic is checked before OpenAI.

**Without a key**, xivvy still works — it fetches papers and shows HuggingFace's pre-computed summaries or raw abstracts.

### Custom themes

Add your own themes to `~/.config/xivvy/config.json`:

```json
{
  "anthropicKey": "sk-ant-...",
  "themes": [
    {
      "name": "Quantum ML",
      "keywords": ["quantum", "variational circuit", "quantum advantage"],
      "categories": ["quant-ph"]
    }
  ]
}
```

<br/>

## 📂 Categories

<details>
<summary><strong>Common arXiv categories</strong> (click to expand)</summary>

<br/>

| Category | Field |
|----------|-------|
| `cs.AI` | Artificial Intelligence |
| `cs.CL` | Computation and Language (NLP) |
| `cs.CV` | Computer Vision |
| `cs.LG` | Machine Learning |
| `cs.RO` | Robotics |
| `cs.SE` | Software Engineering |
| `cs.CR` | Cryptography and Security |
| `cs.DC` | Distributed Computing |
| `stat.ML` | Machine Learning (Statistics) |
| `math.CO` | Combinatorics |
| `math.OC` | Optimization and Control |
| `physics.optics` | Optics |
| `q-bio.NC` | Neurons and Cognition |
| `econ.EM` | Econometrics |

Full list → [arxiv.org/category_taxonomy](https://arxiv.org/category_taxonomy)

</details>

<br/>

## 🏗️ Architecture

```
4 runtime deps · ESM · Node 20+ · single-file bundle via tsup
```

```
src/
  cli.ts                 ← entry point, all commands registered
  commands/
    brief.ts             ← xivvy brief (trending papers + AI briefing)
    search.ts            ← xivvy search (arXiv query)
    session.ts           ← interactive REPL with AI Q&A
    auth.ts              ← API key management
    help.ts              ← full command reference
  lib/
    arxiv.ts             ← arXiv Atom API client
    huggingface.ts       ← HuggingFace daily papers API
    scholar.ts           ← Semantic Scholar API
    summarizer.ts        ← AI summarization (Anthropic + OpenAI)
    display.ts           ← terminal card layout
    config.ts            ← ~/.config/xivvy/ read/write
    themes.ts            ← default + custom theme definitions
    picker.ts            ← zero-dep interactive arrow-key selector
    spinner.ts           ← zero-dep terminal spinner
```

| Dependency | Size | Purpose |
|-----------|------|---------|
| `commander` | 180KB | CLI framework |
| `picocolors` | 6KB | Terminal colors |
| `fast-xml-parser` | 53KB | Parse arXiv Atom feeds |
| `@anthropic-ai/sdk` | — | Claude API (OpenAI via raw fetch) |

<br/>

## License

MIT

<div align="center">
<br/>
<sub>Built with curiosity and Claude.</sub>
</div>
