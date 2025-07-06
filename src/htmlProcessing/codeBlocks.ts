import {
  CODE_BLOCK_ALREADY_PROCESSED,
  CodeBlock,
  CodeBlockStabilityTimer,
  CodeBlockTrackingState,
  CodeBlockTrackingTable,
} from './types';

const CODE_BLOCK_ID_ATTRIBUTE_NAME = 'blockId';

export const CODE_TOKEN_ID_NAME = 'tokenId';

const getDomLeaves = (element: HTMLElement): HTMLElement[] => {
  return Array.from(element.querySelectorAll(':scope *:not(:has(*))'));
};

const generateTokenHashId = (element: HTMLElement, codeBlockId: string): string => {
  const outerHTML = element.outerHTML;
  let hash = 5381;
  for (let i = 0; i < outerHTML.length; i++) {
    hash = (hash << 5) + hash + outerHTML.charCodeAt(i);
  }
  const id = (hash >>> 0).toString(36);
  return `${codeBlockId}-${id}`;
};

export const attachIdsToTokens = (code: CodeBlock) => {
  const { html, codeBlockId } = code;

  const codeTokens = getDomLeaves(html);

  codeTokens.forEach((token) => {
    if (!token.dataset[CODE_TOKEN_ID_NAME]) {
      const id = generateTokenHashId(token, codeBlockId);
      token.dataset[CODE_TOKEN_ID_NAME] = id;
    }
  });
};

const addIdToCodeBlock = (element: HTMLElement) => {
  const id = ((Math.random() * 0x100000000) | 0).toString(36);
  element.dataset[CODE_BLOCK_ID_ATTRIBUTE_NAME] = id;
  return id;
};

const getIdFromCodeBlock = (element: HTMLElement) => {
  return element.dataset[CODE_BLOCK_ID_ATTRIBUTE_NAME];
};

export const getOrAddIdToCodeBlock = (element: HTMLElement): { id: string; isNewCodeBlock: boolean } => {
  const id = getIdFromCodeBlock(element);
  if (id) {
    return { id, isNewCodeBlock: false };
  }
  return { id: addIdToCodeBlock(element), isNewCodeBlock: true };
};

export const setupCodeBlockTracking = (): CodeBlockTrackingState => {
  return {
    mutatedCodeBlocksLookupTable: new Map<string, CodeBlockStabilityTimer>(),
    codeBlocksInViewLookupTable: new Map<string, CodeBlockStabilityTimer>(),
  };
};

export const clearCodeBlockTimeoutIfExists = (trackingTable: CodeBlockTrackingTable, id: string) => {
  if (!trackingTable.has(id)) {
    return;
  }

  const timeout = trackingTable.get(id);

  if (timeout === CODE_BLOCK_ALREADY_PROCESSED) {
    return;
  }

  clearTimeout(timeout);
};

export const setCodeBlockTimeout = (
  trackingTable: CodeBlockTrackingTable,
  id: string,
  callback: () => void,
  timeout: number,
) => {
  const timeoutId = window.setTimeout(() => {
    callback();
    trackingTable.set(id, CODE_BLOCK_ALREADY_PROCESSED);
  }, timeout);

  trackingTable.set(id, timeoutId);
};

export const isCodeBlockInView = (codeBlock: CodeBlock): boolean => {
  const { html } = codeBlock;
  const rect = html.getBoundingClientRect();
  return rect.top < window.innerHeight && rect.bottom > 0 && rect.left < window.innerWidth && rect.right > 0;
};
