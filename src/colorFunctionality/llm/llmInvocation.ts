import { OpenAI } from 'openai';
import * as z from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { ChatCompletionCreateParams } from 'openai/resources.mjs';
import { getAPIKeyConfig } from '../../storage';
import { Json } from '../../shared';

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

export async function callLLM(input: string, llmParams: LlmParams, onChunk: (chunk: string) => void) {
  const { prompt, schema } = llmParams;

  const jsonSchema = zodToJsonSchema(schema);

  const apiKeyConfig = await getAPIKeyConfig();

  const client = new OpenAI({
    apiKey: apiKeyConfig.key,
    baseURL: apiKeyConfig.url,
  });

  const params: Json & ChatCompletionCreateParams = {
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
    ...apiKeyConfig.additionalArguments,
  };

  await invokeOpenRouterClient(client, params, onChunk);
}
