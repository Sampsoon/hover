import { CODE_TOKEN_ID_NAME } from '../../htmlProcessing';
import { HoverHint } from '../../hoverHints';

function toKebab(s: string) {
  return s.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
}

export function cleanHoverHintRetrievalHtml(html: string) {
  const dataAttr = `data-${toKebab(CODE_TOKEN_ID_NAME)}`;
  const tokenIdPattern = new RegExp(`<[^>]+\\s+${dataAttr}="([^"]+)"[^>]*>`, 'g');

  return html
    .replace(tokenIdPattern, '<id=$1/>')
    .replace(/<\/(?!>)[^>]*>/g, '</>')
    .replace(/<(?!id=|\/?>)[^>]+>/g, '');
}

export function buildContinuationInput(cleanedHtml: string, previousHints: HoverHint[]): string {
  if (previousHints.length === 0) {
    return cleanedHtml;
  }

  const hintsJson = JSON.stringify(previousHints, null, 2);
  return `Previously generated hover hints (maintain signatureStyles consistency, skip these IDs):
${hintsJson}

${cleanedHtml}`;
}
