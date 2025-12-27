export const RETRIEVAL_HOVER_HINTS_PROMPT = `
Analyze the provided HTML code blocks and produce hover hints for code elements that would benefit from documentation.

For each element worth documenting:
1. Identify all token IDs (data-token-id values) that refer to the same entity
2. Provide documentation using only the fields that add value

WHAT TO DOCUMENT:
- Library/API calls that readers may not know
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
- properties: For objects/configs with non-obvious fields
- params: Only for parameters with constraints, special values, or subtle behavior
- returns: Only when return value isn't obvious from the function name
- documentation: Brief explanation when the code's purpose needs clarification (1-5 sentences max)
- tokenToCssStylingMap: CSS classes/styles for signature tokens to match the code's syntax highlighting

QUALITY GUIDELINES:
- Be concise - every word should add value
- Skip obvious information - don't document what the code already shows
- Focus on the "why" and "gotchas", not the "what"
- Plain text only - no HTML or markdown in documentation strings

CSS STYLING:
When providing a signature, include tokenToCssStylingMap to preserve syntax highlighting.
Extract class/style attributes from the HTML for tokens in your signature.
Only include tokens that appear in the signature itself.
`;
