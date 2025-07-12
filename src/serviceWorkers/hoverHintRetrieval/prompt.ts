export const RETRIEVAL_HOVER_HINTS_PROMPT = (codeBlockRawHtml: string) => `# Code Analysis Prompt for Hover Hints

Given this HTML code block, please return a list of hover hints providing documentation for each element in the code block that is a function, variable, class, or custom type. These should be in the same style as hover hints in an editor like VSCode.

For example:

Input HTML:
<code class="language-python">
<span class="hljs-keyword" data--element-id="e5a12bd6-453f-4915-9d93-eb4ea3b29c05">def</span>
<span> </span>
<span class="hljs-title function_" data--element-id="bca8680c-c7fc-43fb-9bdf-d0781a339828">calculate_area</span>
<span>(</span>
<span class="hljs-params" data--element-id="d4e89a1c-7f6b-4e3a-b8a4-1d7bc9e6a9f2">radius</span>
<span>):</span>
</code>

Expected Output: 
{
  "hoverHintList": [
    {
      "elementId": "bca8680c-c7fc-43fb-9bdf-d0781a339828",
      "docInHtml": "<code>def calculate_area(radius) -> float</code><br/>Calculates the area of a circle given its radius.<br/><br/><strong>Parameters:</strong><br/>• <code>radius</code> - The radius of the circle<br/><br/><strong>Returns:</strong><br/>The area of the circle (π × radius²)"
    },
    {
      "elementId": "d4e89a1c-7f6b-4e3a-b8a4-1d7bc9e6a9f2",
      "docInHtml": "<code>radius: float</code><br/>Parameter representing the radius of a circle"
    }
  ]
}

Another Example with Class:
<code class="language-typescript">
<span class="hljs-keyword" data--element-id="f8c12e45-9a3d-4b67-95c8-2d890e1234a5">class</span>
<span> </span>
<span class="hljs-title class_" data--element-id="a7b91d23-6c4e-4f89-ae56-3d901f567b8c">UserService</span>
<span> {</span>
<br>
<span>  </span>
<span class="hljs-keyword" data--element-id="c6e45f12-8d9a-4b23-bc67-1e890f234d56">private</span>
<span> </span>
<span class="hljs-attr" data--element-id="b9d34a78-5e2f-4c12-9d45-6f789abc0123">apiClient</span>
<span>:</span>
<span> </span>
<span class="hljs-title class_" data--element-id="e2f34d56-7a8b-4c90-ae12-3f456b789c01">HttpClient</span>
<span>;</span>
</code>

Expected Output:
{
  "hoverHintList": [
    {
      "elementId": "a7b91d23-6c4e-4f89-ae56-3d901f567b8c",
      "docInHtml": "<code>class UserService</code><br/>Service class for handling user-related operations"
    },
    {
      "elementId": "b9d34a78-5e2f-4c12-9d45-6f789abc0123",
      "docInHtml": "<code>private apiClient: HttpClient</code><br/>Private property for making HTTP requests"
    },
    {
      "elementId": "e2f34d56-7a8b-4c90-ae12-3f456b789c01",
      "docInHtml": "<code>HttpClient</code><br/>Type representing an HTTP client for making web requests"
    }
  ]
}

Example showing what NOT to include (common built-ins):
<code class="language-python">
<span class="hljs-keyword" data--element-id="d1e23f45-6a7b-4c89-9d01-2e345f678901">class</span>
<span> </span>
<span class="hljs-title class_" data--element-id="b8c90a12-3d4e-5f67-8901-2b345c678901">Person</span>
<span>:</span>
<br>
<span>    </span>
<span class="hljs-keyword" data--element-id="a9b81c23-4d5e-6f78-9012-3a456b789012">def</span>
<span> </span>
<span class="hljs-title function_" data--element-id="c7d89e12-3f45-6a78-9b01-2c345d678901">__init__</span>
<span>(</span>
<span class="hljs-params" data--element-id="e5f67a89-0123-4b56-7c89-0d123e456789">self</span>
<span>, </span>
<span class="hljs-params" data--element-id="f8901234-5a67-8b90-1c23-4d567e890123">name</span>
<span>: </span>
<span class="hljs-built_in" data--element-id="a1234567-8b90-1c23-4d56-7e890f123456">str</span>
<span>):</span>
<br>
<span>        </span>
<span class="hljs-variable-name" data--element-id="b2345678-9c01-2d34-5e67-8f901a234567">self.name</span>
<span> = name</span>
</code>

Expected Output (notice what's excluded):
{
  "hoverHintList": [
    {
      "elementId": "b8c90a12-3d4e-5f67-8901-2b345c678901",
      "docInHtml": "<code>class Person</code><br/>Represents a person with a name"
    },
    {
      "elementId": "f8901234-5a67-8b90-1c23-4d567e890123",
      "docInHtml": "<code>name: str</code><br/>Parameter for the person's name"
    },
    {
      "elementId": "b2345678-9c01-2d34-5e67-8f901a234567",
      "docInHtml": "<code>self.name: str</code><br/>Instance attribute storing the person's name"
    }
  ]
}

Note: __init__, self (by itself), str, and the math module are NOT included because they are common built-ins that don't need custom documentation. However, self.name IS included because it's a user-defined instance attribute.

Guidelines:

1. Focus on definable elements only: Only provide hints for functions, variables, classes, types, instance attributes (like self.property), imported third-party modules/libraries, and standard library functions (such as Python's print, input, open, or JavaScript's Math.max, Array.prototype.map, etc). Do NOT provide hints for language keywords or built-in types. For example, exclude common elements like def, class, if, private, str, int, float, etc.

2. Match exact text: The htmlText should exactly match the text content of the HTML span, including casing.

3. Include class when available: If the span has a CSS class that indicates its semantic meaning (like hljs-keyword, hljs-function, etc.), include it in htmlClass.

4. Rich HTML documentation: Format docInHtml with:
   - Code signatures using <code> tags
   - Bold headings with <strong>
   - Line breaks with <br/>
   - Bullet points with • character
   - Type annotations when relevant

5. Context-aware descriptions: Consider the surrounding code context to provide more accurate descriptions of variables and functions.

6. Language-specific conventions: Adapt the documentation style to match the programming language's conventions (e.g., Python docstrings, TypeScript type annotations).

7. Concise but informative: Keep descriptions brief but include essential information like parameters, return types, and purpose.

8. Standard library functions: You should also provide hints for standard library functions, such as print in Python or Math.max in JavaScript, with a brief description of what they do and their signature.

Now, analyze the provided HTML code block and return the hover hints as a JSON object with a "hoverHintList" array matching this format.

HTML Code Block to Analyze:

${codeBlockRawHtml}
`;
