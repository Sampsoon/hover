import { HoverHint, hoverHintListSchema, hoverHintSchema } from '../hoverHints';
import { callLLM, LlmParams } from '../llm';
import { createHoverHintStreamError, createHoverHintStreamMessage, parseHoverHintBatchFromStream } from '../stream';
import {
  buildContinuationInput,
  cleanHoverHintRetrievalHtml,
  RETRIEVAL_HOVER_HINTS_PROMPT,
} from './hoverHintRetrieval';
import { HoverHintRetrievalMessage } from './interface';
import browser from 'webextension-polyfill';

const MAX_RETRIES = 5;
const RETRY_DELAY = 1000;
const MAX_BATCHES = 10;

async function callLLMWithRetry(input: string, llmParams: LlmParams, onChunk: (chunk: string) => void): Promise<void> {
  let currentRetryDelay = RETRY_DELAY;

  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      await callLLM(input, llmParams, onChunk);
      return;
    } catch (error) {
      console.error('Error retrieving annotations', error);
      if (i === MAX_RETRIES - 1) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, currentRetryDelay));
      currentRetryDelay *= 2;
    }
  }
}

async function retrieveHoverHintsStream(
  codeBlockRawHtml: string,
  onHoverHint: (hoverHint: HoverHint) => void,
  onError: (errorMessage: string) => void,
) {
  const startTime = performance.now();

  const llmParams: LlmParams = {
    prompt: RETRIEVAL_HOVER_HINTS_PROMPT,
    schema: hoverHintListSchema,
  };

  const cleanedHtml = cleanHoverHintRetrievalHtml(codeBlockRawHtml);
  const previousHints: HoverHint[] = [];
  let remainingTokenCount = 0;
  let batchCount = 0;

  try {
    do {
      batchCount++;

      const input = buildContinuationInput(cleanedHtml, previousHints);
      const { onChunk, getRemainingTokenCount } = parseHoverHintBatchFromStream(hoverHintSchema, (hint) => {
        previousHints.push(hint);
        onHoverHint(hint);
      });

      await callLLMWithRetry(input, llmParams, onChunk);

      remainingTokenCount = getRemainingTokenCount();

      if (remainingTokenCount > 0) {
        console.log(`Batch ${batchCount.toString()} complete, ${remainingTokenCount.toString()} tokens remaining...`);
      }
    } while (remainingTokenCount > 0 && batchCount < MAX_BATCHES);

    const latency = (performance.now() - startTime) / 1000;
    console.log(
      `Annotation retrieval latency: ${latency.toFixed(2)}s (${batchCount.toString()} batch(es), ${previousHints.length.toString()} hints)`,
    );
  } catch {
    const latency = (performance.now() - startTime) / 1000;
    console.log(`Annotation retrieval latency (failed): ${latency.toFixed(2)}s`);
    onError('Failed to retrieve annotations after retries');
  }
}

function handleHoverHintRetrievalMessages(message: HoverHintRetrievalMessage, sender: browser.Runtime.MessageSender) {
  const tabId = sender.tab?.id;

  if (!tabId) {
    console.error('No tab id found in handleHoverHintRetrievalMessages');
    return;
  }

  void retrieveHoverHintsStream(
    message.payload.codeBlockRawHtml,
    (hoverHint) => {
      void browser.tabs.sendMessage(tabId, createHoverHintStreamMessage(hoverHint));
    },
    (errorMessage) => {
      void browser.tabs.sendMessage(tabId, createHoverHintStreamError(errorMessage));
    },
  );
}

export default handleHoverHintRetrievalMessages;
