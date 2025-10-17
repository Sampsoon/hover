import { useState } from 'react';
import { typography } from '../config/theme';
import { RadioOption } from './RadioOption';
import { FormField } from './FormField';

type ApiProvider = 'openrouter' | 'custom';

export function ApiConfiguration() {
  const [selectedProvider, setSelectedProvider] = useState<ApiProvider>('openrouter');
  const [openrouterKey, setOpenrouterKey] = useState('');
  const [customModel, setCustomModel] = useState('');
  const [customUrl, setCustomUrl] = useState('');
  const [customKey, setCustomKey] = useState('');

  return (
    <div>
      <h2 style={{ ...typography.label, marginBottom: '12px' }}>API Configuration</h2>

      <RadioOption
        id="openrouter"
        label="OpenRouter"
        selected={selectedProvider === 'openrouter'}
        onSelect={() => {
          setSelectedProvider('openrouter');
        }}
      >
        <FormField
          label="OpenRouter API key"
          type="password"
          placeholder="sk-or-v1-..."
          linkText="learn how"
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
