import {
  CustomAPIConfig,
  APIProvider,
  OpenRouterAPIConfig,
  SettingsTab,
  WebsiteFilterConfig,
  DEFAULT_WEBSITE_FILTER_CONFIG,
} from './types';
import browser from 'webextension-polyfill';

function createStorageAccessors<T>(key: string): {
  get: () => Promise<T | undefined>;
  set: (value: T) => Promise<void>;
  remove: () => Promise<void>;
};
function createStorageAccessors<T>(
  key: string,
  defaultValue: T,
): {
  get: () => Promise<T>;
  set: (value: T) => Promise<void>;
  remove: () => Promise<void>;
};
function createStorageAccessors<T>(key: string, defaultValue?: T) {
  return {
    get: async () => {
      const result = await browser.storage.local.get(key);
      return (result[key] as T | undefined) ?? defaultValue;
    },
    set: async (value: T) => {
      await browser.storage.local.set({ [key]: value });
    },
    remove: async () => {
      await browser.storage.local.remove(key);
    },
  };
}

export const storage = {
  openRouterApiConfig: createStorageAccessors<OpenRouterAPIConfig>('openRouterApiConfig'),
  customApiConfig: createStorageAccessors<CustomAPIConfig>('customApiConfig'),
  apiProvider: createStorageAccessors<APIProvider>('apiProvider'),
  selectedTab: createStorageAccessors<SettingsTab>('selectedTab'),
  websiteFilter: createStorageAccessors<WebsiteFilterConfig>('websiteFilter', DEFAULT_WEBSITE_FILTER_CONFIG),
} as const;
