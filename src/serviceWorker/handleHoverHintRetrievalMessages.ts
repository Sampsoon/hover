import { HoverHint, hoverHintListSchema, hoverHintSchema } from '../hoverHints';
import { callLLM, LlmParams } from '../llm';
import { createHoverHintStreamError, createHoverHintStreamMessage, parseListOfObjectsFromStream } from '../stream';
import { cleanHoverHintRetrievalHtml, RETRIEVAL_HOVER_HINTS_PROMPT } from './hoverHintRetrieval';
import { HoverHintRetrievalMessage } from './interface';
import browser from 'webextension-polyfill';

async function retrieveHoverHintsStream(
  codeBlockRawHtml: string,
  onHoverHint: (hoverHint: HoverHint) => void,
  onError: (errorMessage: string) => void,
) {
  const startTime = performance.now();

  const MAX_RETRIES = 5;
  const RETRY_DELAY = 1000;

  const llmParams: LlmParams = {
    prompt: RETRIEVAL_HOVER_HINTS_PROMPT,
    schema: hoverHintListSchema,
  };

  const cleanedHtml = cleanHoverHintRetrievalHtml(codeBlockRawHtml);

  let currentRetryDelay = RETRY_DELAY;

  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      const onParsedElement = parseListOfObjectsFromStream(hoverHintSchema, onHoverHint);

      await callLLM.OPEN_ROUTER('x-ai/grok-code-fast-1', cleanedHtml, llmParams, onParsedElement);

      const latency = (performance.now() - startTime) / 1000;
      console.log(`Annotation retrieval latency: ${latency.toFixed(2)}s`);

      return;
    } catch (error) {
      console.error('Error retrieving annotations', error);
      await new Promise((resolve) => setTimeout(resolve, currentRetryDelay));
      currentRetryDelay *= 2;
    }
  }

  const latency = (performance.now() - startTime) / 1000;
  console.log(`Annotation retrieval latency (failed): ${latency.toFixed(2)}s`);

  onError('Failed to retrieve annotations after 5 retries');
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
