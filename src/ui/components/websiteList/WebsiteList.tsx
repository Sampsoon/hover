import { useState, useCallback, useEffect, type ChangeEvent, type KeyboardEvent } from 'react';
import { ToggleSwitch, Input, IconButton, bodyTextStyle, TrashIcon } from '../common';
import { storage, WebsiteFilterMode } from '../../../storage';
import {
  getMatchConfigFromWebsiteFilter,
  requestPermissionsForMatchConfig,
  revokePermissions,
} from '../../../permissions';
import browser from 'webextension-polyfill';

async function isValidPattern(pattern: string): Promise<boolean> {
  try {
    await browser.permissions.contains({ origins: [pattern] });
    return true;
  } catch {
    return false;
  }
}

type UpdateResult = { success: true } | { success: false; error?: string };

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
    void storage.websiteFilter.get().then((config) => {
      setFilterMode(config.mode);
      setBlockList(config.blockList);
      setAllowList(config.allowList);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setAnimate(true);
        });
      });
    });
  }, []);

  const updatePatterns = useCallback(
    async (newPatterns: string[], patternToValidate?: string): Promise<UpdateResult> => {
      if (patternToValidate) {
        const valid = await isValidPattern(patternToValidate);
        if (!valid) {
          return { success: false, error: 'Invalid pattern' };
        }
      }

      const newBlockList = filterMode === WebsiteFilterMode.ALLOW_ALL ? newPatterns : blockList;
      const newAllowList = filterMode === WebsiteFilterMode.BLOCK_ALL ? newPatterns : allowList;

      const config = { mode: filterMode, blockList: newBlockList, allowList: newAllowList };
      const matchConfig = getMatchConfigFromWebsiteFilter(config);
      const granted = await requestPermissionsForMatchConfig(matchConfig);

      if (!granted) {
        return { success: false };
      }

      setPatterns(newPatterns);
      void storage.websiteFilter.set(config);
      return { success: true };
    },
    [filterMode, blockList, allowList, setPatterns],
  );

  const switchMode = useCallback(
    async (newMode: WebsiteFilterMode): Promise<UpdateResult> => {
      if (newMode === WebsiteFilterMode.BLOCK_ALL) {
        await revokePermissions(['<all_urls>']);
      }

      const config = { mode: newMode, blockList, allowList };
      const matchConfig = getMatchConfigFromWebsiteFilter(config);
      const granted = await requestPermissionsForMatchConfig(matchConfig);

      if (!granted && newMode === WebsiteFilterMode.BLOCK_ALL) {
        const emptyConfig = { mode: newMode, blockList, allowList: [] };
        setFilterMode(newMode);
        setAllowList([]);
        void storage.websiteFilter.set(emptyConfig);
        return { success: false };
      }

      if (!granted && newMode === WebsiteFilterMode.ALLOW_ALL) {
        return { success: false };
      }

      setFilterMode(newMode);
      void storage.websiteFilter.set(config);
      return { success: true };
    },
    [blockList, allowList],
  );

  const handleFilterModeChange = useCallback(
    (newMode: WebsiteFilterMode) => {
      void switchMode(newMode);
    },
    [switchMode],
  );

  const clearEditState = useCallback(() => {
    setEditingIndex(null);
    setEditValue('');
  }, []);

  const addPattern = useCallback(async () => {
    const trimmed = newPattern.trim();
    if (!trimmed) {
      return;
    }

    const result = await updatePatterns([trimmed, ...patterns], trimmed);

    if (result.success) {
      setError(null);
      setNewPattern('');
    } else if (result.error) {
      setError(result.error);
    }
  }, [newPattern, patterns, updatePatterns]);

  const removePattern = useCallback(
    async (index: number) => {
      const patternToRemove = patterns[index];
      const newPatterns = patterns.filter((_, i) => i !== index);

      if (filterMode === WebsiteFilterMode.BLOCK_ALL) {
        await revokePermissions([patternToRemove]);
      }

      const newBlockList = filterMode === WebsiteFilterMode.ALLOW_ALL ? newPatterns : blockList;
      const newAllowList = filterMode === WebsiteFilterMode.BLOCK_ALL ? newPatterns : allowList;

      setPatterns(newPatterns);
      void storage.websiteFilter.set({ mode: filterMode, blockList: newBlockList, allowList: newAllowList });
    },
    [patterns, filterMode, blockList, allowList, setPatterns],
  );

  const startEditing = useCallback(
    (index: number) => {
      setEditingIndex(index);
      setEditValue(patterns[index]);
    },
    [patterns],
  );

  const saveEdit = useCallback(async () => {
    if (editingIndex === null) {
      return;
    }

    const trimmed = editValue.trim();
    if (!trimmed) {
      clearEditState();
      return;
    }

    const newPatterns = [...patterns];
    newPatterns[editingIndex] = trimmed;
    const result = await updatePatterns(newPatterns, trimmed);

    if (result.success) {
      setError(null);
      clearEditState();
    } else if (result.error) {
      setError(result.error);
    }
  }, [editingIndex, editValue, patterns, updatePatterns, clearEditState]);

  const handleNewPatternChange = useCallback((value: string) => {
    setNewPattern(value);
    setError(null);
  }, []);

  const handleNewPatternSubmit = useCallback(() => {
    void addPattern();
  }, [addPattern]);

  const handleEditChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setEditValue(e.target.value);
  }, []);

  const handleEditKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        void saveEdit();
      } else if (e.key === 'Escape') {
        clearEditState();
      }
    },
    [saveEdit, clearEditState],
  );

  const handleEditBlur = useCallback(() => {
    void saveEdit();
  }, [saveEdit]);

  const emptyStateMessage =
    filterMode === WebsiteFilterMode.BLOCK_ALL ? (
      <>
        Add URL patterns to <strong>allow</strong> specific sites
      </>
    ) : (
      <>
        Add URL patterns to <strong>block</strong> specific sites
      </>
    );

  const permissionNote =
    filterMode === WebsiteFilterMode.ALLOW_ALL
      ? 'This extension won\'t run on blocked sites, but due to Chrome API restrictions, it still has access to blocked sites. Use "Block all websites" to limit Chrome permissions to only the sites you choose.'
      : null;

  const containerStyle = {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px',
  };

  const tableContainerStyle = {
    border: '1px solid var(--border-color)',
    borderRadius: '10px',
    backgroundColor: 'var(--card-bg)',
    boxShadow: 'var(--shadow-sm)',
    overflow: 'hidden',
  };

  const tableHeaderStyle = {
    padding: '14px 16px',
    borderBottom: '1px solid var(--border-color)',
  };

  const tableBodyStyle = {
    display: 'flex',
    flexDirection: 'column' as const,
  };

  const tableRowStyle = {
    display: 'flex',
    gap: '12px',
    padding: '10px 16px',
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
    padding: '14px 16px',
    textAlign: 'center' as const,
    color: 'var(--text-secondary)',
    fontSize: '13px',
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
      <ToggleSwitch
        value={filterMode}
        onChange={handleFilterModeChange}
        options={[WebsiteFilterMode.ALLOW_ALL, WebsiteFilterMode.BLOCK_ALL]}
        labels={['Run on all websites', 'Block all websites']}
        animate={animate}
      />

      <div style={tableContainerStyle}>
        <div style={tableHeaderStyle}>
          <Input
            value={newPattern}
            onChange={handleNewPatternChange}
            onSubmit={handleNewPatternSubmit}
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
                    onChange={handleEditChange}
                    onKeyDown={handleEditKeyDown}
                    onBlur={handleEditBlur}
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
                        void removePattern(index);
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
