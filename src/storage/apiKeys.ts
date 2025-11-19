import { storage } from './storage';
import { APIConfig, APIProvider, OpenRouterAPIConfig, CustomAPIConfig } from './types';

export const DEFAULT_MODEL = 'x-ai/grok-4-fast';
export const OPEN_ROUTER_API_URL = 'https://openrouter.ai/api/v1';

const DEV_ENVIRONMENT_API_KEYS = {
  OPEN_ROUTER: import.meta.env.VITE_OPEN_ROUTER_API_KEY,
} as const;

function isValidCustomAPIConfig(config: CustomAPIConfig | undefined): config is CustomAPIConfig {
  if (!config) {
    return false;
  }

  return !!(config.model && config.url && config.key);
}

function isValidOpenRouterAPIConfig(config: OpenRouterAPIConfig | undefined): config is OpenRouterAPIConfig {
  if (!config) {
    return false;
  }

  return !!config.key;
}

export async function getAPIKeyConfig(): Promise<APIConfig | undefined> {
  const provider = await storage.apiProvider.get();

  const openRouterApiConfig = await storage.openRouterApiConfig.get();
  const customApiConfig = await storage.customApiConfig.get();

  const devEnvironmentConfig = {
    model: DEFAULT_MODEL,
    url: OPEN_ROUTER_API_URL,
    key: DEV_ENVIRONMENT_API_KEYS.OPEN_ROUTER,
  };

  if (!provider) {
    return devEnvironmentConfig;
  }

  if (provider === APIProvider.OPEN_ROUTER && isValidOpenRouterAPIConfig(openRouterApiConfig)) {
    return {
      model: DEFAULT_MODEL,
      url: OPEN_ROUTER_API_URL,
      key: openRouterApiConfig.key,
    };
  }

  if (provider === APIProvider.CUSTOM && isValidCustomAPIConfig(customApiConfig)) {
    return customApiConfig;
  }

  return devEnvironmentConfig;
}
