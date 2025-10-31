import { useState } from 'react';
import { ApiConfiguration, SettingsMenu, WebsiteList, ContactSection } from './components';

function App() {
  const [selectedTab, setSelectedTab] = useState<'api' | 'websites' | 'contact'>('api');

  return (
    <div
      style={{
        width: '800px',
        height: '600px',
        padding: '20px 16px',
        display: 'flex',
        gap: '16px',
        overflow: 'hidden',
      }}
    >
      <SettingsMenu selected={selectedTab} onSelect={setSelectedTab} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {selectedTab === 'api' && <ApiConfiguration />}
        {selectedTab === 'websites' && <WebsiteList />}
        {selectedTab === 'contact' && <ContactSection />}
      </div>
    </div>
  );
}

export default App;
