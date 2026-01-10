import { useEffect, useState } from 'react';
import { storage } from '../../../storage';
import { GithubIcon } from '../common';

const REPO_URL = 'https://github.com/Sampsoon/hover';

const cardStyle = {
  backgroundColor: 'var(--card-bg)',
  border: '1.5px solid var(--border-color)',
  borderRadius: '12px',
  padding: '20px 24px',
  boxShadow: 'var(--shadow-sm)',
};

const toggleRowStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '16px',
};

const toggleLabelStyle = {
  fontFamily: 'var(--font-family)',
  fontSize: '15px',
  fontWeight: 500,
  color: 'var(--text-primary)',
};

const toggleStyle = {
  position: 'relative' as const,
  width: '48px',
  height: '26px',
  backgroundColor: 'var(--border-color)',
  borderRadius: '13px',
  cursor: 'pointer',
  transition: 'background-color 0.2s ease',
  flexShrink: 0,
};

const toggleActiveStyle = {
  ...toggleStyle,
  backgroundColor: 'var(--primary-color)',
};

const toggleKnobStyle = {
  position: 'absolute' as const,
  top: '3px',
  left: '3px',
  width: '20px',
  height: '20px',
  backgroundColor: 'white',
  borderRadius: '50%',
  transition: 'transform 0.2s ease',
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)',
};

const toggleKnobActiveStyle = {
  ...toggleKnobStyle,
  transform: 'translateX(22px)',
};

const descriptionStyle = {
  fontFamily: 'var(--font-family)',
  fontSize: '13px',
  lineHeight: '1.6',
  color: 'var(--text-secondary)',
  marginTop: '16px',
  paddingTop: '16px',
  borderTop: '1px solid var(--border-color)',
};

const listStyle = {
  margin: '10px 0 0 0',
  paddingLeft: '18px',
};

const listItemStyle = {
  marginBottom: '4px',
};

const linkStyle = {
  marginTop: '14px',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
  fontFamily: 'var(--font-family)',
  fontSize: '13px',
  color: 'var(--text-secondary)',
  textDecoration: 'none',
  transition: 'color 0.15s ease',
};

export function PrivacySettings() {
  const [telemetryEnabled, setTelemetryEnabled] = useState(true);

  useEffect(() => {
    const load = async () => {
      const enabled = await storage.telemetryEnabled.get();
      setTelemetryEnabled(enabled);
    };
    void load();

    return storage.telemetryEnabled.onChange((newValue) => {
      setTelemetryEnabled(newValue);
    });
  }, []);

  const handleToggle = () => {
    const newValue = !telemetryEnabled;
    setTelemetryEnabled(newValue);
    void storage.telemetryEnabled.set(newValue);
  };

  return (
    <div>
      <div style={cardStyle}>
        <div style={toggleRowStyle}>
          <span style={toggleLabelStyle}>Share anonymous usage data</span>
          <div
            style={telemetryEnabled ? toggleActiveStyle : toggleStyle}
            onClick={handleToggle}
            role="switch"
            aria-checked={telemetryEnabled}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleToggle();
              }
            }}
          >
            <div style={telemetryEnabled ? toggleKnobActiveStyle : toggleKnobStyle} />
          </div>
        </div>

        <div style={descriptionStyle}>
          When enabled, Hover collects basic usage data:
          <ul style={listStyle}>
            <li style={listItemStyle}>Random visitor ID (not tied to your identity)</li>
            <li style={listItemStyle}>API provider used (OpenRouter or Custom)</li>
            <li style={listItemStyle}>Request size</li>
          </ul>
          <div style={{ marginTop: '12px' }}>No personal data, API keys, or page content is collected.</div>
          <a
            href={REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            style={linkStyle}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--primary-color)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--text-secondary)';
            }}
          >
            <GithubIcon width={16} height={16} />
            View source on GitHub
          </a>
        </div>
      </div>
    </div>
  );
}
