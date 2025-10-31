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

const labelStyle = (disabled?: boolean) => ({
  fontFamily: 'var(--font-small-label-family)',
  fontWeight: 'var(--font-small-label-weight)',
  fontSize: 'var(--font-small-label-size)',
  lineHeight: 'var(--font-small-label-line-height)',
  display: 'block',
  marginBottom: '6px',
  color: disabled ? 'var(--text-disabled)' : 'var(--text-primary)',
});

const inputStyle = (disabled?: boolean) => ({
  fontFamily: 'var(--font-small-label-family)',
  fontWeight: 'var(--font-small-label-weight)',
  fontSize: 'var(--font-small-label-size)',
  lineHeight: 'var(--font-small-label-line-height)',
  width: '100%',
  padding: '8px 10px',
  border: disabled ? '1px solid var(--border-color)' : '1px solid rgba(107, 117, 201, 0.18)',
  borderRadius: '8px',
  backgroundColor: disabled ? 'transparent' : 'var(--bg-primary)',
  color: disabled ? 'var(--text-disabled)' : 'var(--text-primary)',
  outline: 'none',
  boxShadow: disabled ? 'none' : 'inset 0 1px 1px rgba(47, 43, 72, 0.04)',
});

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
    <div style={{ marginBottom: '12px' }}>
      <label style={labelStyle(disabled)}>
        {label}
        {linkText && linkHref && (
          <>
            {' '}
            <a
              href={linkHref}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--link-color)', textDecoration: 'none' }}
            >
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
        style={inputStyle(disabled)}
      />
    </div>
  );
}
