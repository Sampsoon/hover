import { readFileSync, existsSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import cliProgress from 'cli-progress';

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
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

interface BarState {
  bar: cliProgress.SingleBar;
  success: number;
  fail: number;
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

interface CallLLMWithLatency {
  callLLM: CallLLMFn;
  getLatencyMs: () => number;
}

function createCallLLMWithRetry(): CallLLMWithLatency {
  let totalLatencyMs = 0;

  const callLLM: CallLLMFn = async (
    input: string,
    llmParams: LlmParams,
    config: APIConfig,
    onChunk: (chunk: string) => void,
  ): Promise<void> => {
    let lastError: unknown;
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const start = Date.now();
        await callLLMWithConfig(input, llmParams, config, onChunk);
        totalLatencyMs += Date.now() - start;
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

  return {
    callLLM,
    getLatencyMs: () => totalLatencyMs,
  };
}

interface Metrics {
  precision: number;
  recall: number;
  f1: number;
  truePositives: number;
  falsePositives: number;
  falseNegatives: number;
  expectedCount: number;
  actualCount: number;
  latencyMs: number;
}

interface Comparison {
  correctMatches: string[];
  falsePositives: string[];
  falseNegatives: string[];
}

function buildComparison(expected: ExpectedAnnotation[], actual: HoverHint[]): Comparison {
  const expectedIds = new Set<string>();
  for (const ann of expected) {
    for (const id of ann.ids) {
      expectedIds.add(id);
    }
  }

  const actualIds = new Set<string>();
  for (const hint of actual) {
    for (const id of hint.ids) {
      actualIds.add(id);
    }
  }

  const comparison: Comparison = {
    correctMatches: [],
    falsePositives: [],
    falseNegatives: [],
  };

  for (const id of actualIds) {
    if (expectedIds.has(id)) {
      comparison.correctMatches.push(id);
    } else {
      comparison.falsePositives.push(id);
    }
  }

  for (const id of expectedIds) {
    if (!actualIds.has(id)) {
      comparison.falseNegatives.push(id);
    }
  }

  return comparison;
}

function calculateMetrics(
  expected: ExpectedAnnotation[],
  actual: HoverHint[],
  comparison: Comparison,
  latencyMs: number,
): Metrics {
  const expectedIds = new Set(expected.flatMap((ann) => ann.ids));
  const actualIds = new Set(actual.flatMap((hint) => hint.ids));

  const truePositives = comparison.correctMatches.length;
  const falsePositives = comparison.falsePositives.length;
  const falseNegatives = comparison.falseNegatives.length;

  let precision: number;
  let recall: number;
  let f1: number;

  if (expectedIds.size === 0 && actualIds.size === 0) {
    precision = 1;
    recall = 1;
    f1 = 1;
  } else {
    precision = truePositives / (truePositives + falsePositives) || 0;
    recall = truePositives / (truePositives + falseNegatives) || 0;
    f1 = (2 * (precision * recall)) / (precision + recall) || 0;
  }

  return {
    precision,
    recall,
    f1,
    truePositives,
    falsePositives,
    falseNegatives,
    expectedCount: expectedIds.size,
    actualCount: actualIds.size,
    latencyMs,
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

interface ModelAggregate {
  avgPrecision: number;
  avgRecall: number;
  avgF1: number;
  avgLatencyMs: number;
  p50LatencyMs: number;
  p90LatencyMs: number;
  totalLatencyMs: number;
  totalExamples: number;
  successfulExamples: number;
}

function percentile(sortedValues: number[], p: number): number {
  if (sortedValues.length === 0) {
    return 0;
  }
  const index = Math.ceil((p / 100) * sortedValues.length) - 1;
  return sortedValues[Math.max(0, index)];
}

interface ModelResult {
  aggregate: ModelAggregate;
  results: ExampleResult[];
}

interface EvalReport {
  timestamp: string;
  config: { url: string };
  models: { [modelName: string]: ModelResult };
}

interface EvalTask {
  index: number;
  example: TokenizedExample;
  expected: ExpectedAnnotation[];
}

async function evaluateExample(task: EvalTask, config: APIConfig, barState: BarState): Promise<ExampleResult> {
  const { example, expected } = task;

  try {
    const { callLLM, getLatencyMs } = createCallLLMWithRetry();
    const actual = await retrieveHoverHints(example.tokenizedHtml, callLLM, config);

    const comparison = buildComparison(expected, actual);
    const metrics = calculateMetrics(expected, actual, comparison, getLatencyMs());

    barState.success++;
    barState.bar.increment({ success: barState.success, fail: barState.fail });

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
    barState.fail++;
    barState.bar.increment({ success: barState.success, fail: barState.fail });
    return {
      url: example.url,
      tokenizedHtml: example.tokenizedHtml,
      error: errorMessage,
    };
  }
}

function getShortModelName(modelName: string): string {
  const parts = modelName.split('/');
  const name = parts[parts.length - 1];
  return name.length > 25 ? name.slice(0, 22) + '...' : name.padEnd(25);
}

async function evaluateModel(
  modelName: string,
  tasks: EvalTask[],
  baseConfig: Omit<APIConfig, 'model'>,
  multibar: cliProgress.MultiBar,
): Promise<{ model: string; result: ModelResult }> {
  const config: APIConfig = { ...baseConfig, model: modelName };
  const bar = multibar.create(tasks.length, 0, {
    model: getShortModelName(modelName),
    success: 0,
    fail: 0,
  });
  const barState: BarState = { bar, success: 0, fail: 0 };
  const results = await Promise.all(tasks.map((task) => evaluateExample(task, config, barState)));

  const successfulResults = results.filter((r) => r.metrics);

  let aggregate: ModelAggregate = {
    avgPrecision: 0,
    avgRecall: 0,
    avgF1: 0,
    avgLatencyMs: 0,
    p50LatencyMs: 0,
    p90LatencyMs: 0,
    totalLatencyMs: 0,
    totalExamples: results.length,
    successfulExamples: successfulResults.length,
  };

  if (successfulResults.length > 0) {
    aggregate.avgPrecision =
      successfulResults.reduce((sum, r) => sum + r.metrics!.precision, 0) / successfulResults.length;
    aggregate.avgRecall = successfulResults.reduce((sum, r) => sum + r.metrics!.recall, 0) / successfulResults.length;
    aggregate.avgF1 = successfulResults.reduce((sum, r) => sum + r.metrics!.f1, 0) / successfulResults.length;

    const latencies = successfulResults.map((r) => r.metrics!.latencyMs).sort((a, b) => a - b);
    aggregate.totalLatencyMs = latencies.reduce((sum, l) => sum + l, 0);
    aggregate.avgLatencyMs = aggregate.totalLatencyMs / successfulResults.length;
    aggregate.p50LatencyMs = percentile(latencies, 50);
    aggregate.p90LatencyMs = percentile(latencies, 90);
  }

  return {
    model: modelName,
    result: { aggregate, results },
  };
}

function parseModelsArg(): string[] | null {
  const modelsIndex = process.argv.indexOf('--models');
  if (modelsIndex === -1 || modelsIndex === process.argv.length - 1) {
    return null;
  }
  const modelsArg = process.argv[modelsIndex + 1];
  return modelsArg.split(',').map((m) => m.trim());
}

async function main() {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    console.error('Error: OPENAI_API_KEY environment variable is required');
    console.error('Usage: OPENAI_API_KEY=your-key bun run evaluate');
    console.error('       OPENAI_API_KEY=your-key bun run evaluate --models "model1,model2,model3"');
    process.exit(1);
  }

  const baseConfig = {
    key: apiKey,
    url: OPEN_ROUTER_API_URL,
  };

  const modelsArg = parseModelsArg();
  const models = modelsArg || [DEFAULT_MODEL];

  if (!existsSync(ANNOTATIONS_PATH)) {
    console.error('Error: No annotated examples found at', ANNOTATIONS_PATH);
    console.error('Run the annotation UI first: bun run annotate');
    process.exit(1);
  }

  if (!existsSync(TOKENIZED_EXAMPLES_PATH)) {
    console.error('Error: No tokenized examples found at', TOKENIZED_EXAMPLES_PATH);
    console.error('Run the tokenization script first: bun run tokenize');
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
  console.log(`Models: ${models.join(', ')}`);
  console.log(`Base URL: ${baseConfig.url}`);
  console.log(`Examples: ${tokenizedExamples.length}`);
  console.log('='.repeat(60) + '\n');

  const tasks: EvalTask[] = tokenizedExamples.map((example, index) => ({
    index,
    example,
    expected: annotationsMap[example.url] || [],
  }));

  const multibar = new cliProgress.MultiBar(
    {
      format: '{model} [{bar}] {value}/{total} | ✓{success} ✗{fail}',
      clearOnComplete: false,
      hideCursor: true,
      barCompleteChar: '█',
      barIncompleteChar: '░',
    },
    cliProgress.Presets.shades_classic,
  );

  const originalLog = console.log;
  console.log = () => {};

  const modelResults = await Promise.all(models.map((model) => evaluateModel(model, tasks, baseConfig, multibar)));

  console.log = originalLog;
  multibar.stop();

  console.log(`\n${'='.repeat(60)}`);
  console.log('AGGREGATE RESULTS');
  console.log('='.repeat(60));

  const modelsMap: { [modelName: string]: ModelResult } = {};
  for (const { model, result } of modelResults) {
    modelsMap[model] = result;
    const agg = result.aggregate;
    console.log(`\n${model}:`);
    console.log(`  Precision: ${(agg.avgPrecision * 100).toFixed(1)}%`);
    console.log(`  Recall:    ${(agg.avgRecall * 100).toFixed(1)}%`);
    console.log(`  F1 Score:  ${(agg.avgF1 * 100).toFixed(1)}%`);
    console.log(
      `  Latency:   ${(agg.avgLatencyMs / 1000).toFixed(2)}s avg | p50: ${(agg.p50LatencyMs / 1000).toFixed(2)}s | p90: ${(agg.p90LatencyMs / 1000).toFixed(2)}s | total: ${(agg.totalLatencyMs / 1000).toFixed(1)}s`,
    );
    console.log(`  Success:   ${agg.successfulExamples}/${agg.totalExamples}`);
  }

  const report: EvalReport = {
    timestamp: new Date().toISOString(),
    config: { url: baseConfig.url },
    models: modelsMap,
  };

  writeFileSync(EVAL_REPORT_PATH, JSON.stringify(report, null, 2));
  console.log(`\nReport saved to: ${EVAL_REPORT_PATH}`);

  console.log('\n' + '='.repeat(60));
  console.log('Example multi-model command:');
  console.log(
    '  OPENAI_API_KEY=your-key bun run evaluate --models "x-ai/grok-4.1-fast,openai/gpt-4o,anthropic/claude-sonnet-4"',
  );
  console.log('='.repeat(60) + '\n');
}

main().catch(console.error);
