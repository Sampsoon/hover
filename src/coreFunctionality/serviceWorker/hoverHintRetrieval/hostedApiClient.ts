import type { HoverHint, StreamMessage } from '@hover/shared';
import { isHintMessage, isErrorMessage } from '@hover/shared';
import { HOSTED_API_URL } from '../../../storage';

function parseNDJSONLine(
  line: string,
  onHoverHint: (hint: HoverHint) => void,
  onError: (message: string) => void,
): void {
  if (!line.trim()) {
    return;
  }

  try {
    const message = JSON.parse(line) as StreamMessage;

    if (isHintMessage(message)) {
      onHoverHint(message.data);
    } else if (isErrorMessage(message)) {
      onError(message.message);
    }
  } catch {
    console.error('Failed to parse NDJSON line:', line);
  }
}

export async function fetchHoverHintsFromHostedApi(
  cleanedHtml: string,
  googleToken: string,
  onHoverHint: (hint: HoverHint) => void,
  onError: (message: string) => void,
): Promise<void> {
  const response = await fetch(HOSTED_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cleanedHtml, googleToken }),
  });

  if (!response.ok) {
    let errorMessage = 'API request failed';

    try {
      const errorBody = (await response.json()) as { error?: string };
      errorMessage = errorBody.error ?? errorMessage;
    } catch {
      // Ignore JSON parse errors
    }

    throw new Error(errorMessage);
  }

  if (!response.body) {
    throw new Error('No response body');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  let result = await reader.read();

  while (!result.done) {
    buffer += decoder.decode(result.value, { stream: true });

    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      parseNDJSONLine(line, onHoverHint, onError);
    }

    result = await reader.read();
  }

  parseNDJSONLine(buffer, onHoverHint, onError);
}
