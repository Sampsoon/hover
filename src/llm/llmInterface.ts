import OpenAI from 'openai';
import { API_KEYS } from './tempApiKeys';
import { createOpenAiClientStructuredOutputInterface } from './llmInvocation';

const openAiClient = new OpenAI({
  apiKey: API_KEYS.OPENAI,
});

const geminiClient = new OpenAI({
  apiKey: API_KEYS.GEMINI,
  baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
});

const openRouterClient = new OpenAI({
  apiKey: API_KEYS.OPEN_ROUTER,
  baseURL: 'https://openrouter.ai/api/v1',
});

export const enum STRUCTURED_OUTPUT_LLM_CALLS {
  GPT_4_1 = 'GPT_4_1_STRUCTURED_OUTPUT',
  GEMINI_2_5_FLASH = 'GEMINI_2_5_FLASH_STRUCTURED_OUTPUT',
  OPEN_ROUTER_STRUCTURED_OUTPUT = 'OPEN_ROUTER_STRUCTURED_OUTPUT',
}

export const callLLM = {
  [STRUCTURED_OUTPUT_LLM_CALLS.GPT_4_1]: createOpenAiClientStructuredOutputInterface(
    openAiClient,
    'gpt-4.1-2025-04-14',
  ),
  [STRUCTURED_OUTPUT_LLM_CALLS.GEMINI_2_5_FLASH]: createOpenAiClientStructuredOutputInterface(
    geminiClient,
    'gemini-2.5-flash',
  ),
  [STRUCTURED_OUTPUT_LLM_CALLS.OPEN_ROUTER_STRUCTURED_OUTPUT]: createOpenAiClientStructuredOutputInterface(
    openRouterClient,
    'google/gemini-2.5-flash-preview-05-20',
  ),
} as const;
