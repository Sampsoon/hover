import { CODE_DELIMITERS, CODE_TOKEN_ID_NAME, PROGRAMMATICALLY_ADDED_ELEMENT_ATTRIBUTE_NAME } from './constants';

export interface TokenizationOptions {
  generateId: () => string;
}

function createProgrammaticallyAddedSpan(doc: Document, content: string): HTMLSpanElement {
  const span = doc.createElement('span');
  span.setAttribute(PROGRAMMATICALLY_ADDED_ELEMENT_ATTRIBUTE_NAME, 'true');
  span.textContent = content;
  return span;
}

function breakIntoTokens(doc: Document, elementContent: string): DocumentFragment {
  const fragment = doc.createDocumentFragment();

  if (!elementContent.trim()) {
    fragment.appendChild(doc.createTextNode(elementContent));
    return fragment;
  }

  let currentToken: string[] = [];
  let isTraversingDelimiters = CODE_DELIMITERS.has(elementContent[0]);

  for (const char of elementContent) {
    const stateChanged = isTraversingDelimiters !== CODE_DELIMITERS.has(char);

    if (stateChanged && isTraversingDelimiters) {
      fragment.appendChild(doc.createTextNode(currentToken.join('')));
    } else if (stateChanged && !isTraversingDelimiters) {
      const newSpan = createProgrammaticallyAddedSpan(doc, currentToken.join(''));
      fragment.appendChild(newSpan);
    }

    if (stateChanged) {
      isTraversingDelimiters = !isTraversingDelimiters;
      currentToken = [];
    }

    currentToken.push(char);
  }

  if (currentToken.length > 0 && isTraversingDelimiters) {
    fragment.appendChild(doc.createTextNode(currentToken.join('')));
  }

  if (currentToken.length > 0 && !isTraversingDelimiters) {
    const newSpan = createProgrammaticallyAddedSpan(doc, currentToken.join(''));
    fragment.appendChild(newSpan);
  }

  return fragment;
}

const TEXT_NODE = 3;
const ELEMENT_NODE = 1;

export function wrapTokensInSpans(doc: Document, element: HTMLElement): void {
  const childNodes = Array.from(element.childNodes);

  childNodes.forEach((node) => {
    if (node.nodeType === TEXT_NODE && node.textContent?.trim()) {
      const originalText = node.textContent;
      const tokens = breakIntoTokens(doc, originalText);

      if (tokens.childNodes.length > 1) {
        node.parentNode?.replaceChild(tokens, node);
      }
    } else if (node.nodeType === ELEMENT_NODE && node.nodeName !== 'SPAN') {
      wrapTokensInSpans(doc, node as HTMLElement);
    }
  });
}

export function getDomLeaves(element: HTMLElement): HTMLElement[] {
  return Array.from(element.querySelectorAll(':scope *:not(:has(*))'));
}

export function tokenizeElement(doc: Document, element: HTMLElement, options: TokenizationOptions): void {
  wrapTokensInSpans(doc, element);

  const leaves = getDomLeaves(element);

  leaves.forEach((leaf) => {
    if (leaf.textContent?.trim() && !leaf.dataset[CODE_TOKEN_ID_NAME]) {
      leaf.dataset[CODE_TOKEN_ID_NAME] = options.generateId();
    }
  });
}
