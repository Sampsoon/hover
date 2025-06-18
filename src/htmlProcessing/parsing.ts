import { CODE_SELECTORS, CodeBlock } from './types';

export const searchForCodeBlockElementIsPartOf = (element: Element): HTMLElement | null => {
  const codeBlockSelector = Object.values(CODE_SELECTORS).find((selector) => element.closest(selector.selector));

  if (codeBlockSelector) {
    return element.closest(codeBlockSelector.selector);
  }

  return null;
};

export const findCodeBlocksOnPage = (document: Document): CodeBlock[] => {
  const codeBlocks: CodeBlock[] = [];

  Object.values(CODE_SELECTORS).forEach((selector) => {
    const elements = document.querySelectorAll(selector.selector);

    elements.forEach((element) => {
      const htmlElement = element as HTMLElement;

      const codeBlock: CodeBlock = {
        html: htmlElement,
      };

      codeBlocks.push(codeBlock);
    });
  });

  return codeBlocks;
};
