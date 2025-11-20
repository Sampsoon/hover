export interface CustomAPIConfig {
  model: string;
  url: string;
  key: string;
  additionalArguments?: Record<string, unknown>;
}

export interface OpenRouterAPIConfig {
  key: string;
}

export type APIConfig = CustomAPIConfig;

export enum APIProvider {
  OPEN_ROUTER = 'OpenRouter',
  CUSTOM = 'Custom',
}
