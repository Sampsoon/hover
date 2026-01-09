import { useEffect, useState } from 'react';
import { AlertIcon, Input, PasswordInput, RadioOption, TextArea, fieldLabelStyle } from '../common';
import { DEFAULT_MODEL, OPEN_ROUTER_API_URL, OPEN_ROUTER_DEFAULT_PARAMS, storage } from '../../../storage';
import { APIProvider } from '@hover/shared';
import { createDebounce } from '../../utils';
import { Json } from '../../../shared';
import { ApiPreview } from './ApiPreview';

const OPEN_ROUTER_API_KEY_URL = 'https://openrouter.ai/keys';

function formatJson(json: Json | undefined): string {
  if (!json) {
    return '';
  }
  return JSON.stringify(json, null, 2);
}

function parseJsonOrUndefined(value: string): Json | undefined {
  try {
    return JSON.parse(value) as Json;
  } catch {
    return undefined;
  }
}

async function processOpenRouterConfigChange(openRouterKey: string) {
  await storage.openRouterApiConfig.set({
    key: openRouterKey,
  });
}

async function processProviderChange(provider: APIProvider) {
  await storage.apiProvider.set(provider);
}

async function processCustomConfigChange(
  customModel: string,
  customUrl: string,
  customKey: string,
  additionalArguments: Json | undefined,
) {
  await storage.customApiConfig.set({
    model: customModel,
    url: customUrl,
    key: customKey,
    additionalArguments: additionalArguments,
  });
}

function getAdditionalArgumentsRows(additionalArguments: Json): number {
  return formatJson(additionalArguments).split('\n').length;
}

export function ApiConfiguration() {
  const [selectedProvider, setSelectedProvider] = useState<APIProvider>(APIProvider.OPEN_ROUTER);
  const [openRouterKey, setOpenRouterKey] = useState('');
  const [customModel, setCustomModel] = useState('');
  const [customUrl, setCustomUrl] = useState('');
  const [customKey, setCustomKey] = useState('');
  const [additionalArguments, setAdditionalArguments] = useState<Json | undefined>(undefined);
  const [argumentsString, setArgumentsString] = useState('');
  const [showCustomKey, setShowCustomKey] = useState(false);
  const [isValidJson, setIsValidJson] = useState(true);

  useEffect(() => {
    const loadConfig = async () => {
      const openRouterApiConfig = await storage.openRouterApiConfig.get();
      const apiProvider = await storage.apiProvider.get();
      const customApiConfig = await storage.customApiConfig.get();

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

        if (customApiConfig.additionalArguments) {
          setAdditionalArguments(customApiConfig.additionalArguments);
          setArgumentsString(formatJson(customApiConfig.additionalArguments));
        }
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

  useEffect(() => {
    return createDebounce(() => processCustomConfigChange(customModel, customUrl, customKey, additionalArguments));
  }, [customModel, customUrl, customKey, additionalArguments]);

  const handleArgumentsChange = (value: string) => {
    const parsed = value.trim() === '' ? {} : parseJsonOrUndefined(value);

    if (!parsed) {
      setAdditionalArguments(undefined);
      setArgumentsString(value);
      setIsValidJson(false);
      return;
    }

    setIsValidJson(true);
    setAdditionalArguments(parsed);

    // The check for the number of keys is necessary because we don't want to auto format an empty object as
    // this will result in the string "{}".
    setArgumentsString(Object.keys(parsed).length > 0 ? formatJson(parsed) : value);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <RadioOption
        id="openRouter"
        label="OpenRouter"
        selected={selectedProvider === APIProvider.OPEN_ROUTER}
        onSelect={() => {
          setSelectedProvider(APIProvider.OPEN_ROUTER);
        }}
      >
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
      </RadioOption>

      <RadioOption
        id="custom"
        label="Custom Endpoint"
        selected={selectedProvider === APIProvider.CUSTOM}
        onSelect={() => {
          setSelectedProvider(APIProvider.CUSTOM);
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
              gap: '12px',
            }}
          >
            <div>
              <label style={fieldLabelStyle}>Model</label>
              <Input
                type="text"
                placeholder={DEFAULT_MODEL}
                value={customModel}
                onChange={(value: string) => {
                  setCustomModel(value);
                }}
              />
            </div>
            <div>
              <label style={fieldLabelStyle}>API URL</label>
              <Input
                type="text"
                placeholder={OPEN_ROUTER_API_URL}
                value={customUrl}
                onChange={(value: string) => {
                  setCustomUrl(value);
                }}
              />
            </div>
          </div>

          <div>
            <label style={fieldLabelStyle}>API Key</label>
            <PasswordInput
              placeholder="Your API key"
              value={customKey}
              onChange={(value: string) => {
                setCustomKey(value);
              }}
              onShowChange={setShowCustomKey}
            />
          </div>

          <div>
            <label style={fieldLabelStyle}>Additional Arguments</label>
            <TextArea
              placeholder={formatJson(OPEN_ROUTER_DEFAULT_PARAMS)}
              value={argumentsString}
              onChange={handleArgumentsChange}
              rows={getAdditionalArgumentsRows(OPEN_ROUTER_DEFAULT_PARAMS)}
            />
            {!isValidJson && (
              <div
                style={{
                  color: 'var(--alert-color)',
                  fontSize: '13px',
                  marginTop: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <AlertIcon width={14} height={14} />
                Invalid JSON
              </div>
            )}
          </div>

          <ApiPreview
            apiKey={showCustomKey ? customKey : customKey ? '•'.repeat(customKey.length) : ''}
            baseURL={customUrl}
            model={customModel}
            additionalArguments={argumentsString}
          />
        </div>
      </RadioOption>
    </div>
  );
}
