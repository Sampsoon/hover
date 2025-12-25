import { readFileSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { JSDOM } from 'jsdom';
import OpenAI from 'openai';
import { zodToJsonSchema } from 'zod-to-json-schema';

import { RETRIEVAL_HOVER_HINTS_PROMPT } from '../src/coreFunctionality/serviceWorker/hoverHintRetrieval/prompt';
import { hoverHintListSchema, HoverHintList } from '../src/coreFunctionality/hoverHints/types';
import { tokenizeElement } from '../src/coreFunctionality/htmlProcessing';
import { cleanHoverHintRetrievalHtml } from '../src/coreFunctionality/serviceWorker/hoverHintRetrieval';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CODE_EXAMPLES_PATH = join(__dirname, '..', 'test-data', 'code-examples.json');
const ANNOTATIONS_PATH = join(__dirname, '..', 'test-data', 'annotated-examples.json');

interface CodeExample {
  url: string;
  html: string;
}

interface Annotation {
  url: string;
  expectedAnnotations: ExpectedAnnotation[];
}

interface ExpectedAnnotation {
  ids: string[];
  type: string;
}

function generateDeterministicId(index: number): string {
  return `tok_${index.toString(36)}`;
}

function tokenizeAndCleanHtml(html: string): string {
  const dom = new JSDOM(`<div id="root">${html}</div>`);
  const doc = dom.window.document;
  const root = doc.getElementById('root')!;

  let tokenIndex = 0;
  tokenizeElement(doc, root, {
    generateId: () => {
      const id = generateDeterministicId(tokenIndex);
      tokenIndex++;
      return id;
    },
  });

  return cleanHoverHintRetrievalHtml(root.innerHTML);
}

async function callLLM(cleanedHtml: string, apiKey: string, baseUrl: string, model: string): Promise<HoverHintList> {
  const client = new OpenAI({
    apiKey,
    baseURL: baseUrl,
  });

  const jsonSchema = zodToJsonSchema(hoverHintListSchema);

  const response = await client.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: RETRIEVAL_HOVER_HINTS_PROMPT },
      { role: 'user', content: cleanedHtml },
    ],
    response_format: {
      type: 'json_schema',
      json_schema: {
        strict: true,
        name: 'hover_hints',
        schema: jsonSchema as Record<string, unknown>,
      },
    },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('No response from LLM');
  }

  return JSON.parse(content) as HoverHintList;
}

interface Metrics {
  precision: number;
  recall: number;
  f1: number;
  typeAccuracy: number;
  truePositives: number;
  falsePositives: number;
  falseNegatives: number;
  expectedCount: number;
  actualCount: number;
}

function calculateMetrics(expected: ExpectedAnnotation[], actual: HoverHintList['hoverHintList']): Metrics {
  const expectedIds = new Set(expected.flatMap((ann) => ann.ids));
  const actualIds = new Set(actual.flatMap((hint) => hint.ids));

  let truePositives = 0;
  let falsePositives = 0;
  let falseNegatives = 0;

  for (const id of actualIds) {
    if (expectedIds.has(id)) {
      truePositives++;
    } else {
      falsePositives++;
    }
  }

  for (const id of expectedIds) {
    if (!actualIds.has(id)) {
      falseNegatives++;
    }
  }

  const precision = truePositives / (truePositives + falsePositives) || 0;
  const recall = truePositives / (truePositives + falseNegatives) || 0;
  const f1 = (2 * (precision * recall)) / (precision + recall) || 0;

  let typeMatches = 0;
  let typeTotal = 0;

  for (const hint of actual) {
    for (const id of hint.ids) {
      if (expectedIds.has(id)) {
        typeTotal++;
        const expectedAnn = expected.find((ann) => ann.ids.includes(id));
        if (expectedAnn && expectedAnn.type === hint.documentation.type) {
          typeMatches++;
        }
      }
    }
  }

  const typeAccuracy = typeTotal > 0 ? typeMatches / typeTotal : 0;

  return {
    precision,
    recall,
    f1,
    typeAccuracy,
    truePositives,
    falsePositives,
    falseNegatives,
    expectedCount: expectedIds.size,
    actualCount: actualIds.size,
  };
}

interface EvalResult {
  url: string;
  metrics?: Metrics;
  expected?: ExpectedAnnotation[];
  actual?: HoverHintList['hoverHintList'];
  error?: string;
}

