import {
  CODE_BLOCK_ALREADY_PROCESSED,
  CodeBlock,
  CodeBlockStabilityTimer,
  CodeBlockTrackingState,
  CodeBlockTrackingTable,
  Id,
  IdToCodeTokenMap,
} from './types';

const CODE_BLOCK_ID_ATTRIBUTE_NAME = 'blockId';

export const CODE_TOKEN_ID_NAME = 'tokenId';

const CODE_DELIMITERS = new Set<string>([
  // Whitespace
  ' ',
  '\t',
  '\n',
  '\r',
  '\v',
  '\f',
  // Structural punctuation
  '.',
  ',',
  ';',
  ':',
  '(',
  ')',
  '[',
  ']',
  '{',
  '}',
  // Comparison/assignment operators
  '>',
  '<',
  '=',
  // Arithmetic operators
  '+',
  '*',
  '/',
  '%',
  // Bitwise/logical operators
  '&',
  '|',
  '^',
  '~',
  // String delimiters
  '"',
  "'",
  '`',
  // Escape character
  '\\',
]);

const getDomLeaves = (element: HTMLElement): HTMLElement[] => {
  return Array.from(element.querySelectorAll(':scope *:not(:has(*))'));
};

const generateRandomId = (): string => {
  return ((Math.random() * 0x100000000) | 0).toString(36);
};

const breakIntoTokens = (elementContent: string) => {
  const fragment = document.createDocumentFragment();

  if (!elementContent.trim()) {
    fragment.appendChild(document.createTextNode(elementContent));
    return fragment;
  }

  let currentToken = [];
  let isTraversingDelimiters = CODE_DELIMITERS.has(elementContent[0]);

  for (const char of elementContent) {
    const stateChanged = isTraversingDelimiters !== CODE_DELIMITERS.has(char);

    if (stateChanged && isTraversingDelimiters) {
      fragment.appendChild(document.createTextNode(currentToken.join('')));
    } else if (stateChanged && !isTraversingDelimiters) {
      const span = document.createElement('span');
      span.textContent = currentToken.join('');
      fragment.appendChild(span);
    }

    if (stateChanged) {
      isTraversingDelimiters = !isTraversingDelimiters;
      currentToken = [];
    }

    currentToken.push(char);
  }

  if (currentToken.length > 0 && isTraversingDelimiters) {
    fragment.appendChild(document.createTextNode(currentToken.join('')));
  }

  if (currentToken.length > 0 && !isTraversingDelimiters) {
    const span = document.createElement('span');
    span.textContent = currentToken.join('');
    fragment.appendChild(span);
  }

  return fragment;
};

const wrapTokensInSpans = (element: HTMLElement) => {
  const childNodes = Array.from(element.childNodes);

  childNodes.forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE && node.textContent?.trim()) {
      const originalText = node.textContent;
      const tokens = breakIntoTokens(originalText);

      element.replaceChild(tokens, node);
    } else if (node.nodeType === Node.ELEMENT_NODE && node.nodeName !== 'SPAN') {
      wrapTokensInSpans(node as HTMLElement);
    }
  });
};

export const attachIdsToTokens = (code: CodeBlock, idToCodeTokenMap: IdToCodeTokenMap) => {
  const { html } = code;

  wrapTokensInSpans(html);

  const codeTokens = getDomLeaves(html);

  codeTokens.forEach((token) => {
    if (!token.dataset[CODE_TOKEN_ID_NAME]) {
      const id = generateRandomId();
      token.dataset[CODE_TOKEN_ID_NAME] = id;
      idToCodeTokenMap.set(id, token);
    }
  });
};

const addIdToCodeBlock = (element: HTMLElement) => {
  const id = generateRandomId();
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
    mutatedCodeBlocksLookupTable: new Map<Id, CodeBlockStabilityTimer>(),
    codeBlocksInViewLookupTable: new Map<Id, CodeBlockStabilityTimer>(),
  };
};

export const setupIdToCodeTokenMap = (): IdToCodeTokenMap => new Map<Id, HTMLElement>();

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
