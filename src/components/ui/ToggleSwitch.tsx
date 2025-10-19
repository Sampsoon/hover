import { typography } from '../../config/theme';

interface ToggleSwitchProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: readonly [T, T];
  labels: readonly [string, string];
}

const PADDING_PX = 3;

const styles = {
  container: {
    display: 'inline-flex' as const,
    backgroundColor: 'var(--card-bg-inactive)',
    border: '1.5px solid var(--border-color)',
    borderRadius: '8px',
    padding: `${PADDING_PX.toString()}px`,
    position: 'relative' as const,
    boxShadow: 'var(--shadow-sm)',
    width: '100%',
    boxSizing: 'border-box' as const,
  },
  slider: {
    position: 'absolute' as const,
    width: `calc(50% - ${PADDING_PX.toString()}px)`,
    height: `calc(100% - ${(PADDING_PX * 2).toString()}px)`,
    backgroundColor: 'transparent',
    borderRadius: '6px',
    transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    zIndex: 0,
    top: `${PADDING_PX.toString()}px`,
    left: `${PADDING_PX.toString()}px`,
    boxShadow: 'var(--shadow-md)',
  },
  button: {
    ...typography.smallLabel,
    padding: '8px 24px',
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    transition: 'color 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    position: 'relative' as const,
    zIndex: 1,
    fontWeight: 500,
    textAlign: 'center' as const,
    flex: 1,
  },
};

export function ToggleSwitch<T extends string>({ value, onChange, options, labels }: ToggleSwitchProps<T>) {
  const isFirstSelected = value === options[0];

  return (
    <div style={styles.container}>
      <div style={{ ...styles.slider, transform: isFirstSelected ? 'translateX(0)' : 'translateX(100%)' }} />
      {options.map((option, index) => (
        <button
          key={option}
          onClick={() => {
            onChange(option);
          }}
          style={{ ...styles.button, color: value === option ? 'var(--primary-color)' : 'var(--text-secondary)' }}
        >
          {labels[index]}
        </button>
      ))}
    </div>
  );
}
