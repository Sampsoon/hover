import { hoverHintListSchema, HoverHintList } from '../hoverHints';
import { callLLM } from '../llm';
import { RETRIEVAL_HOVER_HINTS_PROMPT } from './hoverHintRetrieval';
import { ServiceWorkerMessage, ServiceWorkerMessageType } from './interface';

export interface HoverHintRetrievalPayload {
  codeBlockRawHtml: string;
}

export interface HoverHintRetrievalMessage extends ServiceWorkerMessage<HoverHintRetrievalPayload> {
  type: ServiceWorkerMessageType.HOVER_HINT_RETRIEVAL;
  payload: HoverHintRetrievalPayload;
}

const isHoverHintRetrievalMessage = (message: ServiceWorkerMessage<unknown>): message is HoverHintRetrievalMessage => {
  // TODO: Delete eslint rule once more message types are added
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  return message.type === ServiceWorkerMessageType.HOVER_HINT_RETRIEVAL;
};

const retrieveHoverHints = async (codeBlockRawHtml: string): Promise<HoverHintList> => {
  const MAX_RETRIES = 5;
  const RETRY_DELAY = 1000;

  const prompt = RETRIEVAL_HOVER_HINTS_PROMPT(codeBlockRawHtml);

  let currentRetryDelay = RETRY_DELAY;

  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      const hoverHintList = await callLLM.GPT_4_1_STRUCTURED_OUTPUT(prompt, hoverHintListSchema);
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
