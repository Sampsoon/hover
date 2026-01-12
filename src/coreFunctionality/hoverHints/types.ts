import { CodeBlockId, CodeTokenId } from '../htmlProcessing';

export const NO_TIMEOUT_ACTIVE = 'Not Timeout Active';
export type NoTimeoutActive = typeof NO_TIMEOUT_ACTIVE;

export type TimeoutId = number | NoTimeoutActive;

export interface HoverHintState {
  hoverHintMap: Map<CodeTokenId, string>;
  tooltip: HTMLElement;
  timeoutId: TimeoutId;
  currentCodeBlockId: CodeBlockId | undefined;
  lastStyleComputedAt: number;
}
