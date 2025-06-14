export interface CodeBlockSelector {
  selector: string;
}

export interface CodeBlockConfig {
  selectors: CodeBlockSelector[];
}

export interface CodeBlock {
  html: HTMLElement;
}

export const CODE_SELECTORS = {
  CHATGPT_MARKDOWN: {
    selector: 'code[class*="language-"]',
  },
  CHATGPT_CANVAS: {
    selector: 'div.cm-content[data-language]',
  },
} as const satisfies Record<string, CodeBlockSelector>;

export type CodeSelectors = keyof typeof CODE_SELECTORS;

export const CODE_BLOCK_ALREADY_PROCESSED = 'Code Block Already Processed';
export type CodeBlockAlreadyProcessed = typeof CODE_BLOCK_ALREADY_PROCESSED;

export type CodeBlockStablityTimer = number | CodeBlockAlreadyProcessed;

export interface CodeBlockTrackingState {
  codeBlockLookupTable: Map<string, CodeBlockStablityTimer>;
}
