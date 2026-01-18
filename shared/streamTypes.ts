import type { HoverHint } from './hoverHintSchema.js';

export interface HintMessage {
  type: 'hint';
  data: HoverHint;
}

export interface ErrorMessage {
  type: 'error';
  message: string;
}

export interface CompleteMessage {
  type: 'complete';
  totalHints: number;
}

export type StreamMessage = HintMessage | ErrorMessage | CompleteMessage;

export function isHintMessage(msg: StreamMessage): msg is HintMessage {
  return msg.type === 'hint';
}

export function isErrorMessage(msg: StreamMessage): msg is ErrorMessage {
  return msg.type === 'error';
}
