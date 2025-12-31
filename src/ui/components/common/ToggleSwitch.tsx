import { smallLabelTextStyle, baseSliderStyle } from './styles';

interface ToggleSwitchProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: readonly [T, T];
  labels: readonly [string, string];
  animate?: boolean;
}

const PADDING_PX = 8;
const H_GAP_PX = 12;
const V_GAP_PX = 6;

const TRANSITION_NORMAL = 'left 0.25s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s ease, background 0.3s ease';

const containerStyle = {
  display: 'flex' as const,
  backgroundColor: 'var(--card-bg)',
  border: '1.5px solid var(--border-color)',
  borderRadius: '8px',
  padding: `${PADDING_PX.toString()}px`,
  position: 'relative' as const,
  boxShadow: 'var(--shadow-sm)',
  width: '100%',
};

const sliderStyle = (isFirstSelected: boolean, animate: boolean) => ({
  ...baseSliderStyle,
  width: `calc(50% - ${(H_GAP_PX * 2).toString()}px)`,
  height: `calc(100% - ${(V_GAP_PX * 2).toString()}px)`,
  top: `${V_GAP_PX.toString()}px`,
  transition: animate ? TRANSITION_NORMAL : 'none',
  left: isFirstSelected ? `${H_GAP_PX.toString()}px` : `calc(50% + ${H_GAP_PX.toString()}px)`,
});

const buttonStyle = (isSelected: boolean) => ({
  ...smallLabelTextStyle,
  padding: '6px 12px',
  border: 'none',
  background: 'none',
  cursor: 'pointer',
  position: 'relative' as const,
  zIndex: 1,
  flex: 1,
  color: isSelected ? 'var(--primary-color)' : 'var(--text-secondary)',
});

export function ToggleSwitch<T extends string>({
  value,
  onChange,
  options,
  labels,
  animate = true,
}: ToggleSwitchProps<T>) {
  return (
    <div style={containerStyle}>
      <div style={sliderStyle(value === options[0], animate)} />
      {options.map((option, index) => (
        <button
          key={option}
          onClick={() => onChange(option)}
          style={buttonStyle(value === option)}
        >
          {labels[index]}
        </button>
      ))}
    </div>
  );
}
