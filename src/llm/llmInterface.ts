import OpenAI from 'openai';
import { API_KEYS } from './tempApiKeys';
import { createOpenAiClientInterface } from './llmInvocation';

const openRouterClient = new OpenAI({
  apiKey: API_KEYS.OPEN_ROUTER,
  baseURL: 'https://openrouter.ai/api/v1',
});

export const callLLM = {
  OPEN_ROUTER: createOpenAiClientInterface(openRouterClient, 'google/gemini-2.5-flash'),
} as const;
