import { CODE_TOKEN_ID_NAME } from '../../htmlProcessing';
import type { HoverHint } from '@hover/shared';

function toKebab(s: string) {
  return s.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
}

export function cleanHoverHintRetrievalHtml(html: string) {
  const dataAttr = `data-${toKebab(CODE_TOKEN_ID_NAME)}`;
  const tokenIdPattern = new RegExp(`<([a-z0-9]+)\\b[^>]*\\s+${dataAttr}="([^"]+)"[^>]*>`, 'gi');

  return html
    .replace(tokenIdPattern, '<t id="$2">')
    .replace(/<([a-z0-9]+)\b(?! id=)[^>]*>/gi, '<t>')
    .replace(/<\/([a-z0-9]+)[^>]*>/gi, '</t>');
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
