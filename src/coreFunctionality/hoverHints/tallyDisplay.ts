import {
  CodeBlockId,
  CodeBlock,
  PROGRAMMATICALLY_ADDED_ELEMENT_ATTRIBUTE_NAME,
  TALLY_ATTRIBUTE_NAME,
} from '../htmlProcessing';

const TALLY_CLASS_NAME = 'vibey-tally';

export function updateTallyDisplay(
  codeBlock: CodeBlock,
  incrementBy: number,
  tallyElements: Map<CodeBlockId, HTMLElement>,
): void {
  const { codeBlockId, html: codeBlockElement } = codeBlock;

  let tally = tallyElements.get(codeBlockId);

  if (!tally) {
    tally = createTallyElement();
    tallyElements.set(codeBlockId, tally);
    insertTallyIntoCodeBlock(tally, codeBlockElement);
  }

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
  tally.dataset[TALLY_ATTRIBUTE_NAME] = 'true';
  applyTallyStyles(tally);
  return tally;
}

function applyTallyStyles(tally: HTMLElement): void {
  tally.style.position = 'sticky';
  tally.style.top = '0';
  tally.style.float = 'right';
  tally.style.padding = '0';
  tally.style.margin = '0';
  tally.style.fontFamily = "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  tally.style.fontSize = 'inherit';
  tally.style.color = 'inherit';
  tally.style.backgroundColor = 'inherit';
  tally.style.opacity = '0.7';
  tally.style.pointerEvents = 'none';
  tally.style.zIndex = '1';
  tally.style.whiteSpace = 'nowrap';
}

function insertTallyIntoCodeBlock(tally: HTMLElement, codeBlock: HTMLElement): void {
  codeBlock.insertBefore(tally, codeBlock.firstChild);
}

function updateTallyText(tally: HTMLElement, count: number): void {
  tally.textContent = `${count.toString()} annotation(s)`;
}
