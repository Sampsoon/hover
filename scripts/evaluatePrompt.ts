import { readFileSync, existsSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

(global as any).chrome = {
  runtime: { id: 'test-extension-id' },
  storage: {
    local: { get: async () => ({}), set: async () => {} },
    onChanged: { addListener: () => {}, removeListener: () => {} },
  },
};
(global as any).browser = (global as any).chrome;

const { retrieveHoverHints } = await import('../src/coreFunctionality/serviceWorker/hoverHintRetrieval');
import type { CallLLMFn } from '../src/coreFunctionality/serviceWorker/hoverHintRetrieval';
import type { HoverHint } from '../src/coreFunctionality/hoverHints';
const { callLLMWithConfig } = await import('../src/coreFunctionality/llm');
import type { LlmParams } from '../src/coreFunctionality/llm';
import { DEFAULT_MODEL, OPEN_ROUTER_API_URL } from '../src/storage/constants';
import type { APIConfig } from '../src/storage/types';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TOKENIZED_EXAMPLES_PATH = join(__dirname, '..', 'test-data', 'tokenized-examples.json');
const ANNOTATIONS_PATH = join(__dirname, '..', 'test-data', 'annotated-examples.json');
const EVAL_REPORT_PATH = join(__dirname, '..', 'test-data', 'eval-report.json');

const MAX_RETRIES = 5;
const INITIAL_BACKOFF_MS = 1000;

interface TokenizedExample {
  url: string;
  tokenizedHtml: string;
}

interface Annotation {
  url: string;
  expectedAnnotations: ExpectedAnnotation[];
}

interface ExpectedAnnotation {
  ids: string[];
  type: string;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

class ProgressBar {
  private total: number;
  private completed: number = 0;
  private successful: number = 0;
  private failed: number = 0;
  private width: number = 40;

  constructor(total: number) {
    this.total = total;
  }

  update(success: boolean): void {
    this.completed++;
    if (success) {
      this.successful++;
    } else {
      this.failed++;
    }
    this.render();
  }

  private render(): void {
    const percent = this.completed / this.total;
    const filled = Math.round(this.width * percent);
    const empty = this.width - filled;
    const bar = '█'.repeat(filled) + '░'.repeat(empty);
    const status = `[${bar}] ${this.completed}/${this.total} (✓${this.successful} ✗${this.failed})`;
    process.stdout.write(`\r${status}`);
    if (this.completed === this.total) {
      process.stdout.write('\n');
    }
  }
}

function isRetryableError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    const code = (error as NodeJS.ErrnoException).code;
    if (
      message.includes('rate limit') ||
      message.includes('429') ||
      message.includes('too many requests') ||
      message.includes('econnreset') ||
      message.includes('etimedout') ||
      message.includes('enotfound') ||
      message.includes('socket hang up') ||
      code === 'ECONNRESET' ||
      code === 'ETIMEDOUT' ||
      code === 'ENOTFOUND'
    ) {
      return true;
    }
  }
  return false;
}

function createCallLLMWithRetry(config: APIConfig): CallLLMFn {
  return async (input: string, llmParams: LlmParams, onChunk: (chunk: string) => void): Promise<void> => {
    let lastError: unknown;
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        await callLLMWithConfig(input, llmParams, config, onChunk);
        return;
      } catch (error) {
        lastError = error;
        if (isRetryableError(error)) {
          const backoffMs = INITIAL_BACKOFF_MS * Math.pow(2, attempt);
          const errorMsg = error instanceof Error ? error.message : String(error);
          console.log(
            `    Retryable error (${errorMsg}), waiting ${backoffMs}ms before retry ${attempt + 1}/${MAX_RETRIES}...`,
          );
          await sleep(backoffMs);
        } else {
          throw error;
        }
      }
    }
    throw lastError;
  };
}

interface Metrics {
  precision: number;
  recall: number;
  f1: number;
  typeAccuracy: number;
  truePositives: number;
  falsePositives: number;
  falseNegatives: number;
  typeMismatchCount: number;
  expectedCount: number;
  actualCount: number;
}

