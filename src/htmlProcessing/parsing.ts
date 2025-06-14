import { CODE_SELECTORS } from './types';

export const searchForCodeBlockElementIsPartOf = (element: Element): HTMLElement | null => {
  const codeBlockSelector = Object.values(CODE_SELECTORS).find((selector) => element.closest(selector.selector));

  if (codeBlockSelector) {
    return element.closest(codeBlockSelector.selector);
  }

  return null;
};
