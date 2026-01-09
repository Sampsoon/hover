import { useEffect, useState } from 'react';
import { ApiConfiguration, SettingsMenu, WebsiteList, ThemeToggle, PrivacySettings } from './components';
import { storage, SettingsTab, TAB_QUERY_PARAM } from '../storage';
import { useTheme } from './hooks';

function OptionsApp() {
  const [selectedTab, setSelectedTab] = useState<SettingsTab>(SettingsTab.API);
  const [animate, setAnimate] = useState(false);
  const { themeMode, setTheme } = useTheme();

  useEffect(() => {
    const init = async () => {
      const params = new URLSearchParams(window.location.search);
      let tab = params.get(TAB_QUERY_PARAM) as SettingsTab | null;

      if (tab !== SettingsTab.API && tab !== SettingsTab.WEBSITES && tab !== SettingsTab.PRIVACY) {
        tab = (await storage.selectedTab.get()) ?? SettingsTab.API;
      }

      setSelectedTab(tab);

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setAnimate(true);
        });
      });
    };

    void init();
  }, []);

  const handleTabSelect = (tab: SettingsTab) => {
    setSelectedTab(tab);
    void storage.selectedTab.set(tab);
  };

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        position: 'relative',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 16,
          right: 24,
          zIndex: 10,
        }}
      >
        <ThemeToggle themeMode={themeMode} onThemeChange={setTheme} />
      </div>

      <SettingsMenu selected={selectedTab} onSelect={handleTabSelect} animate={animate} />

      <main
        style={{
          flex: 1,
          padding: '32px 48px',
          width: '100%',
          maxWidth: selectedTab === SettingsTab.WEBSITES ? 'none' : '900px',
        }}
      >
        {selectedTab === SettingsTab.API && <ApiConfiguration />}
        {selectedTab === SettingsTab.WEBSITES && <WebsiteList />}
        {selectedTab === SettingsTab.PRIVACY && <PrivacySettings />}
      </main>
    </div>
  );
}

export default OptionsApp;
