import { typography } from '../../config/theme';

interface ToggleSwitchProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: readonly [T, T];
  labels: readonly [string, string];
}

const styles = {
  container: {
    display: 'inline-flex' as const,
    backgroundColor: 'var(--card-bg-inactive)',
    border: '1.5px solid var(--border-color)',
    borderRadius: '8px',
    padding: '3px',
    position: 'relative' as const,
    boxShadow: 'var(--shadow-sm)',
  },
  slider: {
    position: 'absolute' as const,
    width: 'calc(50% - 4px)',
    height: 'calc(100% - 6px)',
    backgroundColor: 'transparent',
    borderRadius: '6px',
    transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    zIndex: 0,
    top: '3px',
    left: '3px',
    boxShadow: 'var(--shadow-md)',
  },
  button: {
    ...typography.smallLabel,
    padding: '8px 16px',
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    transition: 'color 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    position: 'relative' as const,
    zIndex: 1,
    fontWeight: 500,
  },
};

export function ToggleSwitch<T extends string>({ value, onChange, options, labels }: ToggleSwitchProps<T>) {
  const isFirstSelected = value === options[0];

  return (
    <div style={styles.container}>
      <div
        style={{ ...styles.slider, transform: isFirstSelected ? 'translateX(0)' : 'translateX(calc(100% + 4px))' }}
      />
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
