import type { APIConfig, Json } from '@hover/shared';

interface OpenRouterChatCompletionCreateParams extends Json {
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

const OPEN_ROUTER_DEFAULT_PARAMS: OpenRouterChatCompletionCreateParams = {
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

export const HOSTED_API_CONFIG: APIConfig = {
  model: 'google/gemini-3-flash-preview',
  url: 'https://openrouter.ai/api/v1',
  key: process.env.OPENROUTER_API_KEY ?? '',
  additionalArguments: OPEN_ROUTER_DEFAULT_PARAMS,
};

export const QUOTA_CONFIG = {
  weeklyInputCharLimit: 250_000_000,
  weeklyOutputCharLimit: 100_000_000,
};

export const MAX_HTML_SIZE = 500_000;
