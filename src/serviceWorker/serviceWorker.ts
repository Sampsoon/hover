import browser from 'webextension-polyfill';
import { isHoverHintRetrievalMessage, isServiceWorkerMessage } from './interface';
import handleHoverHintRetrievalMessages from './handleHoverHintRetrievalMessages';

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
  }

  console.error('Invalid service worker message', message);
});
