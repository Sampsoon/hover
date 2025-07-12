import { attachIdsToTokens, CodeBlock } from '../htmlProcessing';
import { invokeHoverHintRetrievalServiceWorker } from '../serviceWorkers/';
import { HoverHintList } from './types';

export const retrieveAnnotations = async (code: CodeBlock): Promise<HoverHintList> => {
  attachIdsToTokens(code);

  const hoverHintList = await invokeHoverHintRetrievalServiceWorker(code);

  return hoverHintList;
};
