import { typography } from '../config/theme';

interface FormFieldProps {
  label: string;
  type?: 'text' | 'password';
  placeholder?: string;
  disabled?: boolean;
  linkText?: string;
  linkHref?: string;
  value?: string;
  onChange?: (value: string) => void;
}

const styles = {
  container: { marginBottom: '12px' },
  label: (disabled?: boolean) => ({
    ...typography.smallLabel,
    display: 'block',
    marginBottom: '6px',
    color: disabled ? 'var(--text-disabled)' : 'var(--text-primary)',
  }),
  link: {
    color: 'var(--link-color)',
    textDecoration: 'none',
  },
  input: (disabled?: boolean) => ({
    ...typography.smallLabel,
    width: '100%',
    padding: '8px 10px',
    border: '1px solid var(--border-color)',
    borderRadius: '4px',
    backgroundColor: disabled ? 'transparent' : 'var(--input-bg)',
    color: disabled ? 'var(--text-disabled)' : 'var(--text-primary)',
    outline: 'none',
    transition: 'all 0.2s',
  }),
};

export function FormField({
  label,
  type = 'text',
  placeholder,
  disabled,
  linkText,
  linkHref,
  value,
  onChange,
}: FormFieldProps) {
  return (
    <div style={styles.container}>
      <label style={styles.label(disabled)}>
        {label}
        {linkText && linkHref && (
          <>
            {' '}
            <a href={linkHref} target="_blank" rel="noopener noreferrer" style={styles.link}>
              ({linkText})
            </a>
          </>
        )}
      </label>
      <input
        type={type}
        placeholder={placeholder}
        disabled={disabled}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        style={styles.input(disabled)}
        onFocus={(e) => !disabled && (e.target.style.borderColor = 'var(--border-focus)')}
        onBlur={(e) => (e.target.style.borderColor = 'var(--border-color)')}
      />
    </div>
  );
}
