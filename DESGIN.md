

### POC Tasks
* Scrub inputs to service workers
* Scrub output html such as the style map
* Have ability to select local LLMs
* Keep popup on screen when user moves mouse over it
* Look into removing styling cashing
* Handle large inputs. Maybe in chucks?
* Sanitize html further to remove styles
### House Keeping
* Clean up `processCodeBlocks.ts`
* Clean up state management
* Take another look at style generation code as see if it can be improved. In doing so, check if caching in necessary, because it can get stale if the user changes the theme.
