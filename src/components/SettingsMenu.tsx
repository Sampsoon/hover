type Tab = 'api' | 'websites' | 'contact';

interface SettingsMenuProps {
  selected: Tab;
  onSelect: (tab: Tab) => void;
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '6px',
    paddingRight: '16px',
    borderRight: '1.5px solid var(--border-color)',
    position: 'relative' as const,
  },
  slider: (index: number) => ({
    position: 'absolute' as const,
    width: 'calc(100% - 16px)',
    height: '52px',
    backgroundColor: 'var(--card-bg-inactive)',
    borderRadius: '8px',
    boxShadow: 'var(--shadow-md)',
    transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    transform: `translateY(calc(${(index * 62).toString()}px + 2px))`,
    zIndex: 0,
    pointerEvents: 'none' as const,
  }),
  button: (isSelected: boolean) => ({
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '16px 14px',
    borderRadius: '8px',
    backgroundColor: 'transparent',
    transition: 'color 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: isSelected ? 'var(--primary-color)' : 'var(--text-secondary)',
    position: 'relative' as const,
    zIndex: 1,
    overflow: 'hidden' as const,
    whiteSpace: 'nowrap' as const,
  }),
};

interface TabButtonProps {
  tab: Tab;
  selected: Tab;
  onSelect: (tab: Tab) => void;
  title: string;
  children: React.ReactNode;
}

function TabButton({ tab, selected, onSelect, title, children }: TabButtonProps) {
  const isSelected = selected === tab;

  return (
    <button
      onClick={() => {
        onSelect(tab);
      }}
      style={styles.button(isSelected)}
      title={title}
      onMouseEnter={(e) => {
        if (!isSelected) {
          e.currentTarget.style.backgroundColor = 'var(--card-bg-inactive)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isSelected) {
          e.currentTarget.style.backgroundColor = 'transparent';
        }
      }}
    >
      {children}
    </button>
  );
}

function KeyIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.65 10C11.7 7.31 8.9 5.5 5.77 6.12c-2.29.46-4.15 2.29-4.63 4.58C.32 14.57 3.26 18 7 18c2.61 0 4.83-1.67 5.65-4H17v2c0 1.1.9 2 2 2s2-.9 2-2v-2c1.1 0 2-.9 2-2s-.9-2-2-2h-8.35zM7 14c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z" />
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
    </svg>
  );
}

export function SettingsMenu({ selected, onSelect }: SettingsMenuProps) {
  const getSelectedIndex = () => {
    if (selected === 'api') {
      return 0;
    }
    if (selected === 'websites') {
      return 1;
    }
    return 2;
  };

  return (
    <div style={styles.container}>
      <div style={styles.slider(getSelectedIndex())} />
      <TabButton tab="api" selected={selected} onSelect={onSelect} title="API Key">
        <KeyIcon />
      </TabButton>
      <TabButton
        tab="websites"
        selected={selected}
        onSelect={onSelect}
        title="Block all websites & Allow run on all websites"
      >
        <GlobeIcon />
      </TabButton>
      <TabButton tab="contact" selected={selected} onSelect={onSelect} title="Contact">
        <MailIcon />
      </TabButton>
    </div>
  );
}
