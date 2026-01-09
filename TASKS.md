**Note:** This extension was posted on Hacker News. The discussion could be useful in the future for future improvements. It can be found [here](https://news.ycombinator.com/item?id=46490895)

### Tasks

- Play around with UI style and logo some more
- Add button for force generation of token
- Add toggle to turn off auto generation in div around code block. When this happens, the user should be able to manually generate documentation for a token.

### Improvements

- Make syntax highlighting better
- Make it so "annotations(s)" string is either constantly inside or outside a code block
- Figure a method for the hover hins to stay on the page so that the user can select stuff, without them getting in the way when the user wants them to go away
- Add links and commands to install packages in hover hints

### Possible Large Changes

- Use official documentation
- https://context7.com/
- https://cht.sh/
- Add backend
- Use on device LLMs
  - Would require completely changing flow to optimize for smaller context window
  - Low chance of being smart enough
  - [chrome://on-device-internals/](chrome://on-device-internals/)
  - [Chrome Prompt API](https://developer.chrome.com/docs/ai/prompt-api?_gl=1*pmq4tr*_up*MQ..&gclid=Cj0KCQjwovPGBhDxARIsAFhgkwSe9HUu4OXW2BWOM0HaXBiXTRh0SRW7BjLVO0yABcgLlspt0wsRFbsaAvgQEALw_wcB&gbraid=0AAAAAC1d8f4DQgFp_TfJG8fwdrY2UkdAY)
- Add github support.
  - Github does not use `<code\>` blocks, this would require implementing new parsing logic

### House Keeping

- Clean up `processCodeBlocks.ts`
- Clean up state management
- Take another look at style generation code as see if it can be improved.
