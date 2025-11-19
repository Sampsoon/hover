import { useState, useEffect } from 'react';
import { RadioOption } from './RadioOption';
import { Input } from './Input';
import { PasswordInput } from './PasswordInput';
import { CodeExample } from './CodeExample';
import { DEFAULT_MODEL, OPEN_ROUTER_API_URL, storage, APIProvider } from '../../storage';
import { fieldLabelStyle } from './styles';

const OPEN_ROUTER_API_KEY_URL = 'https://openrouter.ai/keys';

async function processOpenRouterConfigChange(openRouterKey: string) {
  await storage.openRouterApiConfig.set({
    key: openRouterKey,
  });
}

async function processCustomConfigChange(customModel: string, customUrl: string, customKey: string) {
  await storage.customApiConfig.set({
    model: customModel,
    url: customUrl,
    key: customKey,
  });
}

async function processProviderChange(provider: APIProvider) {
  await storage.apiProvider.set(provider);
}

function createDebounce(func: () => Promise<void>, delay = 500) {
  const timeoutId = setTimeout(() => {
    void func();
  }, delay);

  return () => {
    clearTimeout(timeoutId);
  };
}

export function ApiConfiguration() {
  const [selectedProvider, setSelectedProvider] = useState<APIProvider>(APIProvider.OPEN_ROUTER);

  const [openRouterKey, setOpenRouterKey] = useState('');

  const [customModel, setCustomModel] = useState('');
  const [customUrl, setCustomUrl] = useState('');
  const [customKey, setCustomKey] = useState('');

  useEffect(() => {
    const loadConfig = async () => {
      const openRouterApiConfig = await storage.openRouterApiConfig.get();
      const customApiConfig = await storage.customApiConfig.get();
      const apiProvider = await storage.apiProvider.get();

      if (apiProvider) {
        setSelectedProvider(apiProvider);
      }

      if (openRouterApiConfig?.key) {
        setOpenRouterKey(openRouterApiConfig.key);
      }

      if (customApiConfig) {
        setCustomModel(customApiConfig.model);
        setCustomUrl(customApiConfig.url);
        setCustomKey(customApiConfig.key);
      }
    };
    void loadConfig();
  }, []);

  const [showCustomKey, setShowCustomKey] = useState(false);

  useEffect(() => {
    return createDebounce(() => processOpenRouterConfigChange(openRouterKey));
  }, [openRouterKey]);

  useEffect(() => {
    return createDebounce(() => processCustomConfigChange(customModel, customUrl, customKey));
  }, [customModel, customUrl, customKey]);

  useEffect(() => {
    return createDebounce(() => processProviderChange(selectedProvider));
  }, [selectedProvider]);

  return (
    <div>
      <RadioOption
        id="open router"
        label="Open Router"
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
        <div style={{ marginBottom: '12px' }}>
          <label style={fieldLabelStyle}>Model</label>
          <Input
            type="text"
            placeholder={DEFAULT_MODEL}
            value={customModel}
            onChange={(val: string) => {
              setCustomModel(val);
            }}
          />
        </div>
        <div style={{ marginBottom: '12px' }}>
          <label style={fieldLabelStyle}>API URL</label>
          <Input
            type="text"
            placeholder={OPEN_ROUTER_API_URL}
            value={customUrl}
            onChange={(val: string) => {
              setCustomUrl(val);
            }}
          />
        </div>
        <div style={{ marginBottom: '12px' }}>
          <label style={fieldLabelStyle}>API Key</label>
          <PasswordInput
            placeholder="Your API key"
            value={customKey}
            onChange={(val: string) => {
              setCustomKey(val);
            }}
            onShowChange={setShowCustomKey}
          />
        </div>
        <CodeExample
          apiKey={showCustomKey ? customKey : customKey ? '•'.repeat(customKey.length) : ''}
          baseURL={customUrl}
          model={customModel}
        />
      </RadioOption>
    </div>
  );
}
