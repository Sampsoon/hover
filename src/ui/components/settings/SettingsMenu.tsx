import { baseSliderStyle, ApiKeyIcon, GlobeIcon, ShieldIcon } from '../common';
import { SettingsTab } from '../../../storage';

interface SettingsMenuProps {
  selected: SettingsTab;
  onSelect: (tab: SettingsTab) => void;
  animate: boolean;
}

const BUTTON_HEIGHT = 48;
const ITEM_GAP = 4;
const SIDEBAR_PADDING = 24;

const tabs: { id: SettingsTab; title: string; icon: React.ComponentType<React.SVGProps<SVGSVGElement>> }[] = [
  { id: SettingsTab.API, title: 'API Key Configuration', icon: ApiKeyIcon },
  { id: SettingsTab.WEBSITES, title: 'Website Permissions', icon: GlobeIcon },
  { id: SettingsTab.PRIVACY, title: 'Privacy', icon: ShieldIcon },
];

export function SettingsMenu({ selected, onSelect, animate }: SettingsMenuProps) {
  const selectedIndex = Math.max(
    0,
    tabs.findIndex((tab) => tab.id === selected),
  );

  const sliderY = SIDEBAR_PADDING + selectedIndex * (BUTTON_HEIGHT + ITEM_GAP);

  return (
    <nav
      style={{
        flexShrink: 0,
        padding: SIDEBAR_PADDING,
        borderRight: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        gap: ITEM_GAP,
        position: 'relative',
      }}
    >
      {/* Animated slider background */}
      <div
        style={{
          ...baseSliderStyle,
          position: 'absolute',
          left: SIDEBAR_PADDING,
          right: SIDEBAR_PADDING,
          height: BUTTON_HEIGHT,
          top: 0,
          transform: `translateY(${sliderY.toString()}px)`,
          transition: animate ? 'var(--transition-normal)' : 'none',
        }}
      />

      {/* Tab buttons */}
      {tabs.map(({ id, title, icon: Icon }) => (
        <button
          key={id}
          onClick={() => {
            onSelect(id);
          }}
          title={title}
          style={{
            position: 'relative',
            zIndex: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            height: BUTTON_HEIGHT,
            padding: '0 18px',
            border: 'none',
            borderRadius: 8,
            backgroundColor: 'transparent',
            color: selected === id ? 'var(--primary-color)' : 'var(--text-secondary)',
            cursor: 'pointer',
            transition: 'color 0.15s ease',
            whiteSpace: 'nowrap',
          }}
        >
          <Icon width={20} height={20} style={{ flexShrink: 0 }} />
          <span style={{ fontSize: 14, fontWeight: 500 }}>{title}</span>
        </button>
      ))}
    </nav>
  );
}
