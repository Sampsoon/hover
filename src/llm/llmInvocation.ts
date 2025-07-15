import { OpenAI } from 'openai';
import * as z from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { ChatCompletionCreateParams, ChatCompletionCreateParamsNonStreaming } from 'openai/resources.mjs';

export interface LlmParams {
  prompt: string;
  schema: z.ZodSchema;
}

const invokeOpenAiClient = async (
  client: OpenAI,
  params: ChatCompletionCreateParamsNonStreaming,
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

export const createOpenAiClientInterface = (client: OpenAI, model: string) => {
  return async (input: string, llmParams: LlmParams, onChunk: (chunk: string) => void) => {
    const { prompt, schema } = llmParams;

    const jsonSchema = zodToJsonSchema(schema);

    const params: ChatCompletionCreateParams = {
      model,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: input,
            },
          ],
        },
        {
          role: 'system',
          content: prompt,
        },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'extracted_json_data',
          schema: jsonSchema,
        },
      },
    };

    await invokeOpenAiClient(client, params, onChunk);
  };
};
