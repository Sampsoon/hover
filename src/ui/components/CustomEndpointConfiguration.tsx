import { useState, useEffect } from 'react';
import { Input } from './Input';
import { PasswordInput } from './PasswordInput';
import { CodeExample } from './CodeExample';
import { DEFAULT_MODEL, OPEN_ROUTER_API_URL, storage } from '../../storage';
import { fieldLabelStyle } from './styles';
import { createDebounce } from '../utils';

async function processCustomConfigChange(customModel: string, customUrl: string, customKey: string) {
  await storage.customApiConfig.set({
    model: customModel,
    url: customUrl,
    key: customKey,
  });
}

export function CustomEndpointConfiguration() {
  const [customModel, setCustomModel] = useState('');
  const [customUrl, setCustomUrl] = useState('');
  const [customKey, setCustomKey] = useState('');
  const [showCustomKey, setShowCustomKey] = useState(false);

  useEffect(() => {
    const loadConfig = async () => {
      const customApiConfig = await storage.customApiConfig.get();

      if (customApiConfig) {
        setCustomModel(customApiConfig.model);
        setCustomUrl(customApiConfig.url);
        setCustomKey(customApiConfig.key);
      }
    };
    void loadConfig();
  }, []);

  useEffect(() => {
    return createDebounce(() => processCustomConfigChange(customModel, customUrl, customKey));
  }, [customModel, customUrl, customKey]);

  return (
    <div>
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
    </div>
  );
}
