import { useState, useRef, useEffect, useCallback } from 'react';

type Tab = 'api' | 'websites' | 'contact';

interface SettingsMenuProps {
  selected: Tab;
  onSelect: (tab: Tab) => void;
}

const tabs: { id: Tab; title: string; icon: string }[] = [
  {
    id: 'api',
    title: 'API Key',
    icon: 'M12.65 10C11.7 7.31 8.9 5.5 5.77 6.12c-2.29.46-4.15 2.29-4.63 4.58C.32 14.57 3.26 18 7 18c2.61 0 4.83-1.67 5.65-4H17v2c0 1.1.9 2 2 2s2-.9 2-2v-2c1.1 0 2-.9 2-2s-.9-2-2-2h-8.35zM7 14c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z',
  },
  {
    id: 'websites',
    title: 'Websites',
    icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z',
  },
  {
    id: 'contact',
    title: 'Contact',
    icon: 'M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z',
  },
];

const containerStyle = (isDragging: boolean) => ({
  display: 'flex',
  flexDirection: 'column' as const,
  gap: '6px',
  paddingRight: '16px',
  borderRight: '1.5px solid var(--border-color)',
  position: 'relative' as const,
  cursor: isDragging ? 'grabbing' : 'grab',
  userSelect: 'none' as const,
});

const sliderStyle = (index: number, isDragging: boolean) => ({
  position: 'absolute' as const,
  width: 'calc(100% - 16px)',
  height: '52px',
  background: 'linear-gradient(180deg, rgba(107, 117, 201, 0.14) 0%, rgba(107, 117, 201, 0.10) 100%)',
  border: '1px solid rgba(107, 117, 201, 0.35)',
  borderRadius: '10px',
  boxShadow: '0 8px 20px rgba(107, 117, 201, 0.18), 0 2px 4px rgba(47, 43, 72, 0.08)',
  transition: isDragging
    ? 'transform 0.15s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
    : 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s ease, background 0.3s ease',
  transform: `translateY(${(index * 62 + 2).toString()}px)`,
  zIndex: 0,
  pointerEvents: 'none' as const,
  backdropFilter: 'saturate(120%) blur(2px)',
  WebkitBackdropFilter: 'saturate(120%) blur(2px)',
});

const buttonStyle = (isSelected: boolean) => ({
  border: 'none',
  cursor: 'pointer',
  padding: '16px 14px',
  borderRadius: '8px',
  backgroundColor: 'transparent',
  color: isSelected ? 'var(--primary-color)' : 'var(--text-secondary)',
  zIndex: 1,
  position: 'relative' as const,
});

export function SettingsMenu({ selected, onSelect }: SettingsMenuProps) {
  const selectedIndex = tabs.findIndex((tab) => tab.id === selected);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = () => {
    setIsDragging(true);
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const y = e.clientY - rect.top;
      const itemHeight = 62; // height (52px) + gap (6px) + padding

      // Determine which tab based on vertical position
      const targetIndex = Math.max(0, Math.min(tabs.length - 1, Math.floor(y / itemHeight)));
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

  // Add/remove global mouse event listeners
  useEffect(() => {
    if (!isDragging) return;

    const handleGlobalMouseMove = (e: MouseEvent) => {
      handleMouseMove(e);
    };
    const handleGlobalMouseUp = () => {
      handleMouseUp();
    };

    document.addEventListener('mousemove', handleGlobalMouseMove);
    document.addEventListener('mouseup', handleGlobalMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return (
    <div ref={containerRef} style={containerStyle(isDragging)} onMouseDown={handleMouseDown}>
      <div style={sliderStyle(selectedIndex, isDragging)} />
      {tabs.map(({ id, title, icon }) => (
        <button
          key={id}
          onClick={() => {
            if (!isDragging) {
              onSelect(id);
            }
          }}
          style={buttonStyle(selected === id)}
          title={title}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d={icon} />
          </svg>
        </button>
      ))}
    </div>
  );
}
