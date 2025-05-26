import * as z from 'zod';

export const ElementIdName = 'elementId';

export const hoverHintSchema = z.object({
  [ElementIdName]: z.string(),
  docInHtml: z.string(),
});

export const hoverHintListSchema = z.object({
  hoverHintList: z.array(hoverHintSchema)
});

export type HoverHint = z.infer<typeof hoverHintSchema>;

export type HoverHintList = z.infer<typeof hoverHintListSchema>;

export type ElementLookupTable = Map<string, HTMLElement[]>;
