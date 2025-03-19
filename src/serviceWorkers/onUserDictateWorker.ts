chrome.runtime.onInstalled.addListener(() => {
  console.log('[Service Worker] Installed');
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  console.log('[Service Worker] Received message:', message);

  if (message.action === 'activate') {
    console.log('[Service Worker] Activated');

    sendResponse({ status: 'activated' });
  }

  return true;
});
