import { useState, useRef, useEffect, useCallback } from 'react';
import { baseSliderStyle, ApiKeyIcon, GlobeIcon, ContactIcon } from '../common';

type Tab = 'api' | 'websites' | 'contact';

interface SettingsMenuProps {
  selected: Tab;
  onSelect: (tab: Tab) => void;
}

const ITEM_HEIGHT = 62;
const BUTTON_HEIGHT = 52;
const ITEM_GAP = 6;
const BORDER_WIDTH = 16;
const SLIDER_OFFSET = 2;

const tabs: { id: Tab; title: string; icon: React.ComponentType<React.SVGProps<SVGSVGElement>> }[] = [
  {
    id: 'api',
    title: 'API Key',
    icon: ApiKeyIcon,
  },
  {
    id: 'websites',
    title: 'Websites',
    icon: GlobeIcon,
  },
  {
    id: 'contact',
    title: 'Contact',
    icon: ContactIcon,
  },
];

const baseContainerStyle = {
  display: 'flex',
  flexDirection: 'column' as const,
  gap: `${ITEM_GAP.toString()}px`,
  paddingRight: `${BORDER_WIDTH.toString()}px`,
  borderRight: '1.5px solid var(--border-color)',
  position: 'relative' as const,
  userSelect: 'none' as const,
};

const containerStyle = (isDragging: boolean) => ({
  ...baseContainerStyle,
  cursor: isDragging ? 'grabbing' : 'grab',
});

const sliderStyle = (index: number, isDragging: boolean) => ({
  ...baseSliderStyle,
  width: `calc(100% - ${BORDER_WIDTH.toString()}px)`,
  height: `${BUTTON_HEIGHT.toString()}px`,
  transition: isDragging ? 'var(--transition-dragging)' : 'var(--transition-normal)',
  transform: `translateY(${(index * ITEM_HEIGHT + SLIDER_OFFSET).toString()}px)`,
});

const baseButtonStyle = {
  border: 'none',
  cursor: 'pointer',
  padding: '16px 14px',
  borderRadius: '8px',
  backgroundColor: 'transparent',
  zIndex: 1,
  position: 'relative' as const,
};

const buttonStyle = (isSelected: boolean) => ({
  ...baseButtonStyle,
  color: isSelected ? 'var(--primary-color)' : 'var(--text-secondary)',
});

export function SettingsMenu({ selected, onSelect }: SettingsMenuProps) {
  const selectedIndex = tabs.findIndex((tab) => tab.id === selected);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback(() => {
    setIsDragging(true);
  }, []);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) {
        return;
      }

      const rect = containerRef.current.getBoundingClientRect();
      const y = e.clientY - rect.top;
      const targetIndex = Math.max(0, Math.min(tabs.length - 1, Math.floor(y / ITEM_HEIGHT)));
      const targetTab = tabs[targetIndex];

      if (targetTab.id !== selected) {
        onSelect(targetTab.id);
      }
    },
    [isDragging, selected, onSelect],
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (!isDragging) {
      return;
    }

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const handleTabClick = useCallback(
    (tabId: Tab) => {
      if (!isDragging) {
        onSelect(tabId);
      }
    },
    [isDragging, onSelect],
  );

  return (
    <div ref={containerRef} style={containerStyle(isDragging)} onMouseDown={handleMouseDown}>
      <div style={sliderStyle(selectedIndex, isDragging)} />
      {tabs.map(({ id, title, icon: Icon }) => (
        <button
          key={id}
          onClick={() => {
            handleTabClick(id);
          }}
          style={buttonStyle(selected === id)}
          title={title}
        >
          <Icon width={24} height={24} />
        </button>
      ))}
    </div>
  );
}
