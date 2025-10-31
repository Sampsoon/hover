import { useState } from 'react';
import { RadioOption } from './RadioOption';
import { FormField } from './FormField';
import { CodeExample } from './CodeExample';
import { DEFAULT_MODEL, DEFAULT_API_URL, DEFAULT_API_KEY } from './apiDefaults';

export function ApiConfiguration() {
  const [selectedProvider, setSelectedProvider] = useState<'openrouter' | 'custom'>('openrouter');
  const [openrouterKey, setOpenrouterKey] = useState('');
  const [customModel, setCustomModel] = useState('');
  const [customUrl, setCustomUrl] = useState('');
  const [customKey, setCustomKey] = useState('');

  return (
    <div>
      <RadioOption
        id="openrouter"
        label="OpenRouter"
        selected={selectedProvider === 'openrouter'}
        onSelect={() => {
          setSelectedProvider('openrouter');
        }}
      >
        <FormField
          label="API key"
          type="password"
          placeholder="Your API key"
          linkText="click here to get one"
          linkHref="https://openrouter.ai/keys"
          value={openrouterKey}
          onChange={setOpenrouterKey}
        />
      </RadioOption>

      <RadioOption
        id="custom"
        label="Custom Endpoint"
        selected={selectedProvider === 'custom'}
        onSelect={() => {
          setSelectedProvider('custom');
        }}
      >
        <FormField
          label="Model"
          type="text"
          placeholder={DEFAULT_MODEL}
          value={customModel}
          onChange={setCustomModel}
        />
        <FormField
          label="API URL"
          type="text"
          placeholder={DEFAULT_API_URL}
          value={customUrl}
          onChange={setCustomUrl}
        />
        <FormField
          label="API Key"
          type="password"
          placeholder={DEFAULT_API_KEY}
          value={customKey}
          onChange={setCustomKey}
        />
        <CodeExample apiKey={customKey} baseURL={customUrl} model={customModel} />
      </RadioOption>
    </div>
  );
}
