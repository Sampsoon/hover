import { CODE_TOKEN_ID_NAME, CodeTokenId, IdMappings } from '../htmlProcessing';
import { renderDocumentationAsHtml } from './rendering';
import { applyHoverHintStyle, hideElement, styleTooltipToMatchCodeBlock } from './styles';
import { updateTallyDisplay } from './tallyDisplay';
import type { HoverHint } from '@hover/shared';
import { NO_TIMEOUT_ACTIVE, TimeoutId, NoTimeoutActive, HoverHintState } from './types';

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
    hoverHintMap: new Map<CodeTokenId, string>(),
    tooltip: createTooltip(),
    timeoutId: NO_TIMEOUT_ACTIVE,
    currentCodeBlockId: undefined,
    lastStyleComputedAt: 0,
  };
}

export function setupHoverHintTriggers(
  element_to_listen_on: Document | HTMLElement,
  idMappings: IdMappings,
  state: HoverHintState,
) {
  element_to_listen_on.addEventListener(
    MOUSE_EVENTS.MOUSE_ENTER,
    (event) => {
      onMouseEnterCodeToken(event as MouseEvent, idMappings, state);
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

export function attachHoverHint(hoverHint: HoverHint, state: HoverHintState, idMappings: IdMappings) {
  const { ids, documentation } = hoverHint;
  const { parentCodeBlockMap } = idMappings;

  const renderedHtml = renderDocumentationAsHtml(documentation, { idMappings });

  if (!renderedHtml) {
    return;
  }

  if (ids.length > 0) {
    const parentCodeBlock = parentCodeBlockMap.get(ids[0]);
    if (parentCodeBlock) {
      updateTallyDisplay(parentCodeBlock.container, ids.length);
    }
  }

  ids.forEach((id) => {
    state.hoverHintMap.set(id, renderedHtml);
  });
}

function isHTMLElement(target: EventTarget | null): target is HTMLElement {
  return target instanceof HTMLElement;
}

function onMouseEnterCodeToken(event: MouseEvent, idMappings: IdMappings, state: HoverHintState) {
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
    showTooltip(renderedHtml, event, state, idMappings, tokenId);
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
  tooltip.className = 'hover-tooltip';
  applyHoverHintStyle(tooltip.style);
  hideElement(tooltip);

  document.body.appendChild(tooltip);
  return tooltip;
}

function showTooltip(
  html: string,
  event: MouseEvent,
  state: HoverHintState,
  idMappings: IdMappings,
  tokenId: CodeTokenId,
) {
  state.tooltip.innerHTML = html;

  positionTooltip(state.tooltip, event.target as HTMLElement);
  styleTooltipToMatchCodeBlock(state.tooltip, idMappings, state, tokenId);

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
