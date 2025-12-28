import z from 'zod';

// Requires input with the following format:
// { key: [{...}, {...}, ...] }
export function parseListOfObjectsFromStream<ListElement>(
  parser: z.ZodSchema<ListElement>,
  onElement: (element: ListElement) => void,
) {
  let currentChunk: string[] = [];
  let isInList = false;
  let bracketDepth = 0;

  return (chunk: string) => {
    for (const char of chunk) {
      if (!isInList && char === '[') {
        isInList = true;
        continue;
      }

      if (isInList && char === ',' && bracketDepth === 0) {
        const raw = currentChunk.join('');
        const element = parser.parse(JSON.parse(raw));

        onElement(element);
        currentChunk = [];
        continue;
      }

      if (isInList) {
        currentChunk.push(char);
      }

      if (isInList && char === '{') {
        bracketDepth++;
      }

      if (isInList && char === '}') {
        bracketDepth--;
      }
    }
  };
}

// Parses hover hint batch with remainingTokenCount
// Format: { "hoverHintList": [{...}, {...}], "remainingTokenCount": number }
export function parseHoverHintBatchFromStream<ListElement>(
  parser: z.ZodSchema<ListElement>,
  onElement: (element: ListElement) => void,
): { onChunk: (chunk: string) => void; getRemainingTokenCount: () => number } {
  let currentChunk: string[] = [];
  let isInList = false;
  let listEnded = false;
  let bracketDepth = 0;
  const fullBuffer: string[] = [];
  let remainingTokenCount = 0;

  const onChunk = (chunk: string) => {
    fullBuffer.push(chunk);

    for (const char of chunk) {
      if (!isInList && !listEnded && char === '[') {
        isInList = true;
        continue;
      }

      if (isInList && char === ']' && bracketDepth === 0) {
        // Parse any remaining element before the closing bracket
        const raw = currentChunk.join('').trim();
        if (raw.length > 0) {
          const element = parser.parse(JSON.parse(raw));
          onElement(element);
          currentChunk = [];
        }
        isInList = false;
        listEnded = true;
        continue;
      }

      if (isInList && char === ',' && bracketDepth === 0) {
        const raw = currentChunk.join('');
        const element = parser.parse(JSON.parse(raw));

        onElement(element);
        currentChunk = [];
        continue;
      }

      if (isInList) {
        currentChunk.push(char);
      }

      if (isInList && char === '{') {
        bracketDepth++;
      }

      if (isInList && char === '}') {
        bracketDepth--;
      }
    }

    // After list ends, check for remainingTokenCount in the accumulated buffer
    if (listEnded) {
      const fullText = fullBuffer.join('');
      const remainingMatch = /"remainingTokenCount"\s*:\s*(\d+)/.exec(fullText);
      if (remainingMatch) {
        remainingTokenCount = parseInt(remainingMatch[1], 10);
      }
    }
  };

  const getRemainingTokenCount = () => remainingTokenCount;

  return { onChunk, getRemainingTokenCount };
}
