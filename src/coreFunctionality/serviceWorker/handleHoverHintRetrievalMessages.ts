import { storage } from '../../storage';
import type { HoverHint } from '@hover/shared';
import { callLLM, LlmParams } from '../llm';
import { trackProviderRequest } from '../metrics';
import { createHoverHintStreamError, createHoverHintStreamMessage } from '../stream';
import { retrieveHoverHints } from './hoverHintRetrieval';
import { HoverHintRetrievalMessage } from './interface';
import browser from 'webextension-polyfill';

const MAX_RETRIES = 5;
const RETRY_DELAY = 1000;

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

  try {
    const hints = await retrieveHoverHints(codeBlockRawHtml, callLLMWithRetry, onHoverHint);

    const telemetryEnabled = await storage.telemetryEnabled.get();
    if (telemetryEnabled) {
      const provider = await storage.apiProvider.get();
      void trackProviderRequest(provider, codeBlockRawHtml.length);
    }

    const latency = (performance.now() - startTime) / 1000;
    console.log(`Annotation retrieval latency: ${latency.toFixed(2)}s (${hints.length.toString()} hints)`);
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
