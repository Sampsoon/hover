import { OpenAI } from 'openai';
import * as z from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { ChatCompletionCreateParams } from 'openai/resources.mjs';
import { getAPIKeyConfig, OPEN_ROUTER_API_URL } from '../../storage';

export interface LlmParams {
  prompt: string;
  schema: z.ZodSchema;
}

interface OpenRouterChatCompletionCreateParams {
  provider?: {
    sort?: string;
    require_parameters?: boolean;
  };
  reasoning?: {
    effort?: 'high' | 'medium' | 'low';
    max_tokens?: number;
    exclude?: boolean;
    enabled?: boolean;
  };
}

async function invokeOpenRouterClient(
  client: OpenAI,
  params: OpenRouterChatCompletionCreateParams & ChatCompletionCreateParams,
  onChunk: (chunk: string) => void,
) {
  const response = await client.chat.completions.create({
    ...params,
    stream: true,
  });

  for await (const chunk of response) {
    const content = chunk.choices[0]?.delta?.content;

    if (content) {
      onChunk(content);
    }
  }
}

export async function callLLM(input: string, llmParams: LlmParams, onChunk: (chunk: string) => void) {
  const { prompt, schema } = llmParams;

  const jsonSchema = zodToJsonSchema(schema);

  const apiKeyConfig = await getAPIKeyConfig();

  if (!apiKeyConfig) {
    throw new Error('No API configuration found');
  }

  const client = new OpenAI({
    apiKey: apiKeyConfig.key,
    baseURL: apiKeyConfig.url,
  });

  const openRouterParams: OpenRouterChatCompletionCreateParams = {
    provider: {
      sort: 'throughput',
      require_parameters: true,
    },
    reasoning: {
      exclude: true,
      effort: 'low',
      enabled: false,
    },
  };

  const params: ChatCompletionCreateParams = {
    model: apiKeyConfig.model,
    messages: [
      {
        role: 'system',
        content: prompt,
      },
      {
        role: 'user',
        content: input,
      },
    ],
    response_format: {
      type: 'json_schema',
      json_schema: {
        strict: true,
        name: '',
        schema: jsonSchema,
      },
    },
  };

  const allParams = apiKeyConfig.url === OPEN_ROUTER_API_URL ? { ...openRouterParams, ...params } : params;

  await invokeOpenRouterClient(client, allParams, onChunk);
}
