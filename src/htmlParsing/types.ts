export interface CodeBlockSelector {
  selector: string;
}

export interface CodeBlockConfig {
  selectors: CodeBlockSelector[];
}

export interface CodeBlock {
  code: HTMLElement;
}

export const CODE_SELECTORS = {
  CHATGPT_MARKDOWN: {
    selector: 'code[class*="language-"]'
  },
  CHATGPT_CANVAS: {
    selector: 'div.cm-content[data-language]'
  }
} as const satisfies Record<string, CodeBlockSelector>;

export type CodeSelectors = keyof typeof CODE_SELECTORS;
