import { DEFAULT_MODEL, DEFAULT_API_URL, DEFAULT_API_KEY } from './apiDefaults';

interface CodeExampleProps {
  apiKey: string;
  baseURL: string;
  model: string;
}

export function CodeExample({ apiKey, baseURL, model }: CodeExampleProps) {
  const displayKey = apiKey || DEFAULT_API_KEY;
  const displayURL = baseURL || DEFAULT_API_URL;
  const displayModel = model || DEFAULT_MODEL;

  return (
    <div
      style={{
        marginTop: '12px',
        marginBottom: '0px',
        padding: '0px',
        backgroundColor: 'var(--card-bg-active)',
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
          backgroundColor: 'var(--bg-primary)',
          borderRadius: '8px',
          border: '1px solid var(--border-color)',
          overflow: 'auto',
          fontSize: '12px',
          lineHeight: '1.4',
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
          {'  '}
          <span style={{ color: 'var(--code-comment)' }}>{'// ... other parameters'}</span>
          {'\n'}
          <span style={{ color: 'var(--code-operator)' }}>&#125;;</span>
        </code>
      </pre>
    </div>
  );
}
