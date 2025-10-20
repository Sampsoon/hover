import { useState } from 'react';
import { typography } from '../config/theme';
import { ToggleSwitch, Input, Button } from './ui';

export function WebsiteList() {
  const [filterMode, setFilterMode] = useState<'block-all' | 'allow-all'>('allow-all');
  const [regexes, setRegexes] = useState<string[]>([]);
  const [newRegex, setNewRegex] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');

  const addRegex = () => {
    if (newRegex.trim()) {
      setRegexes([newRegex.trim(), ...regexes]);
      setNewRegex('');
    }
  };

  const removeRegex = (index: number) => {
    setRegexes(regexes.filter((_, i) => i !== index));
  };

  const startEditing = (index: number) => {
    setEditingIndex(index);
    setEditValue(regexes[index]);
  };

  const saveEdit = () => {
    if (editingIndex !== null && editValue.trim()) {
      const newRegexes = [...regexes];
      newRegexes[editingIndex] = editValue.trim();
      setRegexes(newRegexes);
    }
    setEditingIndex(null);
    setEditValue('');
  };

  const cancelEdit = () => {
    setEditingIndex(null);
    setEditValue('');
  };

  const emptyStateMessage =
    filterMode === 'block-all'
      ? 'Add regex patterns to allow specific sites while blocking all others'
      : 'Add regex patterns to block specific sites while allowing all others';

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
    border: '1px solid var(--border-color)',
    borderRadius: '8px',
    backgroundColor: 'var(--card-bg-inactive)',
    boxShadow: 'var(--shadow-sm)',
  };

  const tableHeaderStyle = {
    display: 'flex',
    gap: '12px',
    padding: '12px 12px',
    borderBottom: '1px solid var(--border-color)',
    backgroundColor: 'var(--card-bg-inactive)',
    flexShrink: 0,
    alignItems: 'center',
    position: 'sticky' as const,
    top: 0,
    zIndex: 1,
    borderTopLeftRadius: '8px',
    borderTopRightRadius: '8px',
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
    padding: '12px 12px',
    borderBottom: '1px solid var(--border-color)',
    alignItems: 'center',
    backgroundColor: 'var(--card-bg-inactive)',
    transition: 'background-color 0.15s ease',
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
    cursor: 'pointer',
  };

  const editInputStyle = {
    ...typography.smallLabel,
    fontFamily: 'ui-monospace, "Cascadia Code", "Source Code Pro", Menlo, Consolas, "DejaVu Sans Mono", monospace',
    flex: 1,
    padding: '4px 8px',
    border: '1.5px solid var(--primary-color)',
    borderRadius: '4px',
    backgroundColor: 'var(--input-bg)',
    color: 'var(--text-primary)',
    outline: 'none',
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
              <div
                key={index}
                style={tableRowStyle}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--card-bg-hover)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--card-bg-inactive)';
                }}
              >
                {editingIndex === index ? (
                  <>
                    <input
                      type="text"
                      value={editValue}
                      onChange={(e) => {
                        setEditValue(e.target.value);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          saveEdit();
                        } else if (e.key === 'Escape') {
                          cancelEdit();
                        }
                      }}
                      onBlur={saveEdit}
                      autoFocus
                      style={editInputStyle}
                    />
                    <Button variant="success" onClick={saveEdit}>
                      <span style={{ fontSize: '1.5em' }}>✓</span>
                    </Button>
                  </>
                ) : (
                  <>
                    <div
                      style={cellStyle}
                      title={regex}
                      onClick={() => {
                        startEditing(index);
                      }}
                    >
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
                  </>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div style={emptyStateStyle}>{emptyStateMessage}</div>
        )}
      </div>
    </div>
  );
}
