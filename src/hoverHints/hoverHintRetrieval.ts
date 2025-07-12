import { attachIdsToTokens, CodeBlock } from '../htmlProcessing';
import { invokeHoverHintRetrievalServiceWorker } from '../serviceWorkers/';
import { HoverHintList } from './types';

export const retrieveAnnotations = async (code: CodeBlock): Promise<HoverHintList> => {
  attachIdsToTokens(code);

  const time = performance.now();
  console.log('Retrieving annotations for code block:', code.codeBlockId);

  const hoverHintList = await invokeHoverHintRetrievalServiceWorker(code);

  const timeTaken = (performance.now() - time) / 1000;
  console.log('Time taken to retrieve annotations:', timeTaken, 'seconds');

  return hoverHintList;
};
