import { CodeBlock } from "../htmlParsing";
import { LlmInterface } from "../llm";
import { HoverHintList, hoverHintListSchema } from "./types";

const RETRIEVAL_HOVER_HINTS_PROMPT = (code: CodeBlock) => `# Code Analysis Prompt for Hover Hints

Given this HTML code block, please return a list of hover hints providing documentation for each element in the code block that is a function, variable, class, or custom type. These should be in the same style as hover hints in an editor like VSCode.

For example:

Input HTML:
<code class="language-python">
<span class="hljs-keyword">def</span>
<span> </span>
<span class="hljs-title function_">calculate_area</span>
<span>(</span>
<span class="hljs-params">radius</span>
<span>):</span>
</code>

Expected Output: 
{
  "hoverHintList": [
    {
      "htmlText": "calculate_area",
      "htmlClass": "hljs-title function_",
      "docInHtml": "<code>def calculate_area(radius) -> float</code><br/>Calculates the area of a circle given its radius.<br/><br/><strong>Parameters:</strong><br/>• <code>radius</code> - The radius of the circle<br/><br/><strong>Returns:</strong><br/>The area of the circle (π × radius²)"
    },
    {
      "htmlText": "radius",
      "htmlClass": "hljs-params",
      "docInHtml": "<code>radius: float</code><br/>Parameter representing the radius of a circle"
    },
    {
      "htmlText": "math",
      "htmlClass": "hljs-built_in",
      "docInHtml": "<strong>math</strong> module<br/>Python's built-in mathematical functions and constants"
    }
  ]
}

Another Example with Class:
<code class="language-typescript">
<span class="hljs-keyword">class</span>
<span> </span>
<span class="hljs-title class_">UserService</span>
<span> {</span>
<br>
<span>  </span>
<span class="hljs-keyword">private</span>
<span> </span>
<span class="hljs-attr">apiClient</span>
<span>:</span>
<span> </span>
<span class="hljs-title class_">HttpClient</span>
<span>;</span>
</code>

Expected Output:
{
  "hoverHintList": [
    {
      "htmlText": "UserService",
      "htmlClass": "hljs-title class_",
      "docInHtml": "<code>class UserService</code><br/>Service class for handling user-related operations"
    },
    {
      "htmlText": "apiClient",
      "htmlClass": "hljs-attr",
      "docInHtml": "<code>private apiClient: HttpClient</code><br/>Private property for making HTTP requests"
    },
    {
      "htmlText": "HttpClient",
      "htmlClass": "hljs-title class_",
      "docInHtml": "<code>HttpClient</code><br/>Type representing an HTTP client for making web requests"
    }
  ]
}

Example showing what NOT to include (common built-ins):
<code class="language-python">
<span class="hljs-keyword">class</span>
<span> </span>
<span class="hljs-title class_">Person</span>
<span>:</span>
<br>
<span>    </span>
<span class="hljs-keyword">def</span>
<span> </span>
<span class="hljs-title function_">__init__</span>
<span>(</span>
<span class="hljs-params">self</span>
<span>, </span>
<span class="hljs-params">name</span>
<span>: </span>
<span class="hljs-built_in">str</span>
<span>):</span>
<br>
<span>        </span>
<span class="hljs-variable-name">self.name</span>
<span> = name</span>
</code>

Expected Output (notice what's excluded):
{
  "hoverHintList": [
    {
      "htmlText": "Person",
      "htmlClass": "hljs-title class_",
      "docInHtml": "<code>class Person</code><br/>Represents a person with a name"
    },
    {
      "htmlText": "name",
      "htmlClass": "hljs-params",
      "docInHtml": "<code>name: str</code><br/>Parameter for the person's name"
    },
    {
      "htmlText": "self.name",
      "htmlClass": "hljs-variable-name",
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

${code.html.innerHTML}
`;

export const retrieveAnnotations = async (code: CodeBlock, llm: LlmInterface): Promise<HoverHintList> => {
  return llm.callLlmForJsonOutput(RETRIEVAL_HOVER_HINTS_PROMPT(code), hoverHintListSchema);
}
