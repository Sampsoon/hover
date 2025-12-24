import browser from 'webextension-polyfill';
import { Button, GithubIcon, SettingsIcon, SetupChecklist } from './components';
import iconUrl from '/icons/icon.svg';

const GITHUB_URL = 'https://github.com/Sampsoon/vibey_lsp';

function App() {
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
          Vibey LSP
        </h1>
        <img src={iconUrl} alt="" width={24} height={24} />
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
