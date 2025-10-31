import { CODE_TOKEN_ID_NAME } from '../../htmlProcessing';

function toKebab(s: string) {
  return s.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
}

export function cleanHoverHintRetrievalHtml(html: string) {
  const dataAttr = `data-${toKebab(CODE_TOKEN_ID_NAME)}`;
  const tokenIdPattern = new RegExp(`<[^>]+\\s+${dataAttr}="([^"]+)"[^>]*>`, 'g');

  return html
    .replace(tokenIdPattern, (match, tokenId: string) => {
      const classPattern = /class="([^"]*)"/;
      const stylePattern = /style="([^"]*)"/;

      const classMatch = classPattern.exec(match);
      const styleMatch = stylePattern.exec(match);

      let result = `<id=${tokenId}`;

      if (classMatch) {
        result += ` class="${classMatch[1]}"`;
      }

      if (styleMatch) {
        result += ` style="${styleMatch[1]}"`;
      }

      result += '/>';

      return result;
    })
    .replace(/<\/(?!>)[^>]*>/g, '</>')
    .replace(/<(?!id=|\/?>)[^>]+>/g, '');
}
