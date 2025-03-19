import { detectKeyPress } from '../userActionDetection/userActionDetection';

const cleanupY = detectKeyPress(() => {
  console.log('[Content Script] Y key was pressed!');
  if (chrome.runtime && chrome.runtime.sendMessage) {
    console.log('[Content Script] Sending message to service worker');
    chrome.runtime.sendMessage({ action: 'activate' }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('[Content Script] Error:', chrome.runtime.lastError);
        return;
      }

      if (response && response.status === 'activated') {
        console.log('[Content Script] Service worker confirmed activation');
      }
    });
  }
}, 'y');

console.log('[Content Script] Key listener loaded');

window.addEventListener('unload', () => {
  cleanupY();
});
