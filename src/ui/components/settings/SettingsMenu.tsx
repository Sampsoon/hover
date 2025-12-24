import { useState, useRef, useEffect, useCallback } from 'react';
import { baseSliderStyle, ApiKeyIcon, GlobeIcon } from '../common';
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
];

export function SettingsMenu({ selected, onSelect, animate }: SettingsMenuProps) {
  const selectedIndex = Math.max(
    0,
    tabs.findIndex((tab) => tab.id === selected),
  );
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback(() => {
    setIsDragging(true);
  }, []);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const y = e.clientY - rect.top - SIDEBAR_PADDING;
      const itemHeight = BUTTON_HEIGHT + ITEM_GAP;
      const targetIndex = Math.max(0, Math.min(tabs.length - 1, Math.floor(Math.max(0, y) / itemHeight)));

      if (tabs[targetIndex].id !== selected) {
        onSelect(tabs[targetIndex].id);
      }
    },
    [isDragging, selected, onSelect],
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (!isDragging) return;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const handleTabClick = useCallback(
    (tabId: SettingsTab) => {
      if (!isDragging) onSelect(tabId);
    },
    [isDragging, onSelect],
  );

  const sliderY = SIDEBAR_PADDING + selectedIndex * (BUTTON_HEIGHT + ITEM_GAP);

  return (
    <nav
      ref={containerRef}
      onMouseDown={handleMouseDown}
      style={{
        flexShrink: 0,
        padding: SIDEBAR_PADDING,
        borderRight: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        gap: ITEM_GAP,
        position: 'relative',
        userSelect: 'none',
        cursor: isDragging ? 'grabbing' : 'grab',
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
          transition: animate ? (isDragging ? 'var(--transition-dragging)' : 'var(--transition-normal)') : 'none',
        }}
      />

      {/* Tab buttons */}
      {tabs.map(({ id, title, icon: Icon }) => (
        <button
          key={id}
          onClick={() => {
            handleTabClick(id);
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
