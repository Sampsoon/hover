import * as z from 'zod';
import { Id } from '../htmlProcessing';

const TOKEN_TYPES = {
  FUNCTION: 'function',
  OBJECT: 'object',
  VARIABLE: 'variable',
} as const;

const returnDocStringSchema = z.object({
  documentation: z.string().describe(`
    The documentation for the return value of the function.
    `),
});

export type ReturnDocString = z.infer<typeof returnDocStringSchema>;

const paramDocStringSchema = z.object({
  name: z.string().describe('The name of the argument'),
  documentation: z.string().describe(`
    The documentation for the argument to the function.
    `),
});

export type ParamDocString = z.infer<typeof paramDocStringSchema>;

const docStringSchema = z.object({
  params: z.array(paramDocStringSchema),
  returns: returnDocStringSchema,
});

export type DocString = z.infer<typeof docStringSchema>;

const functionDocumentationSchema = z.object({
  type: z.literal(TOKEN_TYPES.FUNCTION).describe('Designates the documentation as function documentation'),
  functionSignature: z
    .string()
    .describe('The function signature. This should cover function return type and types for the arguments'),
  docString: docStringSchema.optional().describe(
    `Documentation for the function signature.
      This should also include the return values when the function returns something.
      Never include a subset of the function signature, only the full signature or none.
      All documentation should be short and concise. Only include this if the information is not obvious to the user.
      Please include any nuances of the parameter, such it's inclusive or exclusive, mutated, etc so that nothing is ambiguous.
      Please do not include documentation that is redundant with with other documentation for the function.
      `,
  ),
  documentation: z.string().optional()
    .describe(`An explanations of the nuances of how the function is used and it's expected behavior.
      This should be between 1 and 15 lines.
      It should be a short summary of what you would typically find online.
      It should be concise and to the point.
      Feel free to add examples of how the function is used, but do not become overly verbose.
      Only include this if the information is not obvious to the user.`),
});

export type FunctionDocumentation = z.infer<typeof functionDocumentationSchema>;

const objectDocumentationSchema = z.object({
  type: z.literal(TOKEN_TYPES.OBJECT),
  docInHtml: z.string(),
});

export type ObjectDocumentation = z.infer<typeof objectDocumentationSchema>;

const variableDocumentationSchema = z.object({
  type: z.literal(TOKEN_TYPES.VARIABLE),
  docInHtml: z.string(),
});

export type VariableDocumentation = z.infer<typeof variableDocumentationSchema>;

export const hoverHintDocumentation = z.union([
  functionDocumentationSchema,
  objectDocumentationSchema,
  variableDocumentationSchema,
]);

export const isFunctionDocumentation = (
  documentation: HoverHintDocumentation,
): documentation is FunctionDocumentation => {
  return documentation.type === TOKEN_TYPES.FUNCTION;
};

export const isObjectDocumentation = (documentation: HoverHintDocumentation): documentation is ObjectDocumentation => {
  return documentation.type === TOKEN_TYPES.OBJECT;
};

export const isVariableDocumentation = (
  documentation: HoverHintDocumentation,
): documentation is VariableDocumentation => {
  return documentation.type === TOKEN_TYPES.VARIABLE;
};

export const hoverHintSchema = z.object({
  ids: z.array(z.string()),
  documentation: hoverHintDocumentation,
});

export const hoverHintListSchema = z.object({
  hoverHintList: z.array(hoverHintSchema),
});

export type HoverHintDocumentation = z.infer<typeof hoverHintDocumentation>;
export type HoverHint = z.infer<typeof hoverHintSchema>;

export type HoverHintList = z.infer<typeof hoverHintListSchema>;

export const NO_TIMEOUT_ACTIVE = 'Not Timeout Active';
export type NoTimeoutActive = typeof NO_TIMEOUT_ACTIVE;

export type TimeoutId = number | NoTimeoutActive;

export interface HoverHintState {
  hoverHintMap: Map<Id, string>;
  tooltip: HTMLElement;
  timeoutId: TimeoutId;
}
