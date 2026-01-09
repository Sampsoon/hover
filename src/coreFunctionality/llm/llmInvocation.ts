import { OpenAI } from 'openai';
import * as z from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { ChatCompletionCreateParams } from 'openai/resources.mjs';
import { getAPIKeyConfig, APIConfig, storage } from '../../storage';
import { Json } from '../../shared';
import { trackProviderRequest } from '../metrics';

export interface LlmParams {
  prompt: string;
  schema: z.ZodSchema;
}

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

export async function callLLM(input: string, llmParams: LlmParams, onChunk: (chunk: string) => void) {
  const config = await getAPIKeyConfig();

  // const provider = await storage.apiProvider.get();

  // void trackProviderRequest(provider, input.length);

  await callLLMWithConfig(input, llmParams, config, onChunk);
}
