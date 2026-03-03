# xivvy

Lightweight CLI for browsing and querying arXiv papers with AI summaries and interactive research sessions.

## Architecture

- **4 runtime deps**: commander, picocolors, fast-xml-parser, @anthropic-ai/sdk
- **ESM-only**, targets Node 20+
- Built with tsup (esbuild), single bundled output at `dist/cli.js`

## Project Structure

```
src/
  cli.ts              # Entry point — Commander setup, all subcommands registered here
  commands/
    search.ts         # xivvy search — arXiv keyword/category search
    brief.ts          # xivvy brief — trending papers by theme (HuggingFace / Semantic Scholar)
    session.ts        # Interactive REPL session for querying loaded papers
    auth.ts           # xivvy auth set-key / status
  lib/
    arxiv.ts          # ArXiv API client (Atom XML → Paper objects)
    huggingface.ts    # HuggingFace daily papers API (trending, upvotes)
    scholar.ts        # Semantic Scholar API (citation-ranked)
    summarizer.ts     # Claude API integration (summaries, bullets, Q&A)
    display.ts        # Terminal card layout formatting
    config.ts         # ~/.config/xivvy/config.json read/write
    themes.ts         # Default + custom theme definitions
    picker.ts         # Zero-dep interactive arrow-key selector
    spinner.ts        # Zero-dep terminal spinner
  types/
    index.ts          # Paper, SearchOptions, SessionContext types
```

## Key Patterns

- **Data sources**: ArXiv API (search/latest), HuggingFace daily papers (brief/trending), Semantic Scholar (citation-based)
- **Config precedence**: env var ANTHROPIC_API_KEY > ~/.config/xivvy/config.json
- **Session mode**: After displaying papers, drops into readline REPL with Claude Q&A context
- **Pipe-friendly**: Structured output to stdout, human messages to stderr. `--no-session` flag for scripting.

## Build & Run

```bash
npm run build    # tsup → dist/cli.js
npm link         # global xivvy command
xivvy --help
```

## Commands

- `xivvy search [query]` — search arXiv by keyword/category
- `xivvy latest <category>` — latest papers in a category
- `xivvy brief` — interactive theme picker → trending papers with traction metrics
- `xivvy auth set-key` — save Anthropic API key
- `xivvy auth status` — check key config
- `xivvy` (no args) — interactive guided search
