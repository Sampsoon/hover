import { useState, useCallback, useEffect } from 'react';
import { ToggleSwitch, Input, IconButton, bodyTextStyle, TrashIcon } from '../common';
import { storage, WebsiteFilterMode } from '../../../storage';

export function WebsiteList() {
  const [filterMode, setFilterMode] = useState<WebsiteFilterMode>(WebsiteFilterMode.ALLOW_ALL);
  const [blockList, setBlockList] = useState<string[]>([]);
  const [allowList, setAllowList] = useState<string[]>([]);
  const [newRegex, setNewRegex] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');
  const [animate, setAnimate] = useState(false);

  const regexes = filterMode === WebsiteFilterMode.ALLOW_ALL ? blockList : allowList;
  const setRegexes = filterMode === WebsiteFilterMode.ALLOW_ALL ? setBlockList : setAllowList;

  useEffect(() => {
    void storage.websiteFilter.get().then(({ mode, blockList, allowList }) => {
      setFilterMode(mode);
      setBlockList(blockList);
      setAllowList(allowList);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setAnimate(true);
        });
      });
    });
  }, []);

  const updateRegexes = useCallback(
    (newRegexes: string[]) => {
      setRegexes(newRegexes);
      void storage.websiteFilter.set(
        filterMode === WebsiteFilterMode.ALLOW_ALL
          ? { mode: filterMode, blockList: newRegexes, allowList }
          : { mode: filterMode, blockList, allowList: newRegexes },
      );
    },
    [setRegexes, filterMode, blockList, allowList],
  );

  const handleFilterModeChange = useCallback(
    (mode: WebsiteFilterMode) => {
      setFilterMode(mode);
      void storage.websiteFilter.set({ mode, blockList, allowList });
    },
    [blockList, allowList],
  );

  const addRegex = useCallback(() => {
    if (newRegex.trim()) {
      updateRegexes([newRegex.trim(), ...regexes]);
      setNewRegex('');
    }
  }, [newRegex, regexes, updateRegexes]);

  const removeRegex = useCallback(
    (index: number) => {
      updateRegexes(regexes.filter((_, i) => i !== index));
    },
    [regexes, updateRegexes],
  );

  const startEditing = useCallback(
    (index: number) => {
      setEditingIndex(index);
      setEditValue(regexes[index]);
    },
    [regexes],
  );

  const saveEdit = useCallback(() => {
    if (editingIndex !== null && editValue.trim()) {
      const newRegexes = [...regexes];
      newRegexes[editingIndex] = editValue.trim();
      updateRegexes(newRegexes);
    }
    setEditingIndex(null);
    setEditValue('');
  }, [editingIndex, editValue, regexes, updateRegexes]);

  const cancelEdit = useCallback(() => {
    setEditingIndex(null);
    setEditValue('');
  }, []);

  const emptyStateMessage =
    filterMode === WebsiteFilterMode.BLOCK_ALL
      ? 'Add regex patterns to allow specific sites while blocking all others'
      : 'Add regex patterns to block specific sites while allowing all others';

  const handleEditKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        saveEdit();
      } else if (e.key === 'Escape') {
        cancelEdit();
      }
    },
    [saveEdit, cancelEdit],
  );

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
    overflow: 'hidden',
    flex: 1,
    border: '1px solid var(--border-color)',
    borderRadius: '8px',
    backgroundColor: 'var(--card-bg)',
    boxShadow: 'var(--shadow-sm)',
  };

  const tableHeaderStyle = {
    display: 'flex',
    gap: '12px',
    padding: '12px 12px',
    borderBottom: '1px solid var(--border-color)',
    backgroundColor: 'var(--card-bg)',
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
    overflowY: 'auto' as const,
    overflowX: 'hidden' as const,
    flex: 1,
    minHeight: 0,
  };

  const tableRowStyle = {
    display: 'flex',
    gap: '10px',
    padding: '8px 12px',
    borderBottom: '1px solid var(--border-color)',
    alignItems: 'center',
    transition: 'background-color 0.15s ease',
  };

  const cellStyle = {
    fontFamily: 'var(--font-monospace)',
    fontWeight: 'var(--font-small-label-weight)',
    fontSize: 'var(--font-small-label-size)',
    lineHeight: 'var(--font-small-label-line-height)',
    wordBreak: 'break-word' as const,
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    flex: 1,
    color: 'var(--text-primary)',
    cursor: 'pointer',
  };

  const editInputStyle = {
    fontFamily: 'var(--font-monospace)',
    fontWeight: 'var(--font-small-label-weight)',
    fontSize: 'var(--font-small-label-size)',
    lineHeight: 'var(--font-small-label-line-height)',
    flex: 1,
    padding: '4px 8px',
    border: '1.5px solid var(--primary-color)',
    borderRadius: '4px',
    backgroundColor: 'var(--input-bg)',
    color: 'var(--text-primary)',
    outline: 'none',
  };

  const emptyStateStyle = {
    ...bodyTextStyle,
    padding: '32px 16px',
    textAlign: 'center' as const,
    color: 'var(--text-secondary)',
    fontStyle: 'italic',
  };

  return (
    <div style={containerStyle}>
      <div style={{ marginBottom: '4px' }}>
        <ToggleSwitch
          value={filterMode}
          onChange={handleFilterModeChange}
          options={[WebsiteFilterMode.ALLOW_ALL, WebsiteFilterMode.BLOCK_ALL]}
          labels={['Run on all websites', 'Block all websites']}
          animate={animate}
        />
      </div>

      <div style={tableContainerStyle}>
        <div style={tableHeaderStyle}>
          <Input value={newRegex} onChange={setNewRegex} onSubmit={addRegex} placeholder="example\.com|test\.org" />
        </div>
        {regexes.length > 0 ? (
          <div style={tableBodyStyle} className="table-body">
            {regexes.map((regex, index) => (
              <div key={index} style={tableRowStyle} className="table-row">
                {editingIndex === index ? (
                  <input
                    type="text"
                    value={editValue}
                    onChange={(e) => {
                      setEditValue(e.target.value);
                    }}
                    onKeyDown={handleEditKeyDown}
                    onBlur={saveEdit}
                    autoFocus
                    style={editInputStyle}
                  />
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
                    <IconButton
                      onClick={() => {
                        removeRegex(index);
                      }}
                    >
                      <TrashIcon />
                    </IconButton>
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
