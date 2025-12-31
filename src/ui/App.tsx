import browser from 'webextension-polyfill';
import { Button, GithubIcon, SettingsIcon, SetupChecklist } from './components';
import { useTheme } from './hooks';
import { ThemeMode } from '../storage';
import iconUrl from '/icons/icon.svg';
import iconDarkUrl from '/icons/icon-dark.svg';

const GITHUB_URL = 'https://github.com/Sampsoon/hover';

function useIsDarkMode(themeMode: ThemeMode) {
  if (themeMode === ThemeMode.DARK) {
    return true;
  }
  if (themeMode === ThemeMode.LIGHT) {
    return false;
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function App() {
  const { themeMode } = useTheme();
  const isDark = useIsDarkMode(themeMode);
  const handleOpenSettings = () => {
    void browser.runtime.openOptionsPage();
  };

  const handleOpenGithub = () => {
    window.open(GITHUB_URL, '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      style={{
        width: '320px',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px',
        }}
      >
        <h1
          style={{
            margin: 0,
            fontSize: '20px',
            fontWeight: 650,
            color: 'var(--text-primary)',
            letterSpacing: '-0.01em',
          }}
        >
          Hover
        </h1>
        <img src={isDark ? iconDarkUrl : iconUrl} alt="" width={24} height={24} />
      </div>

      <SetupChecklist />

      <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
        <Button
          onClick={handleOpenSettings}
          icon={<SettingsIcon width={18} height={18} />}
          style={{
            flex: 1,
            justifyContent: 'center',
            padding: '12px 16px',
            fontWeight: 600,
          }}
        >
          Settings
        </Button>

        <Button onClick={handleOpenGithub} style={{ padding: '12px' }}>
          <GithubIcon width={20} height={20} />
        </Button>
      </div>
    </div>
  );
}

export default App;
