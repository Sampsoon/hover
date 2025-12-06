import { useState, useCallback, useEffect } from 'react';
import { ToggleSwitch, Input, IconButton, bodyTextStyle, TrashIcon } from '../common';
import { storage, WebsiteFilterMode } from '../../../storage';
import { getMatchConfigFromWebsiteFilter, requestPermissionsForMatchConfig } from '../../../permissions';
import browser from 'webextension-polyfill';

async function isValidatePattern(pattern: string): Promise<boolean> {
  try {
    await browser.permissions.contains({ origins: [pattern] });
    return true;
  } catch {
    return false;
  }
}

export function WebsiteList() {
  const [filterMode, setFilterMode] = useState<WebsiteFilterMode>(WebsiteFilterMode.ALLOW_ALL);
  const [blockList, setBlockList] = useState<string[]>([]);
  const [allowList, setAllowList] = useState<string[]>([]);

  const [newPattern, setNewPattern] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');
  const [animate, setAnimate] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const patterns = filterMode === WebsiteFilterMode.ALLOW_ALL ? blockList : allowList;
  const setPatterns = filterMode === WebsiteFilterMode.ALLOW_ALL ? setBlockList : setAllowList;

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

  const updatePatterns = useCallback(
    (newPatterns: string[]) => {
      setPatterns(newPatterns);
      const config =
        filterMode === WebsiteFilterMode.ALLOW_ALL
          ? { mode: filterMode, blockList: newPatterns, allowList }
          : { mode: filterMode, blockList, allowList: newPatterns };
      const matchConfig = getMatchConfigFromWebsiteFilter(config);
      void requestPermissionsForMatchConfig(matchConfig);
      void storage.websiteFilter.set(config);
    },
    [setPatterns, filterMode, blockList, allowList],
  );

  const handleFilterModeChange = useCallback(
    (mode: WebsiteFilterMode) => {
      setFilterMode(mode);
      const config = { mode, blockList, allowList };
      const matchConfig = getMatchConfigFromWebsiteFilter(config);
      void requestPermissionsForMatchConfig(matchConfig);
      void storage.websiteFilter.set(config);
    },
    [blockList, allowList],
  );

  const addPattern = useCallback(async () => {
    const trimmed = newPattern.trim();
    if (!trimmed) {
      return;
    }

    const validPattern = await isValidatePattern(trimmed);
    if (validPattern) {
      setError('Invalid pattern');
      return;
    }

    if (filterMode === WebsiteFilterMode.BLOCK_ALL) {
      const granted = await browser.permissions.request({ origins: [trimmed] });
      if (!granted) {
        return;
      }
    }

    setError(null);
    updatePatterns([trimmed, ...patterns]);
    setNewPattern('');
  }, [newPattern, patterns, updatePatterns, filterMode]);

  const removePattern = useCallback(
    (index: number) => {
      updatePatterns(patterns.filter((_, i) => i !== index));
    },
    [patterns, updatePatterns],
  );

  const startEditing = useCallback(
    (index: number) => {
      setEditingIndex(index);
      setEditValue(patterns[index]);
    },
    [patterns],
  );

  const saveEdit = useCallback(() => {
    if (editingIndex !== null && editValue.trim()) {
      const newPatterns = [...patterns];
      newPatterns[editingIndex] = editValue.trim();
      updatePatterns(newPatterns);
    }
    setEditingIndex(null);
    setEditValue('');
  }, [editingIndex, editValue, patterns, updatePatterns]);

  const cancelEdit = useCallback(() => {
    setEditingIndex(null);
    setEditValue('');
  }, []);

  const emptyStateMessage =
    filterMode === WebsiteFilterMode.BLOCK_ALL
      ? 'Add URL patterns to allow specific sites'
      : 'Add URL patterns to block specific sites';

  const permissionNote =
    filterMode === WebsiteFilterMode.ALLOW_ALL
      ? 'This extension won\'t run on blocked sites, but due to Chrome API restrictions, it still has access to blocked sites. Use "Block all websites" to limit Chrome permissions to only the sites you choose.'
      : null;

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

  const permissionNoteStyle = {
    ...bodyTextStyle,
    padding: '12px 16px',
    textAlign: 'center' as const,
    color: 'var(--text-secondary)',
    fontSize: '12px',
    borderTop: '1px solid var(--border-color)',
  };

  const errorStyle = {
    padding: '8px 12px',
    color: 'var(--error-color, #ef4444)',
    fontSize: '12px',
    backgroundColor: 'var(--error-bg, rgba(239, 68, 68, 0.1))',
    borderBottom: '1px solid var(--border-color)',
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
          <Input
            value={newPattern}
            onChange={(value) => {
              setNewPattern(value);
              setError(null);
            }}
            onSubmit={() => {
              void addPattern();
            }}
            placeholder="*://*.example.com/*"
          />
        </div>
        {error && <div style={errorStyle}>{error}</div>}
        {patterns.length > 0 ? (
          <div style={tableBodyStyle} className="table-body">
            {patterns.map((pattern, index) => (
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
                      title={pattern}
                      onClick={() => {
                        startEditing(index);
                      }}
                    >
                      {pattern}
                    </div>
                    <IconButton
                      onClick={() => {
                        removePattern(index);
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
        {permissionNote && (
          <div style={permissionNoteStyle}>
            <strong>Note:</strong> {permissionNote.replace('Note: ', '')}
          </div>
        )}
      </div>
    </div>
  );
}
