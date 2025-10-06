import { OpenAI } from 'openai';
import * as z from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { ChatCompletionCreateParams } from 'openai/resources.mjs';
import { API_KEYS } from '../keys';

const client = new OpenAI({
  apiKey: API_KEYS.OPEN_ROUTER,
  baseURL: 'https://openrouter.ai/api/v1',
});

export interface LlmParams {
  prompt: string;
  schema: z.ZodSchema;
}

type OpenRouterChatCompletionCreateParams = ChatCompletionCreateParams & {
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
};

async function invokeOpenRouterClient(params: OpenRouterChatCompletionCreateParams, onChunk: (chunk: string) => void) {
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

export async function callLLMViaOpenRouter(
  model: string,
  input: string,
  llmParams: LlmParams,
  onChunk: (chunk: string) => void,
) {
  const { prompt, schema } = llmParams;

  const jsonSchema = zodToJsonSchema(schema);

  const params: OpenRouterChatCompletionCreateParams = {
    model,
    provider: {
      sort: 'throughput',
      require_parameters: true,
    },
    reasoning: {
      exclude: true,
    },
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
        name: 'extracted_json_data',
        schema: jsonSchema,
      },
    },
  };

  await invokeOpenRouterClient(params, onChunk);
}
