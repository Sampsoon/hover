export enum MarginSize {
  SMALL = '0.5em',
  LARGE = '0.75em',
}

const TEXT_FONT_SIZE = '14px';

export function applyHoverHintStyle(styles: CSSStyleDeclaration) {
  styles.position = 'fixed';
  styles.background = 'white';
  styles.color = 'black';
  styles.borderRadius = '8px 8px 8px 8px';
  styles.maxWidth = '800px';
  styles.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.15)';
  styles.zIndex = '999999';
  styles.pointerEvents = 'none';
  styles.border = '1px solid #ccc';
  styles.boxSizing = 'border-box';
}

export function hideElement(element: HTMLElement) {
  element.style.display = 'none';
}

export function applyTextContainerStyle(styles: CSSStyleDeclaration) {
  styles.overflowWrap = 'break-word';
  styles.marginLeft = MarginSize.SMALL;
  styles.marginRight = MarginSize.SMALL;
}

export function applyPrimaryTextStyle(styles: CSSStyleDeclaration) {
  styles.color = '#000';
  styles.fontSize = TEXT_FONT_SIZE;
}

export function applySecondaryTextStyle(styles: CSSStyleDeclaration) {
  styles.color = '#666';
  styles.fontSize = TEXT_FONT_SIZE;
}

export function applyCodeContainerStyle(styles: CSSStyleDeclaration) {
  styles.marginLeft = MarginSize.SMALL;
  styles.marginRight = MarginSize.SMALL;
}

export function applyCodeTextStyle(styles: CSSStyleDeclaration) {
  styles.fontFamily = 'monospace';
  styles.fontSize = TEXT_FONT_SIZE;
}

export function applyBottomMarginStyle(styles: CSSStyleDeclaration, marginSize: string = MarginSize.SMALL) {
  styles.marginBottom = marginSize;
}

export function applyTopMarginStyle(styles: CSSStyleDeclaration, marginSize: string = MarginSize.SMALL) {
  styles.marginTop = marginSize;
}

export function applySemiBoldTextStyle(styles: CSSStyleDeclaration) {
  styles.fontWeight = '500';
}