async function main() {
  const apiKey = process.env.OPENAI_API_KEY;
  const baseUrl = process.env.OPENAI_BASE_URL || 'https://openrouter.ai/api/v1';
  const model = process.env.OPENAI_MODEL || 'x-ai/grok-4.1-fast';

  if (!apiKey) {
    console.error('Error: OPENAI_API_KEY environment variable is required');
    console.error('Usage: OPENAI_API_KEY=your-key pnpm evaluate');
    process.exit(1);
  }

  if (!existsSync(ANNOTATIONS_PATH)) {
    console.error('Error: No annotated examples found at', ANNOTATIONS_PATH);
    console.error('Run the annotation UI first: pnpm annotate');
    process.exit(1);
  }

  if (!existsSync(CODE_EXAMPLES_PATH)) {
    console.error('Error: No code examples found at', CODE_EXAMPLES_PATH);
    process.exit(1);
  }

  const codeExamples: CodeExample[] = JSON.parse(readFileSync(CODE_EXAMPLES_PATH, 'utf-8'));
  const annotations: Annotation[] = JSON.parse(readFileSync(ANNOTATIONS_PATH, 'utf-8'));

  const annotationsMap: Record<string, ExpectedAnnotation[]> = {};
  annotations.forEach((ann) => {
    annotationsMap[ann.url] = ann.expectedAnnotations || [];
  });

  const annotatedExamples = codeExamples.filter((ex) => annotationsMap[ex.url] && annotationsMap[ex.url].length > 0);

  if (annotatedExamples.length === 0) {
    console.error('Error: No annotated examples found');
    console.error('Annotate some examples first using the annotation UI');
    process.exit(1);
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log('PROMPT EVALUATION');
  console.log('='.repeat(60));
  console.log(`Model: ${model}`);
  console.log(`Base URL: ${baseUrl}`);
  console.log(`Annotated examples: ${annotatedExamples.length}`);
  console.log('='.repeat(60) + '\n');

  const results: EvalResult[] = [];

  for (let i = 0; i < annotatedExamples.length; i++) {
    const example = annotatedExamples[i];
    const expected = annotationsMap[example.url];

    console.log(`[${i + 1}/${annotatedExamples.length}] Evaluating: ${example.url.slice(0, 60)}...`);

    try {
      const cleanedHtml = tokenizeAndCleanHtml(example.html);
      const response = await callLLM(cleanedHtml, apiKey, baseUrl, model);
      const actual = response.hoverHintList || [];

      const metrics = calculateMetrics(expected, actual);
      results.push({ url: example.url, metrics, expected, actual });

      console.log(
        `  Precision: ${(metrics.precision * 100).toFixed(1)}%, Recall: ${(metrics.recall * 100).toFixed(1)}%, F1: ${(metrics.f1 * 100).toFixed(1)}%`,
      );
      console.log(
        `  Expected: ${metrics.expectedCount}, Actual: ${metrics.actualCount}, TP: ${metrics.truePositives}, FP: ${metrics.falsePositives}, FN: ${metrics.falseNegatives}`,
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.log(`  Error: ${errorMessage}`);
      results.push({ url: example.url, error: errorMessage });
    }
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log('AGGREGATE RESULTS');
  console.log('='.repeat(60));

  const successfulResults = results.filter((r) => r.metrics);

  if (successfulResults.length > 0) {
    const avgPrecision = successfulResults.reduce((sum, r) => sum + r.metrics!.precision, 0) / successfulResults.length;
    const avgRecall = successfulResults.reduce((sum, r) => sum + r.metrics!.recall, 0) / successfulResults.length;
    const avgF1 = successfulResults.reduce((sum, r) => sum + r.metrics!.f1, 0) / successfulResults.length;
    const avgTypeAccuracy =
      successfulResults.reduce((sum, r) => sum + r.metrics!.typeAccuracy, 0) / successfulResults.length;

    console.log(`\nAverage Precision: ${(avgPrecision * 100).toFixed(1)}%`);
    console.log(`Average Recall:    ${(avgRecall * 100).toFixed(1)}%`);
    console.log(`Average F1 Score:  ${(avgF1 * 100).toFixed(1)}%`);
    console.log(`Type Accuracy:     ${(avgTypeAccuracy * 100).toFixed(1)}%`);
    console.log(`\nSuccessful: ${successfulResults.length}/${results.length}`);
  } else {
    console.log('No successful evaluations');
  }

  console.log('\n' + '='.repeat(60) + '\n');
}

main().catch(console.error);
