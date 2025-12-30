import * as z from 'zod';
import { CodeBlockId, CodeTokenId } from '../htmlProcessing';

const returnDocStringSchema = z.object({
  documentation: z
    .string()
    .describe(`Description of what is returned, including type, edge cases, and when null/undefined may occur.`),
});

export type ReturnDocString = z.infer<typeof returnDocStringSchema>;

const paramDocStringSchema = z.object({
  name: z.string().describe(`Exact parameter name as it appears in the signature.`),
  documentation: z
    .string()
    .describe(
      `Brief explanation of the parameter's purpose and constraints. Include: valid ranges, whether null/undefined is allowed, if the parameter is mutated, or special values.`,
    ),
});

export type ParamDocString = z.infer<typeof paramDocStringSchema>;

const propertyDocStringSchema = z.object({
  name: z.string().describe(`Exact property name.`),
  documentation: z.string().describe(`Brief explanation of the property's purpose, type, or valid values.`),
});

export type PropertyDocString = z.infer<typeof propertyDocStringSchema>;

const signatureStylesSchema = z.record(z.string());

export type SignatureStyles = z.infer<typeof signatureStylesSchema>;

export const hoverHintDocumentation = z.object({
  signature: z
    .string()
    .optional()
    .describe(
      `The signature header for this code element.
For callables: \`name(param: Type): ReturnType\`
For classes/interfaces/types/structs: \`class ClassName\`, \`interface IName\`, \`type TypeName\`, \`struct StructName\`
Omit for simple variables or constants.`,
    ),

  properties: z
    .array(propertyDocStringSchema)
    .optional()
    .describe(
      `Document properties/fields for config objects, complex data structures, and API response shapes. Include each property's purpose, type, and valid values.`,
    ),

  params: z
    .array(paramDocStringSchema)
    .optional()
    .describe(
      `REQUIRED for callables with parameters. Include ALL parameters with their purpose, constraints, valid ranges, or behavior.`,
    ),

  returns: returnDocStringSchema
    .optional()
    .describe(`REQUIRED for callables that return a value. Describe what is returned and any edge cases.`),

  documentation: z
    .string()
    .describe(`1-3 sentence explanation of what this code does, side effects, usage notes, or gotchas.`),

  signatureStyles: signatureStylesSchema.optional().describe(`
Map signature tokens to token IDs from the HTML for syntax highlighting.
Styles/classes are stripped from the HTML - identify semantic roles from code structure and position.
Find tokens with matching semantic roles (function names, types, parameters) and use their IDs.

Example - for signature \`greetUser(name: string): string\`:
{
  "greetUser": "t1",  // t1 is a function name token
  "name": "t3",       // t3 is a parameter token
  "string": "t5"      // t5 is a type token
}

Skip punctuation (parentheses, colons). Be consistent - highlight all types if highlighting any.
`),
});

export type HoverHintDocumentation = z.infer<typeof hoverHintDocumentation>;

export const hoverHintSchema = z.object({
  ids: z
    .array(z.string())
    .describe(
      `ALL token IDs where this identifier appears - include the definition AND every usage/call site. Scan the entire HTML for all occurrences.`,
    ),
  documentation: hoverHintDocumentation.describe(
    `Complete documentation for this code element. Include signature, params, returns, and documentation fields.`,
  ),
});

export const hoverHintListSchema = z.object({
  hoverHintList: z.array(hoverHintSchema).describe(
    `List of hover hints for tokens that would benefit from documentation.
Prioritize: library/API calls, complex logic, non-obvious variable purposes, configuration options.
Skip: obvious operations, simple literals, standard language constructs.`,
  ),
  remainingTokenCount: z
    .number()
    .describe(
      `Count of unique identifiers (functions, variables, imports, constants) that still need hover hints after this batch. Scan the HTML and count what's left. Output 0 only when every documentable identifier has a hover hint.`,
    ),
});

export type HoverHint = z.infer<typeof hoverHintSchema>;

export type HoverHintList = z.infer<typeof hoverHintListSchema>;

export const NO_TIMEOUT_ACTIVE = 'Not Timeout Active';
export type NoTimeoutActive = typeof NO_TIMEOUT_ACTIVE;

export type TimeoutId = number | NoTimeoutActive;

export interface HoverHintState {
  hoverHintMap: Map<CodeTokenId, string>;
  tooltip: HTMLElement;
  timeoutId: TimeoutId;
  currentCodeBlockId: CodeBlockId | undefined;
  lastStyleComputedAt: number;
  tallyElements: Map<CodeBlockId, HTMLElement>;
}
