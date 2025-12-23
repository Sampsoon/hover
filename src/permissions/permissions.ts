import browser from 'webextension-polyfill';
import { WebsiteFilterConfig, WebsiteFilterMode } from '../storage';
import { ContentScriptMatchConfig } from './types';

export function getMatchConfigFromWebsiteFilter(config: WebsiteFilterConfig): ContentScriptMatchConfig {
  if (config.mode === WebsiteFilterMode.ALLOW_ALL) {
    return {
      matches: ['<all_urls>'],
      excludeMatches: config.blockList,
    };
  }
  return {
    matches: config.allowList,
    excludeMatches: [],
  };
}

let isRequesting = false;

export async function requestPermissionsForMatchConfig(matchConfig: ContentScriptMatchConfig): Promise<boolean> {
  if (matchConfig.matches.length === 0) {
    return true;
  }

  if (isRequesting) {
    return false;
  }

  isRequesting = true;
  try {
    const result = await browser.permissions.request({ origins: matchConfig.matches });
    return result;
  } finally {
    isRequesting = false;
  }
}

export async function revokePermissions(origins: string[]): Promise<boolean> {
  if (origins.length === 0) {
    return true;
  }

  return await browser.permissions.remove({ origins });
}
