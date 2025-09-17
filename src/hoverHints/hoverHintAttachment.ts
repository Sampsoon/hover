import { CODE_TOKEN_ID_NAME, Id, IdToCodeTokenMap } from '../htmlProcessing';
import { renderDocumentationAsHtml } from './rendering';
import { applyHoverHintStyle, hideElement } from './styles';
import { NO_TIMEOUT_ACTIVE, TimeoutId, NoTimeoutActive, HoverHintState, HoverHint } from './types';

const MOUSE_EVENTS = {
  MOUSE_ENTER: 'mouseenter',
  MOUSE_LEAVE: 'mouseleave',
} as const;

function isNoTimeoutActive(timeoutId: TimeoutId): timeoutId is NoTimeoutActive {
  return timeoutId === NO_TIMEOUT_ACTIVE;
}

function clearTimeoutIfActive(state: HoverHintState) {
  if (!isNoTimeoutActive(state.timeoutId)) {
    clearTimeout(state.timeoutId);
    state.timeoutId = NO_TIMEOUT_ACTIVE;
  }
}

export function setupHoverHintState(): HoverHintState {
  return {
    hoverHintMap: new Map<Id, string>(),
    tooltip: createTooltip(),
    timeoutId: NO_TIMEOUT_ACTIVE,
  };
}

export function setupHoverHintTriggers(element_to_listen_on: Document | HTMLElement, state: HoverHintState) {
  element_to_listen_on.addEventListener(
    MOUSE_EVENTS.MOUSE_ENTER,
    (event) => {
      onMouseEnterCodeToken(event as MouseEvent, state);
    },
    true,
  );

  element_to_listen_on.addEventListener(
    MOUSE_EVENTS.MOUSE_LEAVE,
    (event) => {
      onMouseLeaveCodeToken(event as MouseEvent, state);
    },
    true,
  );
}

export function attachHoverHint(hoverHint: HoverHint, state: HoverHintState, idToCodeTokenMap: IdToCodeTokenMap) {
  const { ids, documentation } = hoverHint;
  const renderedHtml = renderDocumentationAsHtml(documentation);

  if (!renderedHtml) {
    return;
  }

  ids.forEach((id) => {
    state.hoverHintMap.set(id, renderedHtml);

    const codeToken = idToCodeTokenMap.get(id);
    if (codeToken) {
      addEffectToCodeToken(codeToken);
    } else {
      console.error(`Code token with id ${id} not found in idToCodeTokenMap`);
    }
  });
}

function addEffectToCodeToken(htmlElement: HTMLElement) {
  htmlElement.style.textDecoration = 'underline dotted';
}

function isHTMLElement(target: EventTarget | null): target is HTMLElement {
  return target instanceof HTMLElement;
}

function onMouseEnterCodeToken(event: MouseEvent, state: HoverHintState) {
  const target = event.target;

  if (!isHTMLElement(target)) {
    return;
  }

  const tokenId = target.dataset[CODE_TOKEN_ID_NAME];

  if (!tokenId || !state.hoverHintMap.has(tokenId)) {
    return;
  }

  clearTimeoutIfActive(state);

  const renderedHtml = state.hoverHintMap.get(tokenId);

  if (renderedHtml) {
    showTooltip(renderedHtml, event, state);
  }
}

function onMouseLeaveCodeToken(event: MouseEvent, state: HoverHintState) {
  const target = event.target;

  if (!isHTMLElement(target)) {
    return;
  }

  const tokenId = target.dataset[CODE_TOKEN_ID_NAME];

  if (!tokenId || !state.hoverHintMap.has(tokenId)) {
    return;
  }

  clearTimeoutIfActive(state);

  setHideTooltipTimeout(state);
}

function createTooltip(): HTMLElement {
  const tooltip = document.createElement('div');
  tooltip.className = 'vibey-tooltip';
  applyHoverHintStyle(tooltip.style);
  hideElement(tooltip);

  document.body.appendChild(tooltip);
  return tooltip;
}

function showTooltip(html: string, event: MouseEvent, state: HoverHintState) {
  state.tooltip.innerHTML = html;
  positionTooltip(state.tooltip, event.target as HTMLElement);
  state.tooltip.style.display = 'block';
}

function setHideTooltipTimeout(state: HoverHintState) {
  state.timeoutId = window.setTimeout(() => {
    state.tooltip.style.display = 'none';
  }, 300);
}

function positionTooltip(tooltip: HTMLElement, element: HTMLElement) {
  const PADDING = 10;

  const { innerWidth: viewportWidth, innerHeight: viewportHeight } = window;

  const elementRect = element.getBoundingClientRect();

  let left = elementRect.left;
  let top = elementRect.bottom + PADDING;

  const { tooltipWidth, tooltipHeight } = getTooltipDimensions(tooltip);

  if (left + tooltipWidth > viewportWidth) {
    left = elementRect.right - tooltipWidth;
  }

  if (top + tooltipHeight > viewportHeight) {
    top = elementRect.top - tooltipHeight - PADDING;
  }

  left = Math.max(PADDING, Math.min(left, viewportWidth - tooltipWidth - PADDING));
  top = Math.max(PADDING, Math.min(top, viewportHeight - tooltipHeight - PADDING));

  tooltip.style.left = `${left.toString()}px`;
  tooltip.style.top = `${top.toString()}px`;
}

function getTooltipDimensions(tooltip: HTMLElement) {
  const originalDisplay = tooltip.style.display;
  const originalVisibility = tooltip.style.visibility;

  tooltip.style.visibility = 'hidden';
  tooltip.style.display = 'block';

  const { width: tooltipWidth, height: tooltipHeight } = tooltip.getBoundingClientRect();

  tooltip.style.display = originalDisplay;
  tooltip.style.visibility = originalVisibility;

  return { tooltipWidth, tooltipHeight };
}
