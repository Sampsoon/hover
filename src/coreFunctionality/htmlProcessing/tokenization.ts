import { PROGRAMMATICALLY_ADDED_ELEMENT_ATTRIBUTE_NAME } from './constants';

function createProgrammaticallyAddedSpan(doc: Document, content: string): HTMLSpanElement {
  const span = doc.createElement('span');
  span.setAttribute(PROGRAMMATICALLY_ADDED_ELEMENT_ATTRIBUTE_NAME, 'true');
  span.textContent = content;
  return span;
}

const CODE_DELIMITERS = new Set<string>([
  ' ',
  '\t',
  '\n',
  '\r',
  '\v',
  '\f',
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
  '>',
  '<',
  '=',
  '+',
  '*',
  '/',
  '%',
  '&',
  '|',
  '^',
  '~',
  '"',
  "'",
  '`',
  '\\',
]);

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
    } else if (node.nodeType === ELEMENT_NODE) {
      wrapTokensInSpans(doc, node as HTMLElement);
    }
  });
}

export function getDomLeaves(element: HTMLElement): HTMLElement[] {
  return Array.from(element.querySelectorAll(':scope *:not(:has(*))'));
}
