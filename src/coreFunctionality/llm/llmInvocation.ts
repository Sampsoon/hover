import { callLLMWithConfig, type LlmParams } from '@hover/shared';
import { getAPIKeyConfig } from '../../storage';

export async function callLLM(input: string, llmParams: LlmParams, onChunk: (chunk: string) => void) {
  const config = await getAPIKeyConfig();
  await callLLMWithConfig(input, llmParams, config, onChunk);
}
