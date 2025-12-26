import { Json } from '../shared';
import { storage } from './storage';
import { APIConfig, APIProvider, OpenRouterAPIConfig, CustomAPIConfig } from './types';
import { DEFAULT_MODEL, OPEN_ROUTER_API_URL } from './constants';

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
  thinking?: {
    type: 'enabled' | 'disabled';
    budget_tokens?: number;
    thinking_level?: 'minimal' | 'low' | 'medium' | 'high';
  };
}

export const OPEN_ROUTER_DEFAULT_PARAMS: OpenRouterChatCompletionCreateParams = {
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

function getDevEnvironmentApiKey() {
  const env = import.meta.env;
  return env.VITE_OPEN_ROUTER_API_KEY;
}

function isValidCustomAPIConfig(config: CustomAPIConfig | undefined): config is CustomAPIConfig {
  if (config?.model && config.url && config.key) {
    return true;
  }

  return false;
}

function isValidOpenRouterAPIConfig(config: OpenRouterAPIConfig | undefined): config is OpenRouterAPIConfig {
  if (config?.key) {
    return true;
  }

  return false;
}

export async function getAPIKeyConfig(): Promise<APIConfig> {
  const provider = await storage.apiProvider.get();

  const openRouterApiConfig = await storage.openRouterApiConfig.get();
  const customApiConfig = await storage.customApiConfig.get();

  const devEnvironmentConfig = {
    model: DEFAULT_MODEL,
    url: OPEN_ROUTER_API_URL,
    key: getDevEnvironmentApiKey(),
    additionalArguments: OPEN_ROUTER_DEFAULT_PARAMS,
  };

  if (!provider) {
    return devEnvironmentConfig;
  }

  if (provider === APIProvider.OPEN_ROUTER && isValidOpenRouterAPIConfig(openRouterApiConfig)) {
    return {
      model: DEFAULT_MODEL,
      url: OPEN_ROUTER_API_URL,
      key: openRouterApiConfig.key,
      additionalArguments: OPEN_ROUTER_DEFAULT_PARAMS,
    };
  }

  if (provider === APIProvider.CUSTOM && isValidCustomAPIConfig(customApiConfig)) {
    return customApiConfig;
  }

  return devEnvironmentConfig;
}
