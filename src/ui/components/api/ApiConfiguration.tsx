import { useState, useEffect } from 'react';
import browser from 'webextension-polyfill';
import { RadioOption, PasswordInput, Button, fieldLabelStyle, SettingsIcon } from '../common';
import { storage, APIProvider } from '../../../storage';
import { createDebounce } from '../../utils';

const OPEN_ROUTER_API_KEY_URL = 'https://openrouter.ai/keys';

async function processOpenRouterConfigChange(openRouterKey: string) {
  await storage.openRouterApiConfig.set({
    key: openRouterKey,
  });
}

async function processProviderChange(provider: APIProvider) {
  await storage.apiProvider.set(provider);
}

export function ApiConfiguration() {
  const [selectedProvider, setSelectedProvider] = useState<APIProvider>(APIProvider.OPEN_ROUTER);
  const [openRouterKey, setOpenRouterKey] = useState('');

  useEffect(() => {
    const loadConfig = async () => {
      const openRouterApiConfig = await storage.openRouterApiConfig.get();
      const apiProvider = await storage.apiProvider.get();

      if (apiProvider) {
        setSelectedProvider(apiProvider);
      }

      if (openRouterApiConfig?.key) {
        setOpenRouterKey(openRouterApiConfig.key);
      }
    };
    void loadConfig();
  }, []);

  useEffect(() => {
    return createDebounce(() => processOpenRouterConfigChange(openRouterKey));
  }, [openRouterKey]);

  useEffect(() => {
    return createDebounce(() => processProviderChange(selectedProvider));
  }, [selectedProvider]);

  return (
    <div>
      <RadioOption
        id="openRouter"
        label="OpenRouter"
        selected={selectedProvider === APIProvider.OPEN_ROUTER}
        onSelect={() => {
          setSelectedProvider(APIProvider.OPEN_ROUTER);
        }}
      >
        <div style={{ marginBottom: '12px' }}>
          <label style={fieldLabelStyle}>
            API key{' '}
            <a
              href={OPEN_ROUTER_API_KEY_URL}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--primary-color)', textDecoration: 'none' }}
            >
              (click here to get one)
            </a>
          </label>
          <PasswordInput
            placeholder="Your API key"
            value={openRouterKey}
            onChange={(val: string) => {
              setOpenRouterKey(val);
            }}
          />
        </div>
      </RadioOption>

      <RadioOption
        id="custom"
        label="Custom Endpoint"
        selected={selectedProvider === APIProvider.CUSTOM}
        onSelect={() => {
          setSelectedProvider(APIProvider.CUSTOM);
        }}
      >
        <div style={{ padding: '12px 0', display: 'flex', alignItems: 'center' }}>
          <Button onClick={() => void browser.runtime.openOptionsPage()} icon={<SettingsIcon />}>
            Configure
          </Button>
        </div>
      </RadioOption>
    </div>
  );
}
