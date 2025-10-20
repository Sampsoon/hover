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

const containerStyle = {
  display: 'flex' as const,
  backgroundColor: 'var(--card-bg-inactive)',
  border: '1.5px solid var(--border-color)',
  borderRadius: '8px',
  padding: `${PADDING_PX.toString()}px`,
  position: 'relative' as const,
  boxShadow: 'var(--shadow-sm)',
  width: '100%',
};

const sliderStyle = (isFirstSelected: boolean) => ({
  position: 'absolute' as const,
  // Ensure symmetrical spacing: inner gutters only, container padding handled by parent
  width: `calc(50% - ${(H_GAP_PX * 2).toString()}px)`,
  height: `calc(100% - ${(V_GAP_PX * 2).toString()}px)`,
  backgroundColor: 'transparent',
  borderRadius: '6px',
  transition: 'left 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
  top: `${V_GAP_PX.toString()}px`,
  left: isFirstSelected ? `${H_GAP_PX.toString()}px` : `calc(50% + ${H_GAP_PX.toString()}px)`,
  boxShadow: 'var(--shadow-md)',
});

const buttonStyle = (isSelected: boolean) => ({
  ...typography.smallLabel,
  padding: '12px 24px',
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
  return (
    <div style={containerStyle}>
      <div style={sliderStyle(value === options[0])} />
      {options.map((option, index) => (
        <button
          key={option}
          onClick={() => {
            onChange(option);
          }}
          style={buttonStyle(value === option)}
        >
          {labels[index]}
        </button>
      ))}
    </div>
  );
}
