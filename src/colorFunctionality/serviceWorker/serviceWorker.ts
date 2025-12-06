import browser from 'webextension-polyfill';
import { isHoverHintRetrievalMessage, isServiceWorkerMessage } from './interface';
import handleHoverHintRetrievalMessages from './handleHoverHintRetrievalMessages';
import { registerProcessCodeBlocksScript } from './processCodeBlocksRegistration';
import { getMatchConfigFromWebsiteFilter } from '../../permissions';
import { storage } from '../../storage';

async function initializeServiceWorker() {
  const config = await storage.websiteFilter.get();
  const matchConfig = getMatchConfigFromWebsiteFilter(config);
  await registerProcessCodeBlocksScript(matchConfig);
}

void initializeServiceWorker();

storage.websiteFilter.onChange((newConfig) => {
  const matchConfig = getMatchConfigFromWebsiteFilter(newConfig);
  void registerProcessCodeBlocksScript(matchConfig);
});

function validateSender(sender: browser.Runtime.MessageSender): boolean {
  if (!sender.tab) {
    return false;
  }

  if (!sender.url) {
    return false;
  }

  return true;
}

browser.runtime.onMessage.addListener((message: unknown, sender: browser.Runtime.MessageSender) => {
  if (!validateSender(sender)) {
    console.error('Invalid sender', sender);
    return;
  }

  if (!isServiceWorkerMessage(message)) {
    console.error('Invalid service worker message', message);
    return;
  }

  if (isHoverHintRetrievalMessage(message)) {
    handleHoverHintRetrievalMessages(message, sender);
    return;
  }

  console.error('No handler for service worker message type', message);
});
