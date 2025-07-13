export const RETRIEVAL_HOVER_HINTS_PROMPT = (codeBlockRawHtml: string) => `
Analyze the HTML code block and return hover hints for code elements.

Return a JSON object with a "hoverHintList" array. Each item must have:
- "data--element-ids": array of span data--element-id values that share the same documentation
- "docInHtml": documentation in HTML format

Include documentation for:
- Classes, functions, methods, variables, types, properties
- Standard library functions (print, open, Math.max, etc.)
- User-defined elements

Exclude:
- Language keywords (def, class, if, return, etc.)
- Built-in types (str, int, float, etc.)
- Common syntax elements
- Element that are obvious to the user such as \`const hello = "hello"\` or types in a json object

Format docInHtml with:
- <code> tags for signatures
- <strong> for headings
- <br/> for line breaks
- • for bullet points

Example - Single element:
<code class="language-python">
  <span class="hljs-title function_" data--element-id="abc123">calculate_area</span>
</code>
Output:
{
  "hoverHintList": [
    {
      "data--element-ids": ["abc123"],
      "docInHtml": "<code>def calculate_area(radius) -> float</code><br/>Calculates the area of a circle"
    }
  ]
}

Example - Multiple instances of same element:
<code class="language-python">
  <span class="hljs-title class_" data--element-id="id1">WordCounter</span>
  ...
  <span class="hljs-title class_" data--element-id="id2">WordCounter</span>
</code>
Output:
{
  "hoverHintList": [
    {
      "data--element-ids": ["id1", "id2"],
      "docInHtml": "<code>class WordCounter</code><br/>Counts words in a file"
    }
  ]
}

Now analyze this HTML code block:
${codeBlockRawHtml}
`;
