import { HoverHint, hoverHintListSchema, hoverHintSchema } from '../../hoverHints';
import type { LlmParams } from '../../llm';
import { parseHoverHintBatchFromStream } from '../../stream';
import { buildContinuationInput, cleanHoverHintRetrievalHtml } from './inputPreparation';
import { RETRIEVAL_HOVER_HINTS_PROMPT } from './prompt';

const MAX_BATCHES = 10;

export type CallLLMFn = (input: string, llmParams: LlmParams, onChunk: (chunk: string) => void) => Promise<void>;

export async function retrieveHoverHints(
  codeBlockRawHtml: string,
  callLLM: CallLLMFn,
  onHoverHint?: (hoverHint: HoverHint) => void,
): Promise<HoverHint[]> {
  const llmParams: LlmParams = {
    prompt: RETRIEVAL_HOVER_HINTS_PROMPT,
    schema: hoverHintListSchema,
  };

  const cleanedHtml = cleanHoverHintRetrievalHtml(codeBlockRawHtml);
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

    await callLLM(input, llmParams, onChunk);

    remainingTokenCount = getRemainingTokenCount();

    if (remainingTokenCount > 0) {
      console.log(`Batch ${batchCount.toString()} complete, ${remainingTokenCount.toString()} tokens remaining...`);
    }
  } while (remainingTokenCount > 0 && batchCount < MAX_BATCHES);

  return previousHints;
}
