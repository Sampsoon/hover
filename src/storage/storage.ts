import { CustomAPIConfig, APIProvider, OpenRouterAPIConfig } from './types';
import browser from 'webextension-polyfill';

function createStorageAccessors<T>(key: string) {
  return {
    get: async () => {
      const result = await browser.storage.local.get(key);
      return result[key] as T | undefined;
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
} as const;
