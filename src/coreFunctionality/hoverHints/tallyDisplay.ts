import { PROGRAMMATICALLY_ADDED_ELEMENT_ATTRIBUTE_NAME } from '../htmlProcessing';

const TALLY_CLASS_NAME = 'hover-tally';

function insertTallyIntoContainer(tally: HTMLElement, container: HTMLElement): void {
  // Insert at the beginning (before code block) so tally appears above code
  container.insertBefore(tally, container.firstChild);
}

function initializeTallyDisplay(container: HTMLElement): HTMLElement {
  const tally = createTallyElement();
  insertTallyIntoContainer(tally, container);
  updateTallyText(tally, 0);

  return tally;
}

function getTallyFromContainer(container: HTMLElement): HTMLElement | null {
  return container.querySelector(`.${TALLY_CLASS_NAME}`);
}

export function getOrCreateTally(container: HTMLElement): HTMLElement {
  const existing = getTallyFromContainer(container);
  if (existing) {
    return existing;
  }

  return initializeTallyDisplay(container);
}

export function updateTallyDisplay(container: HTMLElement, incrementBy: number): void {
  const tally = getOrCreateTally(container);
  const currentCount = parseCountFromElement(tally);
  updateTallyText(tally, currentCount + incrementBy);
}

function parseCountFromElement(tally: HTMLElement): number {
  const text = tally.textContent ?? '';
  const match = /^(\d+)/.exec(text);
  return match ? parseInt(match[1], 10) : 0;
}

function createTallyElement(): HTMLElement {
  const tally = document.createElement('span');
  tally.className = TALLY_CLASS_NAME;
  tally.setAttribute(PROGRAMMATICALLY_ADDED_ELEMENT_ATTRIBUTE_NAME, 'true');
  applyTallyStyles(tally);
  return tally;
}

function applyTallyStyles(tally: HTMLElement): void {
  tally.style.flex = '0 0 auto';
  tally.style.alignSelf = 'flex-end';
  tally.style.padding = '4px 8px';
  tally.style.margin = '0';
  tally.style.fontFamily = "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  tally.style.fontSize = '12px';
  tally.style.color = 'inherit';
  tally.style.backgroundColor = 'inherit';
  tally.style.opacity = '0.7';
  tally.style.pointerEvents = 'none';
  tally.style.whiteSpace = 'nowrap';
}

function updateTallyText(tally: HTMLElement, count: number): void {
  tally.textContent = `${count.toString()} annotation(s)`;
}
