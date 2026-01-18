import type { APIConfig } from './types.js';
import type { HoverHint } from './hoverHintSchema.js';
import { hoverHintListSchema, hoverHintSchema } from './hoverHintSchema.js';
import type { LlmParams } from './llm.js';
import { parseHoverHintBatchFromStream } from './parsing.js';
import { RETRIEVAL_HOVER_HINTS_PROMPT } from './prompt.js';

const MAX_BATCHES = 10;

export type CallLLMFn = (
  input: string,
  llmParams: LlmParams,
  config: APIConfig,
  onChunk: (chunk: string) => void,
) => Promise<void>;

function buildContinuationInput(cleanedHtml: string, previousHints: HoverHint[]): string {
  if (previousHints.length === 0) {
    return cleanedHtml;
  }

  const hintsJson = JSON.stringify(previousHints, null, 2);
  return `Previously generated hover hints (maintain signatureStyles consistency, skip these IDs):
${hintsJson}

${cleanedHtml}`;
}

export async function retrieveHoverHints(
  cleanedHtml: string,
  callLLM: CallLLMFn,
  config: APIConfig,
  onHoverHint?: (hoverHint: HoverHint) => void,
): Promise<HoverHint[]> {
  const llmParams: LlmParams = {
    prompt: RETRIEVAL_HOVER_HINTS_PROMPT,
    schema: hoverHintListSchema,
  };

  const previousHints: HoverHint[] = [];
  let remainingTokenCount = 0;
  let batchCount = 0;

  do {
    batchCount++;

    const input = buildContinuationInput(cleanedHtml, previousHints);
    const { onChunk, getRemainingTokenCount } = parseHoverHintBatchFromStream(hoverHintSchema, (hint) => {
      previousHints.push(hint);
      onHoverHint?.(hint);
    });

    await callLLM(input, llmParams, config, onChunk);

    remainingTokenCount = getRemainingTokenCount();

    if (remainingTokenCount > 0) {
      console.log(`Batch ${batchCount.toString()} complete, ${remainingTokenCount.toString()} tokens remaining...`);
    }
  } while (remainingTokenCount > 0 && batchCount < MAX_BATCHES);

  return previousHints;
}
