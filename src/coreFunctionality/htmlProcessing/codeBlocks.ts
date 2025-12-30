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
import { CODE_TOKEN_ID_NAME, TALLY_ATTRIBUTE_NAME } from './constants';
import { wrapTokensInSpans, getDomLeaves } from './tokenization';

export { CODE_TOKEN_ID_NAME, PROGRAMMATICALLY_ADDED_ELEMENT_ATTRIBUTE_NAME, TALLY_ATTRIBUTE_NAME } from './constants';

const CODE_BLOCK_ID_ATTRIBUTE_NAME = 'blockId';

function generateRandomId(): string {
  return ((Math.random() * 0x100000000) | 0).toString(36);
}

function generateTokenId(tokenContent: string): string {
  const prefix = tokenContent.replace(/\s/g, '').slice(0, 3).toLowerCase();
  const randomPart = generateRandomId();
  return prefix ? `${prefix}-${randomPart}` : randomPart;
}

export function attachIdsToTokens(code: CodeBlock, idMappings: IdMappings) {
  const { html } = code;
  const { codeTokenElementMap } = idMappings;
  const { parentCodeBlockMap } = idMappings;

  wrapTokensInSpans(document, html);

  const codeTokens = getDomLeaves(html);

  codeTokens.forEach((token) => {
    if (token.dataset[TALLY_ATTRIBUTE_NAME]) {
      return;
    }

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
