import { DEFAULT_MODEL, OPEN_ROUTER_API_URL } from '../../../storage';

interface ApiPreviewProps {
  apiKey: string;
  baseURL: string;
  model: string;
  additionalArguments?: string;
}

export function ApiPreview({ apiKey, baseURL, model, additionalArguments }: ApiPreviewProps) {
  const displayKey = apiKey || 'Your API key';
  const displayURL = baseURL || OPEN_ROUTER_API_URL;
  const displayModel = model || DEFAULT_MODEL;
  const hasAdditionalArgs = additionalArguments && additionalArguments.trim().length > 0;

  return (
    <div
      style={{
        marginTop: '12px',
        marginBottom: '0px',
        padding: '0px',
        backgroundColor: 'var(--card-bg)',
        borderRadius: '10px',
        border: '1px solid var(--border-color)',
        boxShadow: 'none',
        overflowX: 'auto',
      }}
    >
      <pre
        style={{
          margin: 0,
          padding: '12px',
          backgroundColor: 'var(--code-bg)',
          borderRadius: '8px',
          border: '1px solid var(--border-color)',
          overflow: 'auto',
          fontSize: 'var(--font-code-size)',
          lineHeight: 'var(--font-code-line-height)',
        }}
      >
        <code>
          <span style={{ color: 'var(--code-keyword)' }}>const</span>{' '}
          <span style={{ color: 'var(--code-variable)' }}>client</span>{' '}
          <span style={{ color: 'var(--code-operator)' }}>=</span>{' '}
          <span style={{ color: 'var(--code-keyword)' }}>new</span>{' '}
          <span style={{ color: 'var(--code-class)' }}>OpenAI</span>
          <span style={{ color: 'var(--code-operator)' }}>(&#123;</span>
          {'\n'}
          {'  '}
          <span style={{ color: 'var(--code-variable)' }}>apiKey</span>
          <span style={{ color: 'var(--code-operator)' }}>:</span>{' '}
          <span style={{ color: 'var(--code-string)' }}>&apos;{displayKey}&apos;</span>
          <span style={{ color: 'var(--code-operator)' }}>,</span>
          {'\n'}
          {'  '}
          <span style={{ color: 'var(--code-variable)' }}>baseURL</span>
          <span style={{ color: 'var(--code-operator)' }}>:</span>{' '}
          <span style={{ color: 'var(--code-string)' }}>&apos;{displayURL}&apos;</span>
          <span style={{ color: 'var(--code-operator)' }}>,</span>
          {'\n'}
          <span style={{ color: 'var(--code-operator)' }}>&#125;);</span>
          {'\n\n'}
          {hasAdditionalArgs && (
            <>
              <span style={{ color: 'var(--code-keyword)' }}>const</span>{' '}
              <span style={{ color: 'var(--code-variable)' }}>additionalArguments</span>{' '}
              <span style={{ color: 'var(--code-operator)' }}>=</span>{' '}
              <span style={{ color: 'var(--text-primary)' }}>{additionalArguments}</span>
              <span style={{ color: 'var(--code-operator)' }}>;</span>
              {'\n\n'}
            </>
          )}
          <span style={{ color: 'var(--code-keyword)' }}>const</span>{' '}
          <span style={{ color: 'var(--code-variable)' }}>params</span>{' '}
          <span style={{ color: 'var(--code-operator)' }}>=</span>{' '}
          <span style={{ color: 'var(--code-operator)' }}>&#123;</span>
          {'\n'}
          {'  '}
          <span style={{ color: 'var(--code-variable)' }}>model</span>
          <span style={{ color: 'var(--code-operator)' }}>:</span>{' '}
          <span style={{ color: 'var(--code-string)' }}>&apos;{displayModel}&apos;</span>
          <span style={{ color: 'var(--code-operator)' }}>,</span>
          {'\n'}
          {hasAdditionalArgs && (
            <>
              {'  '}
              <span style={{ color: 'var(--code-operator)' }}>...</span>
              <span style={{ color: 'var(--code-variable)' }}>additionalArguments</span>
              <span style={{ color: 'var(--code-operator)' }}>,</span>
              {'\n'}
            </>
          )}
          {'  '}
          <span style={{ color: 'var(--code-comment)' }}>{'// ... other parameters'}</span>
          {'\n'}
          <span style={{ color: 'var(--code-operator)' }}>&#125;;</span>
        </code>
      </pre>
    </div>
  );
}
