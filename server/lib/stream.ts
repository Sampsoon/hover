import type { VercelResponse } from '@vercel/node';
import type { HoverHint, StreamMessage } from '@hover/shared';

export function initializeStreamResponse(response: VercelResponse): void {
  response.setHeader('Content-Type', 'application/x-ndjson');
  response.setHeader('Transfer-Encoding', 'chunked');
  response.setHeader('Cache-Control', 'no-cache');
  response.setHeader('Connection', 'keep-alive');
}

function writeNDJSON(response: VercelResponse, message: StreamMessage): void {
  response.write(JSON.stringify(message) + '\n');
}

export function writeHint(response: VercelResponse, hint: HoverHint): void {
  writeNDJSON(response, { type: 'hint', data: hint });
}

export function writeError(response: VercelResponse, message: string): void {
  writeNDJSON(response, { type: 'error', message });
}

export function writeComplete(response: VercelResponse, totalHints: number): void {
  writeNDJSON(response, { type: 'complete', totalHints });
}
