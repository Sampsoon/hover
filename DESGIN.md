# Current Design Thoughts

## Background
The following design is for a Chrome extension that will identify code blocks in HTML and provide an editor-like experience for them. The primary feature it will support is providing definitions for parts of code, such as classes or functions, when hovered over. This experience will be similar to what you get in an editor like VSCode, but without the need for an LSP or editor—hence the name Vibey LSP.

## HTML Examples on ChatGPT

### Markdown
```html
<code class="whitespace-pre! language-python">
<span>
    <span class="hljs-keyword">def</span>
    <span> </span>
    <span class="hljs-title function_">main</span>
    <span>():</span>
</span>
<br>
<span>
    <span>  </span>
    <span class="hljs-built_in">print</span>
    <span>(</span>
    <span class="hljs-string">"Hello, World!"</span>
    <span>)</span>
</span>
<br>
<br>
<span>
    <span class="hljs-keyword">if</span>
    <span> __name__ == </span>
    <span class="hljs-string">"__main__"</span>
    <span>:</span>
</span>
<br>
<span>
    <span>  main()</span>
</span>
</code>
```


### POC Tasks
* Preprocess LLM HTML input
* Make LLM return structured json object rather then HTML to avoid prompt injection and lead to better consistency and improve LLM prompt
* Pick a good LLM
* Stream json response rather then wait for the whole thing
* Scrub inputs to service workers
* Have ability to select local LLMs
* Have toggle to add button to code blocks that when clicked generates suggestions

### UI
* Have ability for users to select permissions of chrome extension during setup 
* Have ability to exclude websites 

### Bugs
* Fix bug where IDs may be hallucinated?
```
    > processCodeBlocks.ts-1AjmrRd_.js:1 Code token with id xp2n6 not found in idToCodeTokenMap
    > (anonymous) @ processCodeBlocks.ts-1AjmrRd_.js:1
    > A @ processCodeBlocks.ts-1AjmrRd_.js:1
    > (anonymous) @ processCodeBlocks.ts-1AjmrRd_.js:13
    > o @ processCodeBlocks.ts-1AjmrRd_.js:13Understand this error
    > processCodeBlocks.ts-1AjmrRd_.js:1 Code token with id c8y8g not found in idToCodeTokenMap
    > (anonymous) @ processCodeBlocks.ts-1AjmrRd_.js:1
    > A @ processCodeBlocks.ts-1AjmrRd_.js:1
    > (anonymous) @ processCodeBlocks.ts-1AjmrRd_.js:13
    > o @ processCodeBlocks.ts-1AjmrRd_.js:13Understand this error
    > processCodeBlocks.ts-1AjmrRd_.js:1 Code token with id 47j3k not found in idToCodeTokenMap
    > (anonymous) @ processCodeBlocks.ts-1AjmrRd_.js:1
    > A @ processCodeBlocks.ts-1AjmrRd_.js:1
    > (anonymous) @ processCodeBlocks.ts-1AjmrRd_.js:13
    > o @ processCodeBlocks.ts-1AjmrRd_.js:13Understand this error
    > processCodeBlocks.ts-1AjmrRd_.js:1 Code token with id g4z0b not found in idToCodeTokenMap
```

### House Keeping
* Clean up `processCodeBlocks.ts`
* Clean up state management
