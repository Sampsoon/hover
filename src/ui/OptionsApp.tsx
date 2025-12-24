import { useEffect, useState } from 'react';
import { ApiConfiguration, SettingsMenu, WebsiteList } from './components';
import { storage, SettingsTab, TAB_QUERY_PARAM } from '../storage';

function OptionsApp() {
  const [selectedTab, setSelectedTab] = useState<SettingsTab>(SettingsTab.API);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    const init = async () => {
      const params = new URLSearchParams(window.location.search);
      let tab = params.get(TAB_QUERY_PARAM) as SettingsTab | null;

      if (tab !== SettingsTab.API && tab !== SettingsTab.WEBSITES) {
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
      }}
    >
      <SettingsMenu selected={selectedTab} onSelect={handleTabSelect} animate={animate} />

      <main
        style={{
          flex: 1,
          padding: '32px 48px',
          width: '100%',
          maxWidth: selectedTab === SettingsTab.WEBSITES ? 'none' : '900px',
        }}
      >
        <h1 style={{ color: 'var(--text-primary)', margin: '0 0 20px 0', fontSize: '22px' }}>
          {selectedTab === SettingsTab.API ? 'API Configuration' : 'Website Settings'}
        </h1>
        {selectedTab === SettingsTab.API && <ApiConfiguration />}
        {selectedTab === SettingsTab.WEBSITES && <WebsiteList />}
      </main>
    </div>
  );
}

export default OptionsApp;
