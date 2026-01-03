/**
 * Code Examples Scraper
 *
 * AI-generated code (Claude)
 *
 * This script scrapes code blocks from various documentation and tutorial websites
 * to build a test dataset for evaluating LLM prompt performance on hover hints.
 *
 * What it does:
 * - Visits a curated list of URLs from docs sites (MDN, Python, Rust, etc.)
 * - Extracts the first valid <code> block from each page
 * - Saves results to test-data/code-examples.json
 * - Merges with existing data (won't duplicate URLs)
 *
 * Usage:
 *   cd scripts && bun install
 *   bun x playwright install chromium   # First time only
 *   bun run scrape
 *
 * Output: test-data/code-examples.json
 */

import { chromium } from 'playwright';
import { writeFileSync, readFileSync, mkdirSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

interface CodeExample {
  url: string;
  html: string;
}

const URLS = [
  // MDN Web Docs (8)
  'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map',
  'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise',
  'https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch',
  'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules',
  'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/reduce',
  'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/keys',
  'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Spread_syntax',
  'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Arrow_functions',

  // Python docs (6)
  'https://docs.python.org/3/library/asyncio-task.html',
  'https://docs.python.org/3/library/json.html',
  'https://docs.python.org/3/library/collections.html',
  'https://docs.python.org/3/tutorial/classes.html',
  'https://docs.python.org/3/library/functools.html',
  'https://docs.python.org/3/library/itertools.html',

  // Rust Book (6)
  'https://doc.rust-lang.org/book/ch03-05-control-flow.html',
  'https://doc.rust-lang.org/book/ch04-01-what-is-ownership.html',
  'https://doc.rust-lang.org/book/ch10-02-traits.html',
  'https://doc.rust-lang.org/book/ch16-01-threads.html',
  'https://doc.rust-lang.org/book/ch08-01-vectors.html',
  'https://doc.rust-lang.org/book/ch09-02-recoverable-errors-with-result.html',

  // Go docs (4)
  'https://go.dev/doc/effective_go#goroutines',
  'https://go.dev/doc/effective_go#channels',
  'https://go.dev/blog/defer-panic-and-recover',
  'https://go.dev/blog/json',

  // TypeScript handbook (6)
  'https://www.typescriptlang.org/docs/handbook/2/everyday-types.html',
  'https://www.typescriptlang.org/docs/handbook/2/generics.html',
  'https://www.typescriptlang.org/docs/handbook/2/narrowing.html',
  'https://www.typescriptlang.org/docs/handbook/2/classes.html',
  'https://www.typescriptlang.org/docs/handbook/2/types-from-types.html',
  'https://www.typescriptlang.org/docs/handbook/2/mapped-types.html',

  // React docs (6)
  'https://react.dev/reference/react/useState',
  'https://react.dev/reference/react/useEffect',
  'https://react.dev/reference/react/useContext',
  'https://react.dev/learn/passing-props-to-a-component',
  'https://react.dev/reference/react/useMemo',
  'https://react.dev/reference/react/useCallback',

  // Node.js docs (6)
  'https://nodejs.org/api/fs.html',
  'https://nodejs.org/api/http.html',
  'https://nodejs.org/api/path.html',
  'https://nodejs.org/api/events.html',
  'https://nodejs.org/api/stream.html',
  'https://nodejs.org/api/buffer.html',

  // AWS CDK docs (4)
  'https://docs.aws.amazon.com/cdk/v2/guide/hello_world.html',
  'https://docs.aws.amazon.com/cdk/v2/guide/constructs.html',
  'https://docs.aws.amazon.com/cdk/v2/guide/stacks.html',
  'https://docs.aws.amazon.com/cdk/v2/guide/resources.html',

  // AWS SDK docs (4)
  'https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/javascript_s3_code_examples.html',
  'https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/javascript_dynamodb_code_examples.html',
  'https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/javascript_lambda_code_examples.html',
  'https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/javascript_sns_code_examples.html',

  // OpenAI docs (2)
  'https://platform.openai.com/docs/api-reference/chat/create',
  'https://platform.openai.com/docs/guides/embeddings',

  // Anthropic docs (1)
  'https://docs.anthropic.com/en/api/messages',

  // Real Python (6)
  'https://realpython.com/python-lambda/',
  'https://realpython.com/python-json/',
  'https://realpython.com/async-io-python/',
  'https://realpython.com/python-requests/',
  'https://realpython.com/python-type-checking/',
  'https://realpython.com/python-data-classes/',

  // dev.to (2)
  'https://dev.to/lydiahallie/javascript-visualized-promises-async-await-5gke',
  'https://dev.to/lydiahallie/javascript-visualized-event-loop-3dif',

  // freeCodeCamp (3)
  'https://www.freecodecamp.org/news/how-to-fetch-data-from-an-api-using-the-fetch-api-in-javascript/',
  'https://www.freecodecamp.org/news/async-await-in-javascript/',
  'https://www.freecodecamp.org/news/destructuring-in-javascript/',

  // Stack Overflow (3)
  'https://stackoverflow.com/questions/111102/how-do-javascript-closures-work',
  'https://stackoverflow.com/questions/351409/how-to-append-something-to-an-array',
  'https://stackoverflow.com/questions/6274339/how-can-i-shuffle-an-array',

  // GitHub READMEs (1)
  'https://github.com/axios/axios',

  // Esoteric languages (1)
  'https://esolangs.org/wiki/LOLCODE',

  // Non-English docs (2)
  'https://ja.javascript.info/promise-basics',
  'https://cn.vuejs.org/guide/essentials/computed.html',

  // Shell one-liners (1)
  'https://www.commandlinefu.com/commands/browse/sort-by-votes',

  // SQL queries (1)
  'https://mode.com/sql-tutorial/sql-select-statement/',

  // Config files (1)
  'https://kubernetes.io/docs/concepts/workloads/pods/',

  // Additional docs for variety
  'https://svelte.dev/docs/introduction',
  'https://vuejs.org/guide/essentials/reactivity-fundamentals.html',
  'https://angular.io/guide/component-overview',
  'https://docs.deno.com/runtime/fundamentals/typescript/',
  'https://bun.sh/docs/api/http',
  'https://nextjs.org/docs/app/building-your-application/routing',
  'https://docs.astro.build/en/getting-started/',
  'https://tailwindcss.com/docs/installation',
  'https://prisma.io/docs/getting-started/quickstart',
  'https://trpc.io/docs/quickstart',
];

async function scrapeCodeExamples(): Promise<void> {
  const results: CodeExample[] = [];
  const browser = await chromium.launch({ headless: true });

  console.log(`Starting to scrape ${URLS.length} URLs...`);

  for (let i = 0; i < URLS.length; i++) {
    const url = URLS[i];
    console.log(`[${i + 1}/${URLS.length}] Scraping: ${url}`);

    try {
      const context = await browser.newContext({
        userAgent:
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      });
      const page = await context.newPage();

      await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(2000);

      const codeBlock = await page.evaluate(() => {
        const codeElements = document.querySelectorAll('code, pre code');

        for (const code of codeElements) {
          if (code.querySelectorAll('span').length > 1) {
            return code.outerHTML;
          }
        }

        return null;
      });

      if (codeBlock) {
        results.push({ url, html: codeBlock });
        console.log(`  ✓ Found code block (${codeBlock.length} chars)`);
      } else {
        console.log(`  ✗ No valid code block found`);
      }

      await context.close();
    } catch (error) {
      console.log(`  ✗ Error: ${(error as Error).message}`);
    }
  }

  await browser.close();

  const outputDir = join(__dirname, '..', 'test-data');
  mkdirSync(outputDir, { recursive: true });

  const outputPath = join(outputDir, 'code-examples.json');

  let existingData: CodeExample[] = [];
  if (existsSync(outputPath)) {
    try {
      existingData = JSON.parse(readFileSync(outputPath, 'utf-8'));
      console.log(`\nFound ${existingData.length} existing examples`);
    } catch {
      console.log('\nCould not parse existing data, starting fresh');
    }
  }

  const existingUrls = new Set(existingData.map((d) => d.url));
  const newResults = results.filter((r) => !existingUrls.has(r.url));
  const combined = [...existingData, ...newResults];

  writeFileSync(outputPath, JSON.stringify(combined, null, 2));

  console.log(`\nDone! Added ${newResults.length} new examples. Total: ${combined.length}`);
}

scrapeCodeExamples().catch(console.error);
