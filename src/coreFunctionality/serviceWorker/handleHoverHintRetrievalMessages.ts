import { getAPIKeyConfig, storage } from '../../storage';
import type { HoverHint } from '@hover/shared';
import { callLLMWithRetry } from '@hover/shared';
import { trackProviderRequest } from '../metrics';
import { createHoverHintStreamError, createHoverHintStreamMessage } from '../stream';
import { retrieveHoverHints } from './hoverHintRetrieval';
import { HoverHintRetrievalMessage } from './interface';
import browser from 'webextension-polyfill';

async function retrieveHoverHintsStream(
  codeBlockRawHtml: string,
  onHoverHint: (hoverHint: HoverHint) => void,
  onError: (errorMessage: string) => void,
) {
  const startTime = performance.now();

  try {
    const config = await getAPIKeyConfig();
    const hints = await retrieveHoverHints(codeBlockRawHtml, callLLMWithRetry, config, onHoverHint);

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
