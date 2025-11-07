import { useState, useRef, useEffect, useCallback } from 'react';
import { smallLabelTextStyle, baseSliderStyle } from './styles';

interface ToggleSwitchProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: readonly [T, T];
  labels: readonly [string, string];
}

const PADDING_PX = 8;
const H_GAP_PX = 12;
const V_GAP_PX = 6;

const TRANSITION_DRAGGING_LEFT = 'left 0.15s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
const TRANSITION_NORMAL_LEFT = 'left 0.25s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s ease, background 0.3s ease';

const baseContainerStyle = {
  display: 'flex' as const,
  backgroundColor: 'var(--card-bg)',
  border: '1.5px solid var(--border-color)',
  borderRadius: '8px',
  padding: `${PADDING_PX.toString()}px`,
  position: 'relative' as const,
  boxShadow: 'var(--shadow-sm)',
  width: '100%',
  userSelect: 'none' as const,
};

const containerStyle = (isDragging: boolean) => ({
  ...baseContainerStyle,
  cursor: isDragging ? 'grabbing' : 'grab',
});

const sliderStyle = (isFirstSelected: boolean, isDragging: boolean) => ({
  ...baseSliderStyle,
  width: `calc(50% - ${(H_GAP_PX * 2).toString()}px)`,
  height: `calc(100% - ${(V_GAP_PX * 2).toString()}px)`,
  top: `${V_GAP_PX.toString()}px`,
  transition: isDragging ? TRANSITION_DRAGGING_LEFT : TRANSITION_NORMAL_LEFT,
  left: isFirstSelected ? `${H_GAP_PX.toString()}px` : `calc(50% + ${H_GAP_PX.toString()}px)`,
});

const baseButtonStyle = {
  ...smallLabelTextStyle,
  padding: '6px 12px',
  border: 'none',
  background: 'none',
  cursor: 'pointer',
  position: 'relative' as const,
  zIndex: 1,
  flex: 1,
};

const buttonStyle = (isSelected: boolean) => ({
  ...baseButtonStyle,
  color: isSelected ? 'var(--primary-color)' : 'var(--text-secondary)',
});

export function ToggleSwitch<T extends string>({ value, onChange, options, labels }: ToggleSwitchProps<T>) {
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
      const x = e.clientX - rect.left;
      const midpoint = rect.width / 2;
      const targetOption = x < midpoint ? options[0] : options[1];

      if (targetOption !== value) {
        onChange(targetOption);
      }
    },
    [isDragging, value, onChange, options],
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

  const handleOptionClick = useCallback(
    (option: T) => {
      if (!isDragging) {
        onChange(option);
      }
    },
    [isDragging, onChange],
  );

  return (
    <div ref={containerRef} style={containerStyle(isDragging)} onMouseDown={handleMouseDown}>
      <div style={sliderStyle(value === options[0], isDragging)} />
      {options.map((option, index) => (
        <button
          key={option}
          onClick={() => {
            handleOptionClick(option);
          }}
          style={buttonStyle(value === option)}
        >
          {labels[index]}
        </button>
      ))}
    </div>
  );
}
