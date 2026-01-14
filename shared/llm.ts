import { OpenAI } from 'openai';
import type * as z from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import type { ChatCompletionCreateParams } from 'openai/resources.mjs';
import type { APIConfig, Json } from './types';

export interface LlmParams {
  prompt: string;
  schema: z.ZodSchema;
}

const MAX_RETRIES = 5;
const RETRY_DELAY = 1000;

async function invokeOpenRouterClient(
  client: OpenAI,
  params: Json & ChatCompletionCreateParams,
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

export async function callLLMWithConfig(
  input: string,
  llmParams: LlmParams,
  config: APIConfig,
  onChunk: (chunk: string) => void,
) {
  const { prompt, schema } = llmParams;

  const jsonSchema = zodToJsonSchema(schema);

  const client = new OpenAI({
    apiKey: config.key,
    baseURL: config.url,
  });

  const params: Json & ChatCompletionCreateParams = {
    model: config.model,
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
    ...(config.additionalArguments ?? {}),
  };

  await invokeOpenRouterClient(client, params, onChunk);
}

export async function callLLMWithRetry(
  input: string,
  llmParams: LlmParams,
  config: APIConfig,
  onChunk: (chunk: string) => void,
): Promise<void> {
  let currentRetryDelay = RETRY_DELAY;

  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      await callLLMWithConfig(input, llmParams, config, onChunk);
      return;
    } catch (error) {
      console.error('Error retrieving annotations', error);
      if (i === MAX_RETRIES - 1) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, currentRetryDelay));
      currentRetryDelay *= 2;
    }
  }
}
