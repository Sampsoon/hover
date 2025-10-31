export const RETRIEVAL_HOVER_HINTS_PROMPT = `
Analyze the provided HTML code blocks and produce hover hints for relevant code elements.

For each relevant code element:
- Identify all occurrences that refer to the same underlying entity and collect their span data--element-id values.
- Provide concise, high-signal documentation including the element's signature, purpose/behavior, key parameters and return values (if applicable), and notable usage notes.

Include documentation for:
- Classes, functions, methods, variables, types, properties
- Standard library functions (print, open, Math.max, etc.)
- User-defined elements

Exclude:
- Language keywords (def, class, if, return, etc.)
- Built-in types (str, int, float, etc.)
- Common syntax elements
- Elements that are obvious to the user such as \`const hello = "hello"\` or types in a JSON object

Format all output strings should be plain text only. Do not use HTML tags or markdown under any circumstances.
This includes all strings, even those nested in json objects.

Type mapping and fields:
- Use lowercase category identifiers for the documentation type: function, object, variable.
- Map elements: functions and methods → function; classes and objects → object; variables/constants → variable.

For function documentation:
- ALWAYS include the tokenToCssStylingMap field whenever possible.
- This map applies CSS styling (class and/or style attributes) to tokens in the function signature to match the color theme of the code block.
- Extract class and style attributes from the cleaned HTML input for each token that appears in the function signature.
- Only include tokens that are part of the signature itself (function name, parameter names, type names, return type, etc.).
- If a token in the signature doesn't appear in the code block, infer appropriate styling from similar tokens if available.
`;