interface Comparison {
  correctMatches: { id: string; type: string }[];
  typeMismatches: { id: string; expectedType: string; actualType: string }[];
  falsePositives: { id: string; actualType: string }[];
  falseNegatives: { id: string; expectedType: string }[];
}

function buildComparison(expected: ExpectedAnnotation[], actual: HoverHint[]): Comparison {
  const expectedIdToType = new Map<string, string>();
  for (const ann of expected) {
    for (const id of ann.ids) {
      expectedIdToType.set(id, ann.type);
    }
  }

  const actualIdToType = new Map<string, string>();
  for (const hint of actual) {
    for (const id of hint.ids) {
      actualIdToType.set(id, hint.documentation.type);
    }
  }

  const comparison: Comparison = {
    correctMatches: [],
    typeMismatches: [],
    falsePositives: [],
    falseNegatives: [],
  };

  for (const [id, actualType] of actualIdToType) {
    const expectedType = expectedIdToType.get(id);
    if (expectedType) {
      if (expectedType === actualType) {
        comparison.correctMatches.push({ id, type: actualType });
      } else {
        comparison.typeMismatches.push({ id, expectedType, actualType });
      }
    } else {
      comparison.falsePositives.push({ id, actualType });
    }
  }

  for (const [id, expectedType] of expectedIdToType) {
    if (!actualIdToType.has(id)) {
      comparison.falseNegatives.push({ id, expectedType });
    }
  }

  return comparison;
}

function calculateMetrics(expected: ExpectedAnnotation[], actual: HoverHint[], comparison: Comparison): Metrics {
  const expectedIds = new Set(expected.flatMap((ann) => ann.ids));
  const actualIds = new Set(actual.flatMap((hint) => hint.ids));

  const truePositives = comparison.correctMatches.length + comparison.typeMismatches.length;
  const falsePositives = comparison.falsePositives.length;
  const falseNegatives = comparison.falseNegatives.length;
  const typeMismatchCount = comparison.typeMismatches.length;

  let precision: number;
  let recall: number;
  let f1: number;
  let typeAccuracy: number;

  if (expectedIds.size === 0 && actualIds.size === 0) {
    precision = 1;
    recall = 1;
    f1 = 1;
    typeAccuracy = 1;
  } else {
    precision = truePositives / (truePositives + falsePositives) || 0;
    recall = truePositives / (truePositives + falseNegatives) || 0;
    f1 = (2 * (precision * recall)) / (precision + recall) || 0;
    typeAccuracy = truePositives > 0 ? comparison.correctMatches.length / truePositives : 0;
  }

  return {
    precision,
    recall,
    f1,
    typeAccuracy,
    truePositives,
    falsePositives,
    falseNegatives,
    typeMismatchCount,
    expectedCount: expectedIds.size,
    actualCount: actualIds.size,
  };
}

interface ExampleResult {
  url: string;
  tokenizedHtml: string;
  metrics?: Metrics;
  expected?: ExpectedAnnotation[];
  actual?: HoverHint[];
  comparison?: Comparison;
  error?: string;
}

interface EvalReport {
  timestamp: string;
  model: string;
  config: { url: string };
  aggregate: {
    avgPrecision: number;
    avgRecall: number;
    avgF1: number;
    avgTypeAccuracy: number;
    totalExamples: number;
    successfulExamples: number;
  };
  results: ExampleResult[];
}

interface EvalTask {
  index: number;
  example: TokenizedExample;
  expected: ExpectedAnnotation[];
}

