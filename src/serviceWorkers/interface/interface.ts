import { HoverHintList } from '../../hoverHints';
import { CodeBlock } from '../../htmlProcessing';
import { HoverHintRetrievalMessage } from '../hoverHintRetrievalServiceWorker';
import { ServiceWorkerMessage, ServiceWorkerMessageType } from './types';

const invokeServiceWorker = async <ReturnType>(message: ServiceWorkerMessage<unknown>): Promise<ReturnType> => {
  try {
    const response = (await chrome.runtime.sendMessage(message)) as ReturnType;
    return response;
  } catch (error) {
    throw new Error(`Service worker invocation failed: ${error instanceof Error ? error.message : String(error)}`);
  }
};

export const invokeHoverHintRetrievalServiceWorker = async (codeBlock: CodeBlock): Promise<HoverHintList> => {
  const message: HoverHintRetrievalMessage = {
    type: ServiceWorkerMessageType.HOVER_HINT_RETRIEVAL,
    payload: {
      codeBlockRawHtml: codeBlock.html.innerHTML,
    },
  };

  const response = await invokeServiceWorker<HoverHintList>(message);
  return response;
};
