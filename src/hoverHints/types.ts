import * as z from 'zod';

export const CODE_TOKEN_ID_NAME = 'codeTokenId';

export const hoverHintSchema = z.object({
  [CODE_TOKEN_ID_NAME]: z.string(),
  docInHtml: z.string(),
});

export const hoverHintListSchema = z.object({
  hoverHintList: z.array(hoverHintSchema),
});

export type HoverHint = z.infer<typeof hoverHintSchema>;

export type HoverHintList = z.infer<typeof hoverHintListSchema>;

export type ElementLookupTable = Map<string, HTMLElement[]>;

export const NO_TIMEOUT_ACTIVE = 'Not Timeout Active';
export type NoTimeoutActive = typeof NO_TIMEOUT_ACTIVE;

export type TimeoutId = number | NoTimeoutActive;

export interface HoverHintState {
  hoverHintMap: Map<string, string>;
  tooltip: HTMLElement;
  timeoutId: TimeoutId;
}
