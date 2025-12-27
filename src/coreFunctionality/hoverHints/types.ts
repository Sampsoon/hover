import * as z from 'zod';
import { CodeBlockId, CodeTokenId } from '../htmlProcessing';

const returnDocStringSchema = z.object({
  documentation: z
    .string()
    .describe(`Brief description of what is returned and when. Focus on non-obvious return conditions or edge cases.`),
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

const tokenToCssStylingMapSchema = z.record(
  z.object({
    class: z.string().optional(),
    style: z.string().optional(),
  }),
);

export type TokenToCssStylingMap = z.infer<typeof tokenToCssStylingMapSchema>;

export const hoverHintDocumentation = z.object({
  signature: z
    .string()
    .optional()
    .describe(
      `The callable signature with types. Include for: functions, methods, constructors, macros, decorators, annotations.
Format: \`name(param: Type, param2?: Type): ReturnType\`
Omit for simple variables or constants.`,
    ),

  properties: z
    .array(propertyDocStringSchema)
    .optional()
    .describe(
      `Document properties/fields only when their purpose isn't clear from the name.
Include for: config objects, complex data structures, API response shapes.
Skip obvious properties like \`id\`, \`name\`, \`value\` unless they have non-obvious constraints.`,
    ),

  params: z
    .array(paramDocStringSchema)
    .optional()
    .describe(
      `Document parameters only when the name alone doesn't convey usage.
INCLUDE when: parameter has constraints (min/max, allowed values), is mutated, accepts special sentinel values, or has subtle behavior (inclusive vs exclusive bounds).
SKIP when: parameter name is self-explanatory like \`userId\`, \`options\`, \`callback\`.`,
    ),

  returns: returnDocStringSchema.optional().describe(
    `Document return value only when non-obvious.
INCLUDE when: return type varies based on input, can be null/undefined in certain cases, or returns a transformed version of input.
SKIP when: function name implies the return (e.g., \`getUser\` returns a user, \`isValid\` returns boolean).`,
  ),

  documentation: z
    .string()
    .optional()
    .describe(
      `High-level explanation of what this code does and how to use it.
INCLUDE when: the code's purpose isn't obvious from the name, there are important caveats or gotchas, or usage patterns need explanation.
SKIP when: the code is self-documenting (e.g., \`Math.max\`, simple getters/setters).
Keep to 1-5 sentences. Mention: side effects, async behavior, error conditions, or common pitfalls.`,
    ),

  tokenToCssStylingMap: tokenToCssStylingMapSchema.optional().describe(`
CSS styling to apply to tokens in the signature, matching the code block's syntax highlighting theme.

Extract class/style attributes from the HTML input for tokens that appear in your signature.
Only include tokens that are IN the signature - not keywords like \`function\` or \`const\`.

Example - given this HTML:
\`\`\`html
<id=fn1 class="hljs-title function_"/>greetUser</>(<id=p1/>name</>: <id=t1 class="hljs-built_in"/>string</>): <id=t2 class="hljs-built_in"/>string</>
\`\`\`

For signature \`greetUser(name: string): string\`, the map would be:
{
  "greetUser": { "class": "hljs-title function_" },
  "string": { "class": "hljs-built_in" }
}

If a token in your signature doesn't appear in the HTML, infer styling from similar tokens (e.g., other type names, other function names).
Include both class and style attributes when present on a token.
`),
});

export type HoverHintDocumentation = z.infer<typeof hoverHintDocumentation>;

export const hoverHintSchema = z.object({
  ids: z
    .array(z.string())
    .describe(`Token IDs from the HTML that this documentation applies to. Usually 1-3 related tokens.`),
  documentation: hoverHintDocumentation.describe(
    `Documentation for this code element. Only include fields that add value - skip anything obvious from the code itself.`,
  ),
});

export const hoverHintListSchema = z.object({
  hoverHintList: z.array(hoverHintSchema).describe(
    `List of hover hints for tokens that would benefit from documentation.
Prioritize: library/API calls, complex logic, non-obvious variable purposes, configuration options.
Skip: obvious operations, simple literals, standard language constructs.`,
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
}
