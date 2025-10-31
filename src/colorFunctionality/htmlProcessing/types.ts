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

export type CodeBlockId = string;
export type CodeTokenId = string;

export type CodeSelectors = keyof typeof CODE_SELECTORS;

export const CODE_BLOCK_ALREADY_PROCESSED = 'Code Block Already Processed';
export type CodeBlockAlreadyProcessed = typeof CODE_BLOCK_ALREADY_PROCESSED;

export type CodeBlockStabilityTimer = number | CodeBlockAlreadyProcessed;

export type CodeBlockTrackingTable = Map<CodeBlockId, CodeBlockStabilityTimer>;

export interface IdMappings {
  codeTokenElementMap: Map<CodeTokenId, HTMLElement>;
  parentCodeBlockMap: Map<CodeTokenId, CodeBlock>;
}

export interface CodeBlockTrackingState {
  mutatedCodeBlocksLookupTable: CodeBlockTrackingTable;
  codeBlocksInViewLookupTable: CodeBlockTrackingTable;
}
