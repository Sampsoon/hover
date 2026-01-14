# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Hover is a Chrome browser extension that adds interactive hover hints to code blocks on web pages. It uses LLMs to analyze code and generate documentation hints that appear when users hover over tokens.

## Monorepo Structure

This is a bun workspace monorepo with three packages:

- **Root (`/`)** - Chrome extension (Vite + React + TypeScript)
- **`shared/`** - Shared code between extension and server (`@hover/shared`)
- **`server/`** - Vercel serverless API endpoints

## Commands

### Extension (root)
```bash
bun run build      # Lint, typecheck, and build extension to dist_chrome/
bun run dev        # Start Vite dev server
bun run lint       # Run ESLint
bun run package    # Build and zip for Chrome Web Store
```

### Shared Package
```bash
cd shared && bun run build    # Compile TypeScript to dist/
```

### Server
```bash
cd server && bun run typecheck    # Type check (no build script - Vercel handles deployment)
cd server && bun run lint         # Lint and typecheck
```

## Architecture

### Data Flow
1. **Content Script** (`processCodeBlocks.ts`) - Injected into web pages, finds code blocks, attaches IDs to tokens
2. **Service Worker** (`serviceWorker.ts`) - Receives messages from content script, orchestrates LLM calls
3. **LLM Invocation** (`@hover/shared`) - `callLLMWithRetry` handles OpenAI-compatible API calls with exponential backoff
4. **Hover Hints** - Streamed back to content script, attached to tokens via ID mapping

### Key Patterns

**LLM calls take explicit config** - Functions in `@hover/shared` like `callLLMWithRetry(input, params, config, onChunk)` take `APIConfig` as a parameter. Browser code fetches config from storage at the top level, then passes it down.

**Streaming JSON parsing** - LLM responses are parsed incrementally via `parseHoverHintBatchFromStream` to show hints as they arrive.

**Batched retrieval** - Large code blocks may require multiple LLM calls; `retrieveHoverHints` handles continuation with `MAX_BATCHES`.

### Extension Entry Points
- `src/coreFunctionality/serviceWorker/serviceWorker.ts` - Background service worker
- `src/coreFunctionality/contentScripts/processCodeBlocks.ts` - Content script injected into pages
- `src/ui/OptionsApp.tsx` - Extension options page

## Import/Export Style

Prefer importing directly from the source module rather than re-exporting through intermediate files. Instead of:
```typescript
// types.ts
import type { Foo } from '@pkg/shared';
export type { Foo };

// consumer.ts
import type { Foo } from './types';
```

Do:
```typescript
// consumer.ts
import type { Foo } from '@pkg/shared';
```

Re-exports may be appropriate when creating a public API boundary, but avoid them for convenience alone.
