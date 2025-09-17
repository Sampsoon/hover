import { CODE_TOKEN_ID_NAME } from '../../htmlProcessing';

function toKebab(s: string) {
  return s.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
}

// Cleans HTML for LLM hover hint retrieval by:
// 1. Converting elements with data-token-id attributes to <id=tokenValue/> (strips all other attributes)
// 2. Removing all other HTML tags while preserving text content and whitespace
// 3. Keeping only the essential structure needed for token identification
//
// Example: '<div class="hljs"><span class="keyword" data-token-id="abc123">myVar</span> = <em>value</em></div>'
// Becomes: '<id=abc123/>myVar</> = value'
export function cleanHoverHintRetrievalHtml(html: string) {
  const dataAttr = `data-${toKebab(CODE_TOKEN_ID_NAME)}`;

  return html
    .replace(new RegExp(`<([^>]+)\\s+${dataAttr}="([^"]+)"[^>]*>`, 'g'), '<id=$2/>')
    .replace(/<\/(?!>)[^>]*>/g, '</>')
    .replace(/<(?!id=|\/?>)[^>]+>/g, '');
}
