import { CODE_TOKEN_ID_NAME } from '../../htmlProcessing';

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
