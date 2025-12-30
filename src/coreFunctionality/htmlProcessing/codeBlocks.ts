import {
  CODE_BLOCK_ALREADY_PROCESSED,
  CodeBlock,
  CodeBlockId,
  CodeBlockStabilityTimer,
  CodeBlockTrackingState,
  CodeBlockTrackingTable,
  CodeTokenId,
  IdMappings,
} from './types';
import { CODE_TOKEN_ID_NAME, PROGRAMMATICALLY_ADDED_ELEMENT_ATTRIBUTE_NAME } from './constants';
import { wrapTokensInSpans, getDomLeaves } from './tokenization';
import { getOrCreateTally, inheritStylesFromParent } from '../hoverHints';

const CODE_BLOCK_ID_ATTRIBUTE_NAME = 'blockId';

function generateRandomId(): string {
  return ((Math.random() * 0x100000000) | 0).toString(36);
}

function generateTokenId(tokenContent: string): string {
  const prefix = tokenContent.replace(/\s/g, '').slice(0, 3).toLowerCase();
  const randomPart = generateRandomId();
  return prefix ? `${prefix}-${randomPart}` : randomPart;
}

const CONTAINER_CLASS_NAME = 'vibey-code-container';

function addElementsToContainer(container: HTMLElement) {
  void getOrCreateTally(container);
}

export function getOrWrapCodeBlockInContainer(codeBlock: HTMLElement): HTMLElement {
  if (codeBlock.parentElement?.classList.contains(CONTAINER_CLASS_NAME)) {
    return codeBlock.parentElement;
  }

  const container = document.createElement('div');
  container.className = CONTAINER_CLASS_NAME;
  container.setAttribute(PROGRAMMATICALLY_ADDED_ELEMENT_ATTRIBUTE_NAME, 'true');

  container.style.display = 'flex';
  container.style.flexDirection = 'column';

  inheritStylesFromParent(container, codeBlock);

  const computedStyle = window.getComputedStyle(codeBlock);
  const marginTop = computedStyle.marginTop;
  if (marginTop && marginTop !== '0px') {
    container.style.marginTop = marginTop;
    codeBlock.style.marginTop = '0';
  }

  codeBlock.parentNode?.insertBefore(container, codeBlock);
  container.appendChild(codeBlock);

  addElementsToContainer(container);

  return container;
}

export function attachIdsToTokens(code: CodeBlock, idMappings: IdMappings) {
  const { html } = code;
  const { codeTokenElementMap } = idMappings;
  const { parentCodeBlockMap } = idMappings;

  wrapTokensInSpans(document, html);

  const codeTokens = getDomLeaves(html);

  codeTokens.forEach((token) => {
    if (!token.dataset[CODE_TOKEN_ID_NAME]) {
      const id = generateTokenId(token.textContent ?? '');

      token.dataset[CODE_TOKEN_ID_NAME] = id;
      codeTokenElementMap.set(id, token);
      parentCodeBlockMap.set(id, code);
    }
  });
}

function addIdToCodeBlock(element: HTMLElement) {
  const id = generateRandomId();
  element.dataset[CODE_BLOCK_ID_ATTRIBUTE_NAME] = id;
  return id;
}

function getIdFromCodeBlock(element: HTMLElement) {
  return element.dataset[CODE_BLOCK_ID_ATTRIBUTE_NAME];
}

export function getOrAddIdToCodeBlock(element: HTMLElement): { id: string; isNewCodeBlock: boolean } {
  const id = getIdFromCodeBlock(element);
  if (id) {
    return { id, isNewCodeBlock: false };
  }
  return { id: addIdToCodeBlock(element), isNewCodeBlock: true };
}

export function setupCodeBlockTracking(): CodeBlockTrackingState {
  return {
    mutatedCodeBlocksLookupTable: new Map<CodeBlockId, CodeBlockStabilityTimer>(),
    codeBlocksInViewLookupTable: new Map<CodeBlockId, CodeBlockStabilityTimer>(),
  };
}

export function setupIdToElementMapping(): IdMappings {
  return {
    codeTokenElementMap: new Map<CodeTokenId, HTMLElement>(),
    parentCodeBlockMap: new Map<CodeTokenId, CodeBlock>(),
  };
}

export function clearCodeBlockTimeoutIfExists(trackingTable: CodeBlockTrackingTable, id: string) {
  if (!trackingTable.has(id)) {
    return;
  }

  const timeout = trackingTable.get(id);

  if (timeout === CODE_BLOCK_ALREADY_PROCESSED) {
    return;
  }

  clearTimeout(timeout);
}

export function setCodeBlockTimeout(
  trackingTable: CodeBlockTrackingTable,
  id: string,
  callback: () => void,
  timeout: number,
) {
  const timeoutId = window.setTimeout(() => {
    callback();
    trackingTable.set(id, CODE_BLOCK_ALREADY_PROCESSED);
  }, timeout);

  trackingTable.set(id, timeoutId);
}

export function isCodeBlockInView(codeBlock: CodeBlock): boolean {
  const { html } = codeBlock;
  const rect = html.getBoundingClientRect();
  return rect.top < window.innerHeight && rect.bottom > 0 && rect.left < window.innerWidth && rect.right > 0;
}
