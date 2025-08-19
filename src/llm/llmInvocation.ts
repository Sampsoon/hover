import { OpenAI } from 'openai';
import * as z from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { ChatCompletionCreateParams } from 'openai/resources.mjs';

export interface LlmParams {
  prompt: string;
  schema: z.ZodSchema;
}

type OpenRouterChatCompletionCreateParams = ChatCompletionCreateParams & {
  provider?: {
    sort?: string;
    require_parameters?: boolean;
  };
  thinking?: {
    type: 'enabled' | 'disabled';
  };
};

const invokeOpenRouterClient = async (
  client: OpenAI,
  params: OpenRouterChatCompletionCreateParams,
  onChunk: (chunk: string) => void,
) => {
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
};

export const createOpenRouterClientInterface = (client: OpenAI, model: string) => {
  return async (input: string, llmParams: LlmParams, onChunk: (chunk: string) => void) => {
    const { prompt, schema } = llmParams;

    const jsonSchema = zodToJsonSchema(schema);

    const params: OpenRouterChatCompletionCreateParams = {
      model,
      provider: {
        sort: 'throughput',
        require_parameters: true,
      },
      thinking: {
        type: 'disabled',
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

    await invokeOpenRouterClient(client, params, onChunk);
  };
};
