import { CodeTokenId, IdMappings } from '../htmlProcessing';
import { HoverHintState } from './types';

const DEFAULT_DARK_COLOR = 'rgb(30, 30, 30)';
const DEFAULT_LIGHT_COLOR = 'rgb(240, 240, 240)';
const STYLE_CACHE_EXPIRY_MS = 500;

export enum MarginSize {
  SMALL = '0.5em',
  LARGE = '0.75em',
}

export enum DocStringCommand {
  PARAM = '@Param',
  RETURN = '@Return',
  PROPERTY = '@Property',
}

const TEXT_FONT_SIZE = '14px';

export function applyHoverHintStyle(styles: CSSStyleDeclaration) {
  styles.position = 'fixed';
  styles.borderRadius = '8px 8px 8px 8px';
  styles.maxWidth = '800px';
  styles.zIndex = '999999';
  styles.pointerEvents = 'none';
  styles.boxSizing = 'border-box';
  styles.paddingTop = MarginSize.SMALL;
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
  styles.fontSize = TEXT_FONT_SIZE;
}

export function applySecondaryTextStyle(styles: CSSStyleDeclaration) {
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

export function applySemiBoldTextStyle(styles: CSSStyleDeclaration) {
  styles.fontWeight = '500';
}

export function styleTooltipToMatchCodeBlock(
  tooltip: HTMLElement,
  idMappings: IdMappings,
  hoverHintState: HoverHintState,
  tokenId: CodeTokenId,
) {
  const { parentCodeBlockMap } = idMappings;
  const parentCodeBlock = parentCodeBlockMap.get(tokenId);

  if (!parentCodeBlock) {
    console.error(`Parent code block of token id ${tokenId} not found in parentCodeBlockMap`);
    return;
  }

  const now = Date.now();
  const cacheExpired = now - hoverHintState.lastStyleComputedAt > STYLE_CACHE_EXPIRY_MS;

  if (hoverHintState.currentCodeBlockId === parentCodeBlock.codeBlockId && !cacheExpired) {
    return;
  }

  hoverHintState.currentCodeBlockId = parentCodeBlock.codeBlockId;
  hoverHintState.lastStyleComputedAt = now;

  tooltip.style.backgroundColor = DEFAULT_LIGHT_COLOR;
  tooltip.style.color = DEFAULT_DARK_COLOR;

  inheritStylesFromParent(tooltip, parentCodeBlock.html);

  tooltip.style.border = `1px solid ${tooltip.style.color}`;
}

export function inheritStylesFromParent(element: HTMLElement, parentElement: HTMLElement) {
  const backgroundStyle = findStyle(
    parentElement,
    (style) => style.backgroundColor !== 'transparent' && style.backgroundColor !== 'rgba(0, 0, 0, 0)',
  );

  if (!backgroundStyle) {
    return;
  }

  if (doColorsContrast(backgroundStyle.backgroundColor, backgroundStyle.color)) {
    element.style.backgroundColor = backgroundStyle.backgroundColor;
    element.style.color = backgroundStyle.color;
    return;
  }

  const textStyle = findStyle(parentElement, (style) => doColorsContrast(backgroundStyle.backgroundColor, style.color));

  if (textStyle) {
    element.style.backgroundColor = backgroundStyle.backgroundColor;
    element.style.color = textStyle.color;
    return;
  }

  const contrastingColor = computeContrastingColor(backgroundStyle.backgroundColor);

  if (contrastingColor) {
    element.style.backgroundColor = backgroundStyle.backgroundColor;
    element.style.color = contrastingColor;
    return;
  }
}

function findStyle(
  codeBlock: HTMLElement,
  predicate: (style: CSSStyleDeclaration) => boolean,
): CSSStyleDeclaration | undefined {
  const style = window.getComputedStyle(codeBlock);

  if (predicate(style)) {
    return style;
  }

  if (codeBlock.parentElement) {
    return findStyle(codeBlock.parentElement, predicate);
  }

  return undefined;
}

interface RgbColor {
  r: number;
  g: number;
  b: number;
}

function doColorsContrast(backgroundColor: string, textColor: string): boolean {
  const backgroundRgb = parseColor(backgroundColor);
  const textRgb = parseColor(textColor);

  if (!backgroundRgb || !textRgb) {
    return false;
  }

  const contrastRatio = calculateContrastRatio(backgroundRgb, textRgb);
  return contrastRatio >= 4.5;
}

function parseColor(color: string): RgbColor | undefined {
  const rgbMatch = /rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(color);

  if (rgbMatch) {
    return {
      r: parseInt(rgbMatch[1]),
      g: parseInt(rgbMatch[2]),
      b: parseInt(rgbMatch[3]),
    };
  }

  return undefined;
}

function calculateLuminance(rgb: RgbColor): number {
  const rsRGB = rgb.r / 255;
  const gsRGB = rgb.g / 255;
  const bsRGB = rgb.b / 255;

  const r = rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4);
  const g = gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4);
  const b = bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4);

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function calculateContrastRatio(
  color1: { r: number; g: number; b: number },
  color2: { r: number; g: number; b: number },
): number {
  const lum1 = calculateLuminance(color1);
  const lum2 = calculateLuminance(color2);

  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);

  return (lighter + 0.05) / (darker + 0.05);
}

function computeContrastingColor(color: string): string | undefined {
  const rgb = parseColor(color);

  if (!rgb) {
    return undefined;
  }

  const luminance = calculateLuminance(rgb);

  return luminance > 0.5 ? DEFAULT_DARK_COLOR : DEFAULT_LIGHT_COLOR;
}
