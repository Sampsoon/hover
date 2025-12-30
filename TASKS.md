
### Tasks
* Play around with UI style and logo some more

### POC Tasks
* Scrub inputs to service workers
* Scrub output html such as the style map
* Have ability to select local LLMs
* Handle large inputs. Maybe in chucks?
* Add button for triggering hover hints manually on code block
* Add button to generate a hover hint for a given token
* Add button for force generation of token
* Make padding on top match bottom for hover hints
* See if tokens with white space are having IDs generated for them. If so, stop.
* Add div around code block to contain "annotation(s)"
* Add annotations pending state before the hover hints start to come in

### House Keeping
* Clean up `processCodeBlocks.ts`
* Clean up state management
* Take another look at style generation code as see if it can be improved. In doing so, check if caching in necessary, because it can get stale if the user changes the theme.
