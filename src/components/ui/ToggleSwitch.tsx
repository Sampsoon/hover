import { useState, useRef, useEffect, useCallback } from 'react';
import { typography } from '../../config/theme';

interface ToggleSwitchProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: readonly [T, T];
  labels: readonly [string, string];
}

const PADDING_PX = 8;
const H_GAP_PX = 12; // horizontal inner gutter inside each half
const V_GAP_PX = 6; // vertical inner gutter

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
  // Ensure symmetrical spacing: inner gutters only, container padding handled by parent
  width: `calc(50% - ${(H_GAP_PX * 2).toString()}px)`,
  height: `calc(100% - ${(V_GAP_PX * 2).toString()}px)`,
  backgroundColor: 'transparent',
  borderRadius: '6px',
  transition: isDragging
    ? 'left 0.15s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
    : 'left 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
  top: `${V_GAP_PX.toString()}px`,
  left: isFirstSelected ? `${H_GAP_PX.toString()}px` : `calc(50% + ${H_GAP_PX.toString()}px)`,
  boxShadow: 'var(--shadow-md)',
});

const buttonStyle = (isSelected: boolean) => ({
  ...typography.smallLabel,
  padding: '6px 12px',
  border: 'none',
  background: 'none',
  cursor: 'pointer',
  color: isSelected ? 'var(--primary-color)' : 'var(--text-secondary)',
  position: 'relative' as const,
  zIndex: 1,
  fontWeight: 500,
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
