import { callLLMViaOpenRouter } from './llmInvocation';

export const callLLM = {
  OPEN_ROUTER: callLLMViaOpenRouter,
} as const;
