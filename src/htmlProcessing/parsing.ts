import { getOrAddIdToCodeBlock } from './codeBlocks';
import { CODE_SELECTORS, CodeBlock } from './types';

const queryAllSelectorsSelector = Object.values(CODE_SELECTORS)
  .map((selector) => selector.selector)
  .join(', ');

const isMultiLineCodeBlock = (element: Element): boolean => {
  return element.children.length > 0;
};

const isValidCodeBlockElement = (element: Element): boolean => isMultiLineCodeBlock(element);

export const searchForCodeBlockElementIsPartOf = (element: Element): CodeBlock | null => {
  const codeBlockElement = element.closest(queryAllSelectorsSelector) as HTMLElement | undefined;

  if (codeBlockElement) {
    const { id: codeBlockId } = getOrAddIdToCodeBlock(codeBlockElement);
    return {
      html: codeBlockElement,
      codeBlockId,
    };
  }

  return null;
};

export const findCodeBlockPartOfMutation = (mutation: MutationRecord): CodeBlock | null => {
  const target = mutation.target;

  const element = target.nodeType === Node.ELEMENT_NODE ? (target as HTMLElement) : target.parentElement;

  if (!element) {
    return null;
  }

  if (!isValidCodeBlockElement(element)) {
    return null;
  }

  const possibleCodeBlock = searchForCodeBlockElementIsPartOf(element);

  if (!possibleCodeBlock) {
    return null;
  }

  return possibleCodeBlock;
};

export const findCodeBlocksOnPage = (document: Document): CodeBlock[] => {
  const elements = document.querySelectorAll(queryAllSelectorsSelector);

  const codeBlocks: CodeBlock[] = [];
  for (const element of elements) {
    const htmlElement = element as HTMLElement;

    if (!isValidCodeBlockElement(htmlElement)) {
      continue;
    }

    const { id: codeBlockId } = getOrAddIdToCodeBlock(htmlElement);

    codeBlocks.push({
      html: htmlElement,
      codeBlockId,
    });
  }

  return codeBlocks;
};