async function evaluateExample(task: EvalTask, config: APIConfig, progress: ProgressBar): Promise<ExampleResult> {
  const { example, expected } = task;

  try {
    const callLLM = createCallLLMWithRetry(config);
    const actual = await retrieveHoverHints(example.tokenizedHtml, callLLM);

    const comparison = buildComparison(expected, actual);
    const metrics = calculateMetrics(expected, actual, comparison);

    progress.update(true);

    return {
      url: example.url,
      tokenizedHtml: example.tokenizedHtml,
      metrics,
      expected,
      actual,
      comparison,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    progress.update(false);
    return {
      url: example.url,
      tokenizedHtml: example.tokenizedHtml,
      error: errorMessage,
    };
  }
}

async function main() {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    console.error('Error: OPENAI_API_KEY environment variable is required');
    console.error('Usage: OPENAI_API_KEY=your-key pnpm evaluate');
    process.exit(1);
  }

  const config: APIConfig = {
    key: apiKey,
    url: OPEN_ROUTER_API_URL,
    model: DEFAULT_MODEL,
  };

  if (!existsSync(ANNOTATIONS_PATH)) {
    console.error('Error: No annotated examples found at', ANNOTATIONS_PATH);
    console.error('Run the annotation UI first: pnpm annotate');
    process.exit(1);
  }

  if (!existsSync(TOKENIZED_EXAMPLES_PATH)) {
    console.error('Error: No tokenized examples found at', TOKENIZED_EXAMPLES_PATH);
    console.error('Run the tokenization script first: pnpm tokenize');
    process.exit(1);
  }

  const tokenizedExamples: TokenizedExample[] = JSON.parse(readFileSync(TOKENIZED_EXAMPLES_PATH, 'utf-8'));
  const annotations: Annotation[] = JSON.parse(readFileSync(ANNOTATIONS_PATH, 'utf-8'));

  const annotationsMap: Record<string, ExpectedAnnotation[]> = {};
  annotations.forEach((ann) => {
    annotationsMap[ann.url] = ann.expectedAnnotations || [];
  });

  console.log(`\n${'='.repeat(60)}`);
  console.log('PROMPT EVALUATION');
  console.log('='.repeat(60));
  console.log(`Model: ${config.model}`);
  console.log(`Base URL: ${config.url}`);
  console.log(`Examples: ${tokenizedExamples.length}`);
  console.log('='.repeat(60) + '\n');

  const tasks: EvalTask[] = tokenizedExamples.map((example, index) => ({
    index,
    example,
    expected: annotationsMap[example.url] || [],
  }));

  const progress = new ProgressBar(tasks.length);
  const results = await Promise.all(tasks.map((task) => evaluateExample(task, config, progress)));

  console.log(`\n${'='.repeat(60)}`);
  console.log('AGGREGATE RESULTS');
  console.log('='.repeat(60));

  const successfulResults = results.filter((r) => r.metrics);

  let aggregate = {
    avgPrecision: 0,
    avgRecall: 0,
    avgF1: 0,
    avgTypeAccuracy: 0,
    totalExamples: results.length,
    successfulExamples: successfulResults.length,
  };

  if (successfulResults.length > 0) {
    aggregate.avgPrecision =
      successfulResults.reduce((sum, r) => sum + r.metrics!.precision, 0) / successfulResults.length;
    aggregate.avgRecall = successfulResults.reduce((sum, r) => sum + r.metrics!.recall, 0) / successfulResults.length;
    aggregate.avgF1 = successfulResults.reduce((sum, r) => sum + r.metrics!.f1, 0) / successfulResults.length;
    aggregate.avgTypeAccuracy =
      successfulResults.reduce((sum, r) => sum + r.metrics!.typeAccuracy, 0) / successfulResults.length;

    console.log(`\nAverage Precision: ${(aggregate.avgPrecision * 100).toFixed(1)}%`);
    console.log(`Average Recall:    ${(aggregate.avgRecall * 100).toFixed(1)}%`);
    console.log(`Average F1 Score:  ${(aggregate.avgF1 * 100).toFixed(1)}%`);
    console.log(`Type Accuracy:     ${(aggregate.avgTypeAccuracy * 100).toFixed(1)}%`);
    console.log(`\nSuccessful: ${successfulResults.length}/${results.length}`);
  } else {
    console.log('No successful evaluations');
  }

  const report: EvalReport = {
    timestamp: new Date().toISOString(),
    model: config.model,
    config: { url: config.url },
    aggregate,
    results,
  };

  writeFileSync(EVAL_REPORT_PATH, JSON.stringify(report, null, 2));
  console.log(`\nReport saved to: ${EVAL_REPORT_PATH}`);

  console.log('\n' + '='.repeat(60) + '\n');
}

main().catch(console.error);
