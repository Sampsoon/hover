export interface CodeBlockSelector {
  selector: string;
}

export interface CodeBlockConfig {
  selectors: CodeBlockSelector[];
}

export interface CodeBlock {
  html: HTMLElement;
  codeBlockId: string;
}

export const CODE_SELECTORS = {
  MARKDOWN: {
    selector: 'code',
  },
} as const satisfies Record<string, CodeBlockSelector>;

export type CodeSelectors = keyof typeof CODE_SELECTORS;

export const CODE_BLOCK_ALREADY_PROCESSED = 'Code Block Already Processed';
export type CodeBlockAlreadyProcessed = typeof CODE_BLOCK_ALREADY_PROCESSED;

export type CodeBlockStabilityTimer = number | CodeBlockAlreadyProcessed;

export interface CodeBlockTrackingState {
  codeBlockLookupTable: Map<string, CodeBlockStabilityTimer>;
}
