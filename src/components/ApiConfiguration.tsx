import { useState } from 'react';
import { RadioOption } from './RadioOption';
import { FormField } from './FormField';

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
          placeholder="sk-or-v1-..."
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
        <FormField label="Model" type="text" placeholder="gpt-4" value={customModel} onChange={setCustomModel} />
        <FormField
          label="API URL"
          type="text"
          placeholder="https://api.example.com/v1"
          value={customUrl}
          onChange={setCustomUrl}
        />
        <FormField
          label="API Key"
          type="password"
          placeholder="Your API key"
          value={customKey}
          onChange={setCustomKey}
        />
      </RadioOption>
    </div>
  );
}
