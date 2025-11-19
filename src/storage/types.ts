export interface CustomAPIConfig {
  model: string;
  url: string;
  key: string;
}

export interface OpenRouterAPIConfig {
  key: string;
}

export type APIConfig = CustomAPIConfig;

export enum APIProvider {
  OPEN_ROUTER = 'open router',
  CUSTOM = 'custom',
}
