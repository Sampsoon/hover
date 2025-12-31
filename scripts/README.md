# Scripts

Vibe-coded scripts for development and evaluation. These are **not included in the compiled extension** and probably have bugs.

## Available Scripts

```bash
pnpm scrape      # Scrape code examples from documentation sites
pnpm tokenize    # Tokenize scraped HTML for evaluation
pnpm workbench   # Annotation UI for reviewing/editing expected annotations
pnpm evaluate    # Run prompt evaluation against annotated examples
node generateIcons.mjs  # Generate PNG icons from SVG
```

## Script Details

### `scrape` - Code Example Scraper

Scrapes code blocks from ~70 documentation and tutorial sites to build a test dataset. Uses Playwright to render pages and extract `<code>` blocks with syntax highlighting.

**Sources include:** MDN, Python docs, Rust Book, TypeScript handbook, React docs, Node.js docs, AWS CDK/SDK docs, Real Python, Stack Overflow, and more.

**First-time setup:**

```bash
pnpm exec playwright install chromium
```

**Output:** `test-data/code-examples.json`

### `tokenize` - HTML Tokenizer

Processes scraped HTML and assigns unique token IDs to each code token using the extension's tokenization logic. This prepares the examples for LLM evaluation.

**Input:** `test-data/code-examples.json`
**Output:** `test-data/tokenized-examples.json`

### `workbench` - Annotation UI

Local web server (http://localhost:3459) for reviewing LLM outputs and marking expected annotations.

**Features:**

- View tokenized code with clickable tokens
- See LLM-generated hover hints from eval results
- Accept/reject individual annotations or "Accept All"
- Filter by reviewed status, errors, low F1 scores
- Compare expected vs actual annotations

### `evaluate` - Prompt Evaluator

Runs the hover hint retrieval prompt against all tokenized examples and calculates precision/recall/F1 metrics.

**Usage:**

```bash
OPENAI_API_KEY=your-key pnpm evaluate
OPENAI_API_KEY=your-key pnpm evaluate --models "model1,model2"
```

**Output:** `test-data/eval-report.json`

### `generateIcons.mjs` - Icon Generator

Generates PNG icons at 16x16, 48x48, and 128x128 from the SVG source. Uses resvg-js for SVG rendering and sharp for compositing.

**Note:** Run from project root (uses root dependencies, not scripts dependencies):

```bash
cd .. && node scripts/generateIcons.mjs
```

**Technique:** Renders the bubble layer at 8x supersample then downscales for smooth curves, while rendering the code lines layer at exact size for crisp edges.

**Output:** `public/icons/icon16.png`, `icon48.png`, `icon128.png`

## Evaluation Workflow

1. `pnpm scrape` - Collect code examples from documentation sites
2. `pnpm tokenize` - Process HTML and assign token IDs
3. `pnpm workbench` - Review LLM outputs and mark expected annotations
4. `pnpm evaluate` - Compare LLM outputs against expected annotations

## Environment

Create a `.env` file with:

```
OPENAI_API_KEY=your-openrouter-key
```

## Test Data

- `test-data/code-examples.json` - Raw HTML code blocks from scraping
- `test-data/tokenized-examples.json` - Tokenized HTML with IDs
- `test-data/annotated-examples.json` - Expected annotations per URL
- `test-data/eval-report.json` - Latest evaluation results

## Known Issues

These scripts are vibe-coded and have known issues:

- Scraper may fail on sites with aggressive bot detection
- Workbench UI has various rendering quirks
- Evaluation metrics may not handle edge cases correctly
- Workbench has some issue with viewing diffs
- Error handling is minimal throughout
