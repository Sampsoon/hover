import OpenAI from 'openai';
import { createOpenRouterClientInterface } from './llmInvocation';
import { API_KEYS } from '../keys';

const openRouterClient = new OpenAI({
  apiKey: API_KEYS.OPEN_ROUTER,
  baseURL: 'https://openrouter.ai/api/v1',
});

export const callLLM = {
  OPEN_ROUTER: createOpenRouterClientInterface(openRouterClient, 'google/gemini-2.5-flash'),
} as const;
