import { CODE_TOKEN_ID_NAME } from '../htmlProcessing';
import { HoverHintList, NO_TIMEOUT_ACTIVE, TimeoutId, NoTimeoutActive, HoverHintState } from './types';

const MOUSE_EVENTS = {
  MOUSE_ENTER: 'mouseenter',
  MOUSE_LEAVE: 'mouseleave',
} as const;

const isNoTimeoutActive = (timeoutId: TimeoutId): timeoutId is NoTimeoutActive => {
  return timeoutId === NO_TIMEOUT_ACTIVE;
};

const clearTimeoutIfActive = (state: HoverHintState) => {
  if (!isNoTimeoutActive(state.timeoutId)) {
    clearTimeout(state.timeoutId);
    state.timeoutId = NO_TIMEOUT_ACTIVE;
  }
};

export const setupHoverHintState = (): HoverHintState => {
  return {
    hoverHintMap: new Map<string, string>(),
    tooltip: createTooltip(),
    timeoutId: NO_TIMEOUT_ACTIVE,
  };
};

export const setupHoverHintTriggers = (element_to_listen_on: Document | HTMLElement, state: HoverHintState) => {
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
};

export const attachHoverHints = (hoverHintList: HoverHintList, state: HoverHintState) => {
  hoverHintList.hoverHintList.forEach((hint) => {
    const { tokenId, docInHtml } = hint;
    state.hoverHintMap.set(tokenId, docInHtml);
  });
};

const isHTMLElement = (target: EventTarget | null): target is HTMLElement => {
  return target instanceof HTMLElement;
};

const onMouseEnterCodeToken = (event: MouseEvent, state: HoverHintState) => {
  const target = event.target;

  if (!isHTMLElement(target)) {
    return;
  }

  const tokenId = target.dataset[CODE_TOKEN_ID_NAME];

  if (!tokenId || !state.hoverHintMap.has(tokenId)) {
    return;
  }

  clearTimeoutIfActive(state);

  const docContent = state.hoverHintMap.get(tokenId);

  if (docContent) {
    showTooltip(docContent, event, state);
  }
};

const onMouseLeaveCodeToken = (event: MouseEvent, state: HoverHintState) => {
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
};

const createTooltip = (): HTMLElement => {
  const tooltip = document.createElement('div');
  tooltip.className = 'vibey-tooltip';
  tooltip.style.cssText = `
      position: fixed;
      background: white;
      color: black;
      padding: 8px 12px;
      border-radius: 4px;
      max-width: 400px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
      z-index: 999999;
      display: none;
      pointer-events: none;
      border: 1px solid #ccc;
    `;

  document.body.appendChild(tooltip);
  return tooltip;
};

const showTooltip = (docContent: string, event: MouseEvent, state: HoverHintState) => {
  state.tooltip.innerHTML = docContent;
  positionTooltip(state.tooltip, event.target as HTMLElement);
  state.tooltip.style.display = 'block';
};

const setHideTooltipTimeout = (state: HoverHintState) => {
  state.timeoutId = window.setTimeout(() => {
    state.tooltip.style.display = 'none';
  }, 300);
};

const positionTooltip = (tooltip: HTMLElement, element: HTMLElement) => {
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
};

const getTooltipDimensions = (tooltip: HTMLElement) => {
  const originalDisplay = tooltip.style.display;
  const originalVisibility = tooltip.style.visibility;

  tooltip.style.visibility = 'hidden';
  tooltip.style.display = 'block';

  const { width: tooltipWidth, height: tooltipHeight } = tooltip.getBoundingClientRect();

  tooltip.style.display = originalDisplay;
  tooltip.style.visibility = originalVisibility;

  return { tooltipWidth, tooltipHeight };
};
