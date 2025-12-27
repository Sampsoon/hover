export const RETRIEVAL_HOVER_HINTS_PROMPT = `
Analyze the provided HTML code blocks and produce hover hints for code elements that would benefit from documentation.

For each element worth documenting:
1. Identify token IDs (data-token-id values) that refer to the same entity
2. Provide documentation using only the fields that add value

TOKEN ID SELECTION:
- For chained access like \`a.b.c\`, only include the specific token being documented (e.g., just \`c\`)
- Multiple IDs are for the SAME token appearing multiple times (e.g., \`myFun\` in definition and call sites)
- Do NOT include parent objects in the chain - document each level separately if needed

WHAT TO DOCUMENT:
- Library/API calls that readers may not know
- Non-obvious imports (unfamiliar libraries, aliased imports, or imports with unclear purposes)
- Functions with non-obvious behavior, side effects, or gotchas
- Configuration objects and their options
- Variables whose purpose isn't clear from the name
- Complex expressions or algorithms

WHAT TO SKIP:
- Language keywords (if, return, const, class, etc.)
- Built-in types (string, int, boolean, etc.)
- Self-explanatory code (const name = "Alice", simple getters)
- Standard operations everyone knows (Math.max, console.log)
- Obvious variable names (userId, isValid, count)

DOCUMENTATION FIELDS (all optional - only include what's useful):
- signature: For callables (functions, methods, constructors, macros, decorators). Format: \`name(param: Type): ReturnType\`
- properties: For documenting fields on objects/configs. Use with signature or documentation - never standalone.
- params: Only for parameters with constraints, special values, or subtle behavior. Use with signature.
- returns: Only when return value isn't obvious from the function name. Use with signature.
- documentation: Brief explanation when the code's purpose needs clarification (1-5 sentences max)
- signatureStyles: Map signature tokens to token IDs from the HTML for syntax highlighting

Every hover hint must have at least a signature or documentation field to provide context.

SIGNATURE SYNTAX HIGHLIGHTING:

Goal: Make signatures look like code - with colors matching the code block's syntax theme.

How it works:
- The HTML code block already has syntax highlighting (CSS classes applied to tokens)
- We borrow those colors by referencing token IDs in signatureStyles
- For each word in your signature, point to a token in the HTML that should have the same color

Example: For signature \`fetchUser(id: number): User\`
- "fetchUser" should be colored like function names → find a function token in the HTML, use its ID
- "id" should be colored like parameters → find a parameter token, use its ID
- "number", "User" should be colored like types → find a type token, use its ID

Result: signatureStyles: { "fetchUser": "t1", "id": "t3", "number": "t5", "User": "t5" }

WHAT TOKENS SHARE THE SAME COLOR (in most syntax themes):
These semantic categories typically share the same color, so any token in a group can substitute for another:

- CALLABLES: function, method, macro, command, decorator
- TYPES: type, class, interface, module, namespace, built-in
- VARIABLES: variable, parameter, argument, property, identifier
- KEYWORDS: keyword, modifier, operator, control
- LITERALS: string, number, boolean, constant

HOW TO FIND THE RIGHT TOKEN:
1. Look for an exact match first (e.g., for a function name, find another function name in the HTML)
2. FALLBACK: If no exact match exists, use any token from the same category above
   - Need a type but no type token? Use a class, module, or built-in token instead
   - Need a function but no function token? Use a method or command token instead

CONSISTENCY:
- Within a signature: if you style one type, style ALL types the same way
- Across ALL hover hints: use the SAME token IDs for the same semantic roles
  - If you use t5 for types in one hint, use t5 for types in ALL hints
  - If you use t1 for functions in one hint, use t1 for functions in ALL hints
  - This ensures all hover hints have matching syntax highlighting

QUALITY GUIDELINES:
- Be concise - every word should add value
- Skip obvious information - don't document what the code already shows
- Focus on the "why" and "gotchas", not the "what"
- Plain text only - no HTML or markdown in documentation strings
`;
