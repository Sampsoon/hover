import { getAPIKeyConfig, storage } from '../../../storage';
import type { HoverHint } from '@hover/shared';
import { APIProvider, callLLMWithRetry, retrieveHoverHints } from '@hover/shared';
import { trackProviderRequest } from '../../metrics';
import { createHoverHintStreamError, createHoverHintStreamMessage } from '../../stream';
import { cleanHoverHintRetrievalHtml, fetchHoverHintsFromHostedApi } from '.';
import { HoverHintRetrievalMessage } from '../interface';
import { getAuthState } from '../../auth/googleAuth';
import browser from 'webextension-polyfill';

function logLatency(label: string, startTime: number, hintCount?: number): void {
  const latency = (performance.now() - startTime) / 1000;
  const suffix = hintCount !== undefined ? `(${hintCount.toString()} hints)` : '(failed)';
  console.log(`${label} latency: ${latency.toFixed(2)}s ${suffix}`);
}

async function retrieveHoverHintsViaHostedApi(
  cleanedHtml: string,
  onHoverHint: (hoverHint: HoverHint) => void,
  onError: (errorMessage: string) => void,
): Promise<boolean> {
  const startTime = performance.now();
  let hintCount = 0;

  const googleAuth = await getAuthState();
  if (!googleAuth?.googleToken) {
    onError('Not authenticated. Please sign in with Google.');
    return false;
  }

  try {
    await fetchHoverHintsFromHostedApi(
      cleanedHtml,
      googleAuth.googleToken,
      (hint) => {
        hintCount++;
        onHoverHint(hint);
      },
      onError,
    );

    logLatency('Hosted API retrieval', startTime, hintCount);
    return true;
  } catch (error) {
    logLatency('Hosted API retrieval', startTime);
    onError(error instanceof Error ? error.message : 'Failed to retrieve annotations');
    return false;
  }
}

async function retrieveHoverHintsDirectly(
  cleanedHtml: string,
  onHoverHint: (hoverHint: HoverHint) => void,
  onError: (errorMessage: string) => void,
): Promise<boolean> {
  const startTime = performance.now();

  try {
    const config = await getAPIKeyConfig();
    const hints = await retrieveHoverHints(cleanedHtml, callLLMWithRetry, config, onHoverHint);

    logLatency('Direct retrieval', startTime, hints.length);
    return true;
  } catch {
    logLatency('Direct retrieval', startTime);
    onError('Failed to retrieve annotations after retries');
    return false;
  }
}

async function retrieveHoverHintsStream(
  codeBlockRawHtml: string,
  onHoverHint: (hoverHint: HoverHint) => void,
  onError: (errorMessage: string) => void,
): Promise<void> {
  const provider = await storage.apiProvider.get();

  const cleanedHtml = cleanHoverHintRetrievalHtml(codeBlockRawHtml);

  const success =
    provider === APIProvider.HOSTED_API
      ? await retrieveHoverHintsViaHostedApi(cleanedHtml, onHoverHint, onError)
      : await retrieveHoverHintsDirectly(cleanedHtml, onHoverHint, onError);

  if (success) {
    const telemetryEnabled = await storage.telemetryEnabled.get();
    if (telemetryEnabled && provider) {
      void trackProviderRequest(provider, cleanedHtml.length);
    }
  }
}

export function handleHoverHintRetrievalMessages(
  message: HoverHintRetrievalMessage,
  sender: browser.Runtime.MessageSender,
): void {
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
