import * as z from 'zod';

export const CODE_TOKEN_ID_NAME = 'codeTokenId';

const makeKebabCase = (str: string) => str.replace(/([A-Z])/g, '-$1').toLowerCase();
export const CODE_TOKEN_ID_ATTRIBUTE_NAME = `data-${makeKebabCase(CODE_TOKEN_ID_NAME)}`;

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
