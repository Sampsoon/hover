import { useState } from 'react';
import { typography } from '../config/theme';
import { ToggleSwitch, InfoBox, Input, Button } from './ui';

export function WebsiteList() {
  const [filterMode, setFilterMode] = useState<'block-all' | 'allow-all'>('allow-all');
  const [regexes, setRegexes] = useState<string[]>([]);
  const [newRegex, setNewRegex] = useState('');

  const addRegex = () => {
    if (newRegex.trim()) {
      setRegexes([newRegex.trim(), ...regexes]);
      setNewRegex('');
    }
  };

  const removeRegex = (index: number) => {
    setRegexes(regexes.filter((_, i) => i !== index));
  };

  const description =
    filterMode === 'block-all'
      ? 'Block all sites except those matching these regexes'
      : 'Allow all sites except those matching these regexes';

  const containerStyle = {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
    padding: '0 8px 8px 8px',
    height: '100%',
    maxHeight: 'inherit',
  };

  const tableContainerStyle = {
    display: 'flex',
    flexDirection: 'column' as const,
    overflow: 'auto',
    flex: 1,
    border: '1.5px solid var(--border-color)',
    borderRadius: '12px',
    backgroundColor: 'var(--card-bg-inactive)',
    boxShadow: 'var(--shadow-md)',
  };

  const tableHeaderStyle = {
    display: 'flex',
    gap: '12px',
    padding: '14px 8px',
    borderBottom: '2px solid var(--border-color)',
    backgroundColor: 'var(--bg-primary)',
    flexShrink: 0,
    alignItems: 'center',
    position: 'sticky' as const,
    top: 0,
    zIndex: 1,
  };

  const tableBodyStyle = {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0',
    overflow: 'visible' as const,
    flex: 1,
    minHeight: 0,
  };

  const tableRowStyle = {
    display: 'flex',
    gap: '12px',
    padding: '12px 8px',
    paddingLeft: '20px',
    borderBottom: '1px solid var(--border-color)',
    alignItems: 'center',
    backgroundColor: 'var(--card-bg-inactive)',
  };

  const cellStyle = {
    ...typography.smallLabel,
    fontFamily: 'ui-monospace, "Cascadia Code", "Source Code Pro", Menlo, Consolas, "DejaVu Sans Mono", monospace',
    wordBreak: 'break-word' as const,
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    flex: 1,
    color: 'var(--text-primary)',
  };

  const emptyStateStyle = {
    padding: '32px 16px',
    textAlign: 'center' as const,
    color: 'var(--text-secondary)',
    ...typography.body,
    fontStyle: 'italic',
  };

  return (
    <div style={containerStyle}>
      <div style={{ marginBottom: '4px' }}>
        <ToggleSwitch
          value={filterMode}
          onChange={setFilterMode}
          options={['allow-all', 'block-all']}
          labels={['Run on all websites', 'Block all websites']}
        />
      </div>

      <InfoBox>{description}</InfoBox>

      <div style={tableContainerStyle} className="stable-scrollbar">
        <div style={tableHeaderStyle}>
          <Input value={newRegex} onChange={setNewRegex} onSubmit={addRegex} placeholder="example\.com|test\.org" />
          <Button variant="success" onClick={addRegex}>
            <span style={{ fontSize: '1.5em' }}>✓</span>
          </Button>
        </div>
        {regexes.length > 0 ? (
          <div style={tableBodyStyle}>
            {regexes.map((regex, index) => (
              <div key={index} style={tableRowStyle}>
                <div style={cellStyle} title={regex}>
                  {regex}
                </div>
                <Button
                  variant="ghost"
                  onClick={() => {
                    removeRegex(index);
                  }}
                >
                  <span style={{ fontSize: '1.5em', color: 'var(--alert-color)', fontWeight: 'bold' }}>✕</span>
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div style={emptyStateStyle}>No regexes added yet</div>
        )}
      </div>
    </div>
  );
}
