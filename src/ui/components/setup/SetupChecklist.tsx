import { useState, useEffect } from 'react';
import browser from 'webextension-polyfill';
import { storage, WebsiteFilterMode, SettingsTab, TAB_QUERY_PARAM } from '../../../storage';
import { APIProvider } from '@hover/shared';
import { CheckCircleIcon, CircleIcon, ApiKeyIcon, GlobeIcon } from '../common';

interface SetupStatus {
  hasApiKey: boolean;
  hasWebsites: boolean;
}

const ITEMS: { id: SettingsTab; label: string; icon: typeof ApiKeyIcon; statusKey: keyof SetupStatus }[] = [
  { id: SettingsTab.API, label: 'Configure API key', icon: ApiKeyIcon, statusKey: 'hasApiKey' },
  { id: SettingsTab.WEBSITES, label: 'Set up allowed websites', icon: GlobeIcon, statusKey: 'hasWebsites' },
];

async function checkSetupStatus(): Promise<SetupStatus> {
  const [apiProvider, openRouterConfig, customConfig, websiteFilter] = await Promise.all([
    storage.apiProvider.get(),
    storage.openRouterApiConfig.get(),
    storage.customApiConfig.get(),
    storage.websiteFilter.get(),
  ]);

  const hasApiKey = apiProvider === APIProvider.CUSTOM ? Boolean(customConfig?.key) : Boolean(openRouterConfig?.key);

  const hasWebsites = websiteFilter.mode === WebsiteFilterMode.ALLOW_ALL || websiteFilter.allowList.length > 0;

  return { hasApiKey, hasWebsites };
}

function openOptionsTab(tab: SettingsTab) {
  const url = browser.runtime.getURL(`options.html?${TAB_QUERY_PARAM}=${tab}`);
  window.open(url, '_blank');
}

// Styles
const containerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
  padding: '16px',
  backgroundColor: 'var(--card-bg)',
  border: '1px solid var(--border-color)',
  borderRadius: '12px',
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  marginBottom: '4px',
};

const titleStyle: React.CSSProperties = {
  fontSize: '13px',
  fontWeight: 600,
  color: 'var(--text-primary)',
  letterSpacing: '-0.01em',
};

const badgeStyle: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 500,
  color: 'var(--text-secondary)',
  backgroundColor: 'var(--input-bg)',
  padding: '2px 8px',
  borderRadius: '10px',
};

const baseButtonStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  padding: '10px 12px',
  borderRadius: '8px',
  cursor: 'pointer',
  transition: 'all 0.15s ease',
  width: '100%',
  textAlign: 'left',
};

export function SetupChecklist() {
  const [status, setStatus] = useState<SetupStatus | null>(null);

  useEffect(() => {
    void checkSetupStatus().then(setStatus);

    const listener = () => {
      void checkSetupStatus().then(setStatus);
    };

    browser.storage.onChanged.addListener(listener);
    return () => {
      browser.storage.onChanged.removeListener(listener);
    };
  }, []);

  if (!status || (status.hasApiKey && status.hasWebsites)) {
    return null;
  }

  const incompleteCount = ITEMS.filter((item) => !status[item.statusKey]).length;

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <span style={titleStyle}>Setup Required</span>
        <span style={badgeStyle}>{incompleteCount} remaining</span>
      </div>

      {ITEMS.map((item) => {
        const completed = status[item.statusKey];
        const Icon = item.icon;

        return (
          <button
            key={item.id}
            onClick={() => {
              openOptionsTab(item.id);
            }}
            style={{
              ...baseButtonStyle,
              backgroundColor: completed ? 'rgba(var(--primary-rgb), 0.06)' : 'var(--input-bg)',
              border: completed ? '1px solid rgba(var(--primary-rgb), 0.2)' : '1px solid var(--border-color)',
            }}
            onMouseEnter={(e) => {
              if (!completed) {
                e.currentTarget.style.backgroundColor = 'var(--card-bg-hover)';
                e.currentTarget.style.borderColor = 'var(--primary-color)';
              }
            }}
            onMouseLeave={(e) => {
              if (!completed) {
                e.currentTarget.style.backgroundColor = 'var(--input-bg)';
                e.currentTarget.style.borderColor = 'var(--border-color)';
              }
            }}
          >
            <Icon
              width={16}
              height={16}
              style={{
                color: completed ? 'var(--primary-color)' : 'var(--text-secondary)',
                flexShrink: 0,
              }}
            />
            <span
              style={{
                flex: 1,
                fontSize: '13px',
                fontWeight: 500,
                color: completed ? 'var(--primary-color)' : 'var(--text-primary)',
                textDecoration: completed ? 'line-through' : 'none',
                opacity: completed ? 0.8 : 1,
              }}
            >
              {item.label}
            </span>
            {completed ? (
              <CheckCircleIcon width={18} height={18} style={{ color: 'var(--success-color)', flexShrink: 0 }} />
            ) : (
              <CircleIcon width={18} height={18} style={{ color: 'var(--text-disabled)', flexShrink: 0 }} />
            )}
          </button>
        );
      })}
    </div>
  );
}
