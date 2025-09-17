import { HoverHint } from '../hoverHints';

const enum StreamMessageType {
  HOVER_HINT_CHUNK = 'hoverHint',
  HOVER_HINT_ERROR = 'hoverHintError',
}

interface StreamMessage {
  type: StreamMessageType;
}

function isStreamMessage(message: unknown): message is StreamMessage {
  return typeof message === 'object' && message !== null && 'type' in message;
}

export interface HoverHintStreamMessage extends StreamMessage {
  type: StreamMessageType.HOVER_HINT_CHUNK;
  hoverHint: HoverHint;
}

export function isHoverHintStreamMessage(message: unknown): message is HoverHintStreamMessage {
  return isStreamMessage(message) && message.type === StreamMessageType.HOVER_HINT_CHUNK;
}

export function createHoverHintStreamMessage(hoverHint: HoverHint): HoverHintStreamMessage {
  return {
    type: StreamMessageType.HOVER_HINT_CHUNK,
    hoverHint,
  };
}

export interface HoverHintStreamError extends StreamMessage {
  type: StreamMessageType.HOVER_HINT_ERROR;
  errorMessage: string;
}

export function isHoverHintStreamError(message: unknown): message is HoverHintStreamError {
  return isStreamMessage(message) && message.type === StreamMessageType.HOVER_HINT_ERROR;
}

export function createHoverHintStreamError(errorMessage: string): HoverHintStreamError {
  return {
    type: StreamMessageType.HOVER_HINT_ERROR,
    errorMessage,
  };
}
