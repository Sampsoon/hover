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


### Canvas
```html
<div spellcheck="true" autocorrect="true" autocapitalize="off" translate="no" contenteditable="false" style="tab-size: 4;" class="cm-content" role="textbox" aria-multiline="true" aria-readonly="true" data-language="python" aria-autocomplete="list">
<div class="cm-line">
    <span class="ͼ28">def</span>
    <span> </span>
    <span class="ͼ2d">main</span>
    <span class="ͼ2f">(</span>
    <span class="ͼ2f">)</span>
    <span class="ͼ2f">:</span>
</div>
<div class="cm-line">
    <span>    </span>
    <span class="ͼ2d">print</span>
    <span class="ͼ2f">(</span>
    <span class="ͼ2h">"Hello, World!"</span>
    <span class="ͼ2f">)</span>
</div>
<div class="cm-line"><br></div>
<div class="cm-line">
    <span class="ͼ29">if</span>
    <span> </span>
    <span class="ͼ2a">__name__</span>
    <span> </span>
    <span class="ͼ2f">==</span>
    <span> </span>
    <span class="ͼ2h">"__main__"</span>
    <span>:</span>
</div>
<div class="cm-line">
    <span>    </span>
    <span class="ͼ2d">main</span>
    <span class="ͼ2f">(</span>
    <span class="ͼ2f">)</span>
</div>
<div class="cm-line"><br></div>
</div>
```


### POC Tasks
* Run on page load
* Preprocess LLM HTML input
* Make LLM return structured json object rather then HTML to avoid prompt injection and lead to better consistency and improve LLM prompt
* Clean up hoverHintMap on reprocessing of code blocks
* Handle user edits in canvas so that it does not fire on every edit
* Pick a good LLM
  