import { useState } from 'react';
import { typography } from '../config/theme';
import { ToggleSwitch, InfoBox, Input, Button } from './ui';

type FilterMode = 'block-all' | 'allow-all';

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
    width: '100%',
    maxWidth: '600px',
    padding: '0 8px',
    boxSizing: 'border-box' as const,
    overflow: 'hidden' as const,
  },
  section: { marginBottom: '16px' },
  inputRow: {
    display: 'flex',
    gap: '8px',
    width: '100%',
    alignItems: 'center',
  },
  list: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
    width: '100%',
    maxHeight: '400px',
    overflowY: 'auto' as const,
    overflowX: 'hidden' as const,
    padding: '8px',
    border: '1.5px solid var(--border-color)',
    borderRadius: '8px',
    backgroundColor: 'var(--card-bg-inactive)',
    boxShadow: 'var(--shadow-sm)',
    boxSizing: 'border-box' as const,
  },
  listItem: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
    width: '100%',
  },
  patternBox: {
    border: '1.5px solid var(--border-color)',
    borderRadius: '8px',
    padding: '10px 12px',
    boxShadow: 'var(--shadow-sm)',
    flex: 1,
  },
  pattern: {
    ...typography.smallLabel,
    fontFamily: 'monospace',
    wordBreak: 'break-word' as const,
  },
};

export function WebsiteList() {
  const [filterMode, setFilterMode] = useState<FilterMode>('allow-all');
  const [patterns, setPatterns] = useState<string[]>([]);
  const [newPattern, setNewPattern] = useState('');

  const addPattern = () => {
    if (newPattern.trim()) {
      setPatterns([...patterns, newPattern.trim()]);
      setNewPattern('');
    }
  };

  const removePattern = (index: number) => {
    setPatterns(patterns.filter((_, i) => i !== index));
  };

  const description =
    filterMode === 'block-all'
      ? 'Block all sites except those matching these patterns'
      : 'Allow all sites except those matching these patterns';

  return (
    <div style={styles.container}>
      <div style={styles.section}>
        <ToggleSwitch
          value={filterMode}
          onChange={setFilterMode}
          options={['allow-all', 'block-all']}
          labels={['Allow run on all websites', 'Block all websites']}
        />
      </div>

      <InfoBox>{description}</InfoBox>

      <div style={styles.section}>
        <div style={styles.inputRow}>
          <Input
            value={newPattern}
            onChange={setNewPattern}
            onSubmit={addPattern}
            placeholder="example\.com|test\.org"
          />
          <Button variant="success" onClick={addPattern}>
            <span style={{ fontSize: '1.5em' }}>✓</span>
          </Button>
        </div>
      </div>

      {patterns.length > 0 && (
        <div>
          <div style={styles.list}>
            {patterns.map((pattern, index) => (
              <div key={index} style={styles.listItem}>
                <div style={styles.patternBox}>
                  <span style={styles.pattern}>{pattern}</span>
                </div>
                <Button
                  variant="ghost"
                  onClick={() => {
                    removePattern(index);
                  }}
                >
                  <span style={{ fontSize: '1.5em', color: 'var(--alert-color)' }}>✕</span>
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
