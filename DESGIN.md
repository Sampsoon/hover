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
* Fix issue where the same name is used more then once place. The best way to handle this is by having the LLM output a list of ids.
class W;ordCounter:
```
    def __init__(self, filename):
        self.filename = filename

    def count_words(self):
        try:
            with open(self.filename, 'r') as f:
                return sum(len(line.split()) for line in f)
        except FileNotFoundError:
            return "File not found."

wc = WordCounter('example.txt')
print(wc.count_words())
```
* await until view is stable before processing code block in view
* Add threshold for intersection observer
* *Filter element in mutation observer