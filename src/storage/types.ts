import type { Json } from '../shared';

export interface CustomAPIConfig {
  model: string;
  url: string;
  key: string;
  additionalArguments?: Json;
}

export interface OpenRouterAPIConfig {
  key: string;
}

export interface GoogleAuthConfig {
  googleToken?: string;
  userEmail?: string;
  expiresAt?: number;
}

export type APIConfig = CustomAPIConfig;

export enum SettingsTab {
  API = 'api',
  WEBSITES = 'websites',
  PRIVACY = 'privacy',
}

export const TAB_QUERY_PARAM = 'tab';

export enum WebsiteFilterMode {
  ALLOW_ALL = 'allow-all',
  BLOCK_ALL = 'block-all',
}

export interface WebsiteFilterConfig {
  mode: WebsiteFilterMode;
  blockList: string[]; // Sites to block when in ALLOW_ALL mode
  allowList: string[]; // Sites to allow when in BLOCK_ALL mode
}

export const DEFAULT_WEBSITE_FILTER_CONFIG: WebsiteFilterConfig = {
  mode: WebsiteFilterMode.BLOCK_ALL,
  blockList: [],
  allowList: [],
};

export enum ThemeMode {
  LIGHT = 'light',
  DARK = 'dark',
  SYSTEM = 'system',
}
