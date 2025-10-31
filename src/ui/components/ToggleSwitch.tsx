import { useState, useRef, useEffect, useCallback } from 'react';

interface ToggleSwitchProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: readonly [T, T];
  labels: readonly [string, string];
}

const PADDING_PX = 8;
const H_GAP_PX = 12;
const V_GAP_PX = 6;

const containerStyle = (isDragging: boolean) => ({
  display: 'flex' as const,
  backgroundColor: 'var(--card-bg-inactive)',
  border: '1.5px solid var(--border-color)',
  borderRadius: '8px',
  padding: `${PADDING_PX.toString()}px`,
  position: 'relative' as const,
  boxShadow: 'var(--shadow-sm)',
  width: '100%',
  cursor: isDragging ? 'grabbing' : 'grab',
  userSelect: 'none' as const,
});

const sliderStyle = (isFirstSelected: boolean, isDragging: boolean) => ({
  position: 'absolute' as const,
  width: `calc(50% - ${(H_GAP_PX * 2).toString()}px)`,
  height: `calc(100% - ${(V_GAP_PX * 2).toString()}px)`,
  background: 'linear-gradient(180deg, rgba(107, 117, 201, 0.14) 0%, rgba(107, 117, 201, 0.10) 100%)',
  border: '1px solid rgba(107, 117, 201, 0.35)',
  borderRadius: '10px',
  transition: isDragging
    ? 'left 0.15s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
    : 'left 0.25s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s ease, background 0.3s ease',
  top: `${V_GAP_PX.toString()}px`,
  left: isFirstSelected ? `${H_GAP_PX.toString()}px` : `calc(50% + ${H_GAP_PX.toString()}px)`,
  boxShadow: '0 8px 20px rgba(107, 117, 201, 0.18), 0 2px 4px rgba(47, 43, 72, 0.08)',
  zIndex: 0,
  pointerEvents: 'none' as const,
  backdropFilter: 'saturate(120%) blur(2px)',
  WebkitBackdropFilter: 'saturate(120%) blur(2px)',
});

const buttonStyle = (isSelected: boolean) => ({
  fontFamily: 'var(--font-small-label-family)',
  fontWeight: 'var(--font-small-label-weight)',
  fontSize: 'var(--font-small-label-size)',
  lineHeight: 'var(--font-small-label-line-height)',
  padding: '6px 12px',
  border: 'none',
  background: 'none',
  cursor: 'pointer',
  color: isSelected ? 'var(--primary-color)' : 'var(--text-secondary)',
  position: 'relative' as const,
  zIndex: 1,
  flex: 1,
});

export function ToggleSwitch<T extends string>({ value, onChange, options, labels }: ToggleSwitchProps<T>) {
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef<number>(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    startXRef.current = e.clientX;
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const width = rect.width;
      const midpoint = width / 2;

      // Determine which option based on position
      const shouldBeFirst = x < midpoint;
      const targetOption = shouldBeFirst ? options[0] : options[1];

      if (targetOption !== value) {
        onChange(targetOption);
      }
    },
    [isDragging, value, onChange, options],
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
      <div style={sliderStyle(value === options[0], isDragging)} />
      {options.map((option, index) => (
        <button
          key={option}
          onClick={() => {
            if (!isDragging) {
              onChange(option);
            }
          }}
          style={buttonStyle(value === option)}
        >
          {labels[index]}
        </button>
      ))}
    </div>
  );
}
