import { typography } from '../../config/theme';

interface InputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  placeholder?: string;
  type?: 'text' | 'password';
}

const styles = {
  ...typography.smallLabel,
  flex: 1,
  padding: '8px 12px',
  border: '1.5px solid var(--border-color)',
  borderRadius: '6px',
  backgroundColor: 'var(--input-bg)',
  color: 'var(--text-primary)',
  outline: 'none',
  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  boxShadow: 'var(--shadow-sm)',
};

export function Input({ value, onChange, onSubmit, placeholder, type = 'text' }: InputProps) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => {
        onChange(e.target.value);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && onSubmit) {
          onSubmit();
        }
      }}
      onFocus={(e) => {
        e.currentTarget.style.borderColor = 'var(--border-focus)';
        e.currentTarget.style.boxShadow = 'var(--shadow-md)';
      }}
      onBlur={(e) => {
        e.currentTarget.style.borderColor = 'var(--border-color)';
        e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
      }}
      placeholder={placeholder}
      style={styles}
    />
  );
}
