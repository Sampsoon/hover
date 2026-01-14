export type Json = Record<string, unknown>;

export interface APIConfig {
  model: string;
  url: string;
  key: string;
  additionalArguments?: Json;
}

export enum APIProvider {
  HOSTED_API = 'HostedAPI',
  OPEN_ROUTER = 'OpenRouter',
  CUSTOM = 'Custom',
}

export function isAPIProvider(provider: string): provider is APIProvider {
  return Object.values(APIProvider).includes(provider as APIProvider);
}
