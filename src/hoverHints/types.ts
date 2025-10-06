import * as z from 'zod';
import { Id } from '../htmlProcessing';

const TOKEN_TYPES = {
  FUNCTION: 'function',
  OBJECT: 'object',
  VARIABLE: 'variable',
} as const;

const returnDocStringSchema = z.object({
  documentation: z.string().describe(`Documentation for the function return value.`),
});

export type ReturnDocString = z.infer<typeof returnDocStringSchema>;

const paramDocStringSchema = z.object({
  name: z.string().describe(`Argument name.`),
  documentation: z.string().describe(`Documentation for the function argument.`),
});

export type ParamDocString = z.infer<typeof paramDocStringSchema>;

const docStringSchema = z.object({
  params: z.array(paramDocStringSchema),
  returns: returnDocStringSchema,
});

export type DocString = z.infer<typeof docStringSchema>;

const functionDocumentationSchema = z.object({
  type: z.literal(TOKEN_TYPES.FUNCTION).describe(`Marks this as function documentation.`),
  functionSignature: z.string().describe(`Function signature including return type and argument types.`),
  docString: docStringSchema.optional().describe(
    `Documentation for the function signature including return values when the function returns something.
    Never include a subset of the signature, only the full signature or none.
    Be short and concise. Only include if not obvious to the user.
    Include parameter nuances (inclusive/exclusive, mutated, etc.) to avoid ambiguity.
    Do not duplicate other function documentation.
    Constructors are functions, not objects.`,
  ),
  documentation: z
    .string()
    .optional()
    .describe(
      `Explanation of how the function is used and its expected behavior.
    Should be 1-15 lines: a concise summary of what you would find online.
    May include usage examples but avoid verbosity.
    Only include if not obvious to the user.`,
    ),
});

export type FunctionDocumentation = z.infer<typeof functionDocumentationSchema>;

const propertyDocStringSchema = z.object({
  name: z.string().describe(`Property name.`),
  documentation: z.string().describe(`Documentation for the property.`),
});

export type PropertyDocString = z.infer<typeof propertyDocStringSchema>;

const objectDocumentationSchema = z.object({
  type: z.literal(TOKEN_TYPES.OBJECT).describe(
    `Marks this as object documentation.
    An object is anything with fields that has been instantiated or is being declared. This includes classes, structs, objects, etc.
    Constructors count as functions, not objects.`,
  ),
  docInHtml: z.string(),
  properties: z.array(propertyDocStringSchema).optional().describe(`Properties/fields on the object.`),
});

export type ObjectDocumentation = z.infer<typeof objectDocumentationSchema>;

const variableDocumentationSchema = z.object({
  type: z.literal(TOKEN_TYPES.VARIABLE).describe(
    `Marks this as variable documentation.
    Only use for data containers (arrays, sets, maps, variables, properties, etc.) whose use is not obvious to the user.
    When in doubt, do not include variable documentation.
    Never document variables where the name makes the use obvious. Example of what NOT to do: var id = 1 // The id of the object.
    Be consistent. If you generate documentation for a variable, make sure to generate documentation for other variables of similar ambiguity.
    For example, if you generate documentation for one property, generate it for the rest of the properties if they are similar ambiguity.`,
  ),
  docInHtml: z.string(),
});

export type VariableDocumentation = z.infer<typeof variableDocumentationSchema>;

export const hoverHintDocumentation = z.union([
  functionDocumentationSchema,
  objectDocumentationSchema,
  variableDocumentationSchema,
]);

export function isFunctionDocumentation(documentation: HoverHintDocumentation): documentation is FunctionDocumentation {
  return documentation.type === TOKEN_TYPES.FUNCTION;
}

export function isObjectDocumentation(documentation: HoverHintDocumentation): documentation is ObjectDocumentation {
  return documentation.type === TOKEN_TYPES.OBJECT;
}

export function isVariableDocumentation(documentation: HoverHintDocumentation): documentation is VariableDocumentation {
  return documentation.type === TOKEN_TYPES.VARIABLE;
}

export const hoverHintSchema = z.object({
  ids: z.array(z.string()),
  documentation: hoverHintDocumentation.describe(
    `Documentation for the element. ONLY INCLUDE DOCUMENTATION THAT WOULD BE USEFUL TO THE USER IN UNDERSTANDING THE CODE!`,
  ),
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
