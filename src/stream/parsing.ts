import z from 'zod';

// Requires input with the following format:
// { key: [{...}, {...}, ...] }
export const parseListOfObjectsFromStream = <ListElement>(
  parser: z.ZodSchema<ListElement>,
  onElement: (element: ListElement) => void,
) => {
  let currentChunk: string[] = [];
  let isInList = false;
  let bracketDepth = 0;

  return (chunk: string) => {
    for (const char of chunk) {
      if (isInList && char === '{') {
        bracketDepth++;
      }

      if (isInList && char === '}') {
        bracketDepth--;
      }

      if (isInList && char === ',' && bracketDepth === 0) {
        const raw = currentChunk.join('');
        const element = parser.parse(JSON.parse(raw));

        onElement(element);
        currentChunk = [];
      }

      if (isInList && !(char === ',' && bracketDepth === 0)) {
        currentChunk.push(char);
      }

      if (char === '[') {
        isInList = true;
      }
    }
  };
};
