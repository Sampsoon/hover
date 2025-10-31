import * as z from 'zod';
import { CodeBlockId, CodeTokenId } from '../htmlProcessing';

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

const tokenToCssStylingMapSchema = z.record(
  z.object({
    class: z.string().optional(),
    style: z.string().optional(),
  }),
);

export type TokenToCssStylingMap = z.infer<typeof tokenToCssStylingMapSchema>;

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
  tokenToCssStylingMap: tokenToCssStylingMapSchema.optional().describe(`
    CSS styling that should be applied to each keyword in the function signature.
    This is used to apply the same color theme to the function signature as the code block that was just inputted.
    The HTML input will be cleaned and simplified before being sent to you.
    
    For example, cleaned HTML might look like:
  
    \`\`\`html
    <id=comment1 class="hljs-comment"/>// A basic TypeScript function example</>
    
    <id=keyword1 class="hljs-keyword"/>function</> <id=func1 class="hljs-title function_"/>greetUser</>(<id=param1/>name</>: <id=type1 class="hljs-built_in"/>string</>, <id=param2/>age</>?: <id=type2 class="hljs-built_in"/>number</>): <id=type3 class="hljs-built_in"/>string</> {
      <id=keyword2 class="hljs-keyword"/>if</> (<id=param2b/>age</> !== <id=lit1 class="hljs-literal"/>undefined</>) {
        <id=keyword3 class="hljs-keyword"/>return</> <id=str1 class="hljs-string"/>\`Hello, \${<id=param1b/>name</>}! You are \${<id=param2c/>age</>} years old.\`</>;
      }
      <id=keyword4 class="hljs-keyword"/>return</> <id=str2 class="hljs-string"/>\`Hello, \${<id=param1c/>name</>}!\`</>;
    }
    \`\`\`
    
    The map would be:
      "greetUser": {
        "class": "hljs-title function_"
      },
      "string": {
        "class": "hljs-built_in"
      },
      "number": {
        "class": "hljs-built_in"
      }
    }
    Only include styling for the tokens that are in the function signature. For example, function is not in the signature:
    \`greetUser(name: string, age?: number): string\`

    If a token in the signature does not appear in the code block, infer that the style would be if there is an appropriate example in the code block for that type of token.
    For example:
    
    \`\`\`html
    <id=-7kk292 class="hljs-comment"/>// Nobody knows what this actually does.</>
    <id=-6mfgg2/></>// But if you remove it, the whole simulation desynchronizes.</>
    <id=kw1 class="hljs-keyword"/>const</> coherence = <id=fn1 class="hljs-title function_"/>quantizeEntropyField</>({  <id=attr1 class="hljs-attr"/>seed</>: <id=num1 class="hljs-number"/>0xdeadbeef</>,  <id=attr2 class="hljs-attr"/>drift</>: <id=cls1 class="hljs-title class_"/>Math</>.<id=fn2 class="hljs-title function_"/>random</>() * <id=num2 class="hljs-number"/>0.0001</>,  <id=attr3 class="hljs-attr"/>granularity</>: <id=num3 class="hljs-number"/>4096</>,  <id=attr4 class="hljs-attr"/>mode</>: <id=str1 class="hljs-string"/>"stochastic-tiling"</>,});<id=var1 class="hljs-variable language_"/>console</>.<id=fn3 class="hljs-title function_"/>log</>(<id=str2 class="hljs-string"/>"Field coherence:"</>, coherence);
    \`\`\`
    
    The map would be:
    {
      "quantizeEntropyField": {
        "class": "hljs-title function_"
      },
      "seed": {
        "class": "hljs-attr"
      },
      "drift": {
        "class": "hljs-attr"
      },
      "granularity": {
        "class": "hljs-attr"
      },
      "mode": {
        "class": "hljs-attr"
      },
      "number": {
        "class": "hljs-attr
      },
      "string": {
        "class": "hljs-attr"
      },
      "coherence": {
        "class": "hljs-attr"
      }
    }

    As the signature would be:
    \`quantizeEntropyField(config: { seed: number, drift: number, granularity: number, mode: string }): coherence\`
    

    If there is any styling on the token's tag, it would be set in the style attribute.
    For example:
    
    \`\`\`html
    <id=kw1 style="color: #569cd6;"/>function</> <id=fn1 class="hljs-title function_"/>processData</>(<id=p1 style="color: #9cdcfe;"/>input</>: <id=t1 class="hljs-built_in" style="color: #4ec9b0;"/>string</>): <id=t2 class="hljs-built_in" style="color: #4ec9b0;"/>void</>
    \`\`\`
    
    The map would be:
    {
      "processData": {
        "class": "hljs-title function_"
      },
      "input": {
        "style": "color: #9cdcfe;"
      },
      "string": {
        "class": "hljs-built_in",
        "style": "color: #4ec9b0;"
      },
      "void": {
        "class": "hljs-built_in",
        "style": "color: #4ec9b0;"
      }
    }
    `),
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
  hoverHintMap: Map<CodeTokenId, string>;
  tooltip: HTMLElement;
  timeoutId: TimeoutId;
  currentCodeBlockId: CodeBlockId | undefined;
}
