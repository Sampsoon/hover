import { Json } from '../shared';

export interface CustomAPIConfig {
  model: string;
  url: string;
  key: string;
  additionalArguments?: Json;
}

export interface OpenRouterAPIConfig {
  key: string;
}

export type APIConfig = CustomAPIConfig;

export enum APIProvider {
  OPEN_ROUTER = 'OpenRouter',
  CUSTOM = 'Custom',
}

export type SettingsTab = 'api' | 'websites' | 'contact';

export enum WebsiteFilterMode {
  ALLOW_ALL = 'allow-all',
  BLOCK_ALL = 'block-all',
}

export interface WebsiteFilterConfig {
  mode: WebsiteFilterMode;
  blockList: string[];
  allowList: string[];
}

export const DEFAULT_WEBSITE_FILTER_CONFIG: WebsiteFilterConfig = {
  mode: WebsiteFilterMode.ALLOW_ALL,
  blockList: [],
  allowList: [],
};
