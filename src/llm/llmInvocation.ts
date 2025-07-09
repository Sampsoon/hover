import { OpenAI } from 'openai';
import * as z from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { ChatCompletionCreateParams, ChatCompletionCreateParamsNonStreaming } from 'openai/resources.mjs';

const invokeOpenAiClient = async (client: OpenAI, params: ChatCompletionCreateParamsNonStreaming) => {
  const response = await client.chat.completions.create(params);

  const rawContent = response.choices[0]?.message?.content;

  if (!rawContent) {
    throw new Error('No content received from LLM');
  }

  return rawContent;
};

export const createOpenAiClientStructuredOutputInterface = (client: OpenAI, model: string) => {
  return async <T>(prompt: string, schema: z.ZodSchema<T>) => {
    const params: ChatCompletionCreateParams = {
      model,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: prompt,
            },
          ],
        },
      ],
    };

    const jsonSchema = zodToJsonSchema(schema);

    params.response_format = {
      type: 'json_schema',
      json_schema: {
        name: 'extracted_json_data',
        schema: jsonSchema,
      },
    };

    const rawContent = await invokeOpenAiClient(client, params);
    return schema.parse(JSON.parse(rawContent));
  };
};
