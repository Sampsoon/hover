import { CodeBlockConfig, CodeBlock, CODE_SELECTORS } from './types';

export const findCodeBlocks = (
  document: Document, 
  config: CodeBlockConfig = { selectors: Object.values(CODE_SELECTORS) }
): CodeBlock[] => {
  const codeBlocks: CodeBlock[] = [];
  
  config.selectors.forEach(selector => {
    const elements = document.querySelectorAll(selector.selector);
    
    elements.forEach(element => {
      const htmlElement = element as HTMLElement;
      
      const codeBlock: CodeBlock = {
        code: htmlElement
      };
      
      codeBlocks.push(codeBlock);
    });
  });
  
  return codeBlocks;
};