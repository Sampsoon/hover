import { useState, useEffect } from 'react';
import { Input, PasswordInput, fieldLabelStyle, TextArea, AlertIcon } from '../common';
import { ApiPreview } from './ApiPreview';
import { DEFAULT_MODEL, OPEN_ROUTER_API_URL, OPEN_ROUTER_DEFAULT_PARAMS, storage } from '../../../storage';
import { createDebounce } from '../../utils';
import { Json } from '../../../shared';

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

export function CustomEndpointConfiguration() {
  const [customModel, setCustomModel] = useState('');
  const [customUrl, setCustomUrl] = useState('');
  const [customKey, setCustomKey] = useState('');
  const [additionalArguments, setAdditionalArguments] = useState<Json | undefined>(undefined);
  const [argumentsString, setArgumentsString] = useState('');
  const [showCustomKey, setShowCustomKey] = useState(false);
  const [isValidJson, setIsValidJson] = useState(true);

  useEffect(() => {
    const loadConfig = async () => {
      const customApiConfig = await storage.customApiConfig.get();

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
    <div>
      <div style={{ marginBottom: '12px' }}>
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
      <div style={{ marginBottom: '12px' }}>
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
      <div style={{ marginBottom: '12px' }}>
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
      <div style={{ marginBottom: '12px' }}>
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
              ...fieldLabelStyle,
              color: 'var(--alert-color)',
              marginTop: '4px',
              marginBottom: '0px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
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
  );
}
