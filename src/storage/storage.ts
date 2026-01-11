import { APIProvider } from '@hover/shared';
import {
  CustomAPIConfig,
  OpenRouterAPIConfig,
  GoogleAuthConfig,
  SettingsTab,
  WebsiteFilterConfig,
  DEFAULT_WEBSITE_FILTER_CONFIG,
  ThemeMode,
} from './types';
import browser from 'webextension-polyfill';

type OnChangeCallback<T> = (newValue: T, oldValue: T | undefined) => void;

function createStorageAccessors<T>(key: string): {
  get: () => Promise<T | undefined>;
  set: (value: T) => Promise<void>;
  remove: () => Promise<void>;
  onChange: (callback: OnChangeCallback<T | undefined>) => () => void;
};
function createStorageAccessors<T>(
  key: string,
  defaultValue: T,
): {
  get: () => Promise<T>;
  set: (value: T) => Promise<void>;
  remove: () => Promise<void>;
  onChange: (callback: OnChangeCallback<T>) => () => void;
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
    onChange: (callback: OnChangeCallback<T>) => {
      const listener = (changes: Record<string, browser.Storage.StorageChange>, areaName: string) => {
        if (areaName !== 'local') {
          return;
        }

        if (key in changes) {
          const newValue = (changes[key].newValue as T | undefined) ?? defaultValue;
          const oldValue = (changes[key].oldValue as T | undefined) ?? defaultValue;
          callback(newValue as T, oldValue);
        }
      };

      browser.storage.onChanged.addListener(listener);
      return () => {
        browser.storage.onChanged.removeListener(listener);
      };
    },
  };
}

export const storage = {
  openRouterApiConfig: createStorageAccessors<OpenRouterAPIConfig>('openRouterApiConfig'),
  customApiConfig: createStorageAccessors<CustomAPIConfig>('customApiConfig'),
  googleAuth: createStorageAccessors<GoogleAuthConfig>('googleAuth'),
  apiProvider: createStorageAccessors<APIProvider>('apiProvider'),
  selectedTab: createStorageAccessors<SettingsTab>('selectedTab'),
  websiteFilter: createStorageAccessors<WebsiteFilterConfig>('websiteFilter', DEFAULT_WEBSITE_FILTER_CONFIG),
  themeMode: createStorageAccessors<ThemeMode>('themeMode', ThemeMode.SYSTEM),
  visitorId: createStorageAccessors<string>('visitorId'),
  telemetryEnabled: createStorageAccessors<boolean>('telemetryEnabled', true),
} as const;
