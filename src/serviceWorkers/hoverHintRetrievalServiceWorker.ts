import { hoverHintListSchema, HoverHintList } from '../hoverHints';
import { callLLM } from '../llm';
import { RETRIEVAL_HOVER_HINTS_PROMPT } from './hoverHintRetrieval';
import { isHoverHintRetrievalMessage, ServiceWorkerMessage } from './interface';

const retrieveHoverHints = async (codeBlockRawHtml: string): Promise<HoverHintList> => {
  const MAX_RETRIES = 5;
  const RETRY_DELAY = 1000;

  const prompt = RETRIEVAL_HOVER_HINTS_PROMPT(codeBlockRawHtml);

  let currentRetryDelay = RETRY_DELAY;

  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      const hoverHintList = await callLLM.OPEN_ROUTER_STRUCTURED_OUTPUT(prompt, hoverHintListSchema);
      return hoverHintList;
    } catch (error) {
      console.error('Error retrieving annotations', error);
      await new Promise((resolve) => setTimeout(resolve, currentRetryDelay));
      currentRetryDelay *= 2;
    }
  }

  throw new Error('Failed to retrieve annotations after 5 retries');
};

chrome.runtime.onMessage.addListener((message: ServiceWorkerMessage<unknown>, _sender, sendResponse) => {
  if (!isHoverHintRetrievalMessage(message)) {
    return;
  }

  retrieveHoverHints(message.payload.codeBlockRawHtml)
    .then((hoverHintList) => {
      sendResponse(hoverHintList);
    })
    .catch((error: unknown) => {
      console.error('Error in hover hint retrieval:', error);
      sendResponse({ hoverHintList: [] });
    });

  // Return true to indicate that we will send a response asynchronously
  return true;
});
