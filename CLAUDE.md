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
bun run dev        # Start Vite dev server with HMR
bun run lint       # Run ESLint
bun run package    # Build and zip for Chrome Web Store
```

### Shared Package
```bash
cd shared && bun run build    # Compile TypeScript to dist/
```

### Server
```bash
cd server && bunx vercel dev      # Run server locally (requires `vercel link` first)
cd server && bun run typecheck    # Type check
cd server && bun run lint         # Lint and typecheck
```

## Local Development

### Testing extension changes

1. Build the shared package first if you've modified it:
   ```bash
   cd shared && bun run build
   ```

2. Build the extension:
   ```bash
   bun run build
   ```

3. Load in Chrome: `chrome://extensions` → Enable **Developer Mode** → **Load Unpacked** → Select `dist_chrome/`

4. Optional: Create `.env` at project root to bundle an API key into dev builds:
   ```
   VITE_OPEN_ROUTER_API_KEY=your-key
   ```

### Testing server changes locally

1. Build the shared package:
   ```bash
   cd shared && bun run build
   ```

2. Link the server directory to Vercel (first time only):
   ```bash
   cd server && bunx vercel link
   ```
   Select the existing `hover-coral` project when prompted.

3. Pull environment variables:
   ```bash
   cd server && bunx vercel env pull
   ```

4. Run the server locally:
   ```bash
   cd server && bunx vercel dev
   ```
   This starts the Vercel dev server on `http://localhost:3000`.

5. To test with the extension, temporarily modify `HOSTED_API_URL` in `src/storage/constants.ts` to point to `http://localhost:3000/api/hoverHints`.

The server requires these environment variables:
```
OPENROUTER_API_KEY=...           # For LLM API calls
UPSTASH_REDIS_REST_URL=...       # For rate limiting
UPSTASH_REDIS_REST_TOKEN=...     # For rate limiting
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

**NEVER create files that only re-export from another package.** This is a hard rule. If something is exported from `@hover/shared`, import it directly from there—do not create a local file that re-exports it.

Bad (never do this):
```typescript
// src/foo/parsing.ts - DO NOT CREATE FILES LIKE THIS
export { parseHoverHintBatchFromStream } from '@hover/shared';

// src/bar/consumer.ts
import { parseHoverHintBatchFromStream } from '../foo/parsing';
```

Good:
```typescript
// src/bar/consumer.ts - import directly from the source
import { parseHoverHintBatchFromStream } from '@hover/shared';
```

**When re-exports ARE appropriate:**
- Creating a public API boundary (e.g., `shared/index.ts` aggregating the package's exports)
- Barrel files for a module's own local code (not re-exporting external packages)

## Code Style

**Always use braces for if statements.** Never write one-line if statements.

Bad:
```typescript
if (!allowed) errors.push('input');
```

Good:
```typescript
if (!allowed) {
  errors.push('input');
}
```

**Use whitespace to separate logical chunks.** Group related lines together and separate distinct operations with blank lines.

Bad:
```typescript
const response = await fetch(url);
if (!response.ok) {
  throw new Error('Failed');
}
const data = await response.json();
const processed = transform(data);
return processed;
```

Good:
```typescript
const response = await fetch(url);

if (!response.ok) {
  throw new Error('Failed');
}

const data = await response.json();
const processed = transform(data);

return processed;
```
