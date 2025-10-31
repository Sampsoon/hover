import { typography } from '../theme';

interface InputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  placeholder?: string;
  type?: 'text' | 'password';
}

const inputStyle = {
  ...typography.smallLabel,
  flex: 1,
  padding: '8px 12px',
  border: '1.5px solid var(--border-color)',
  borderRadius: '6px',
  backgroundColor: 'var(--input-bg)',
  color: 'var(--text-primary)',
  outline: 'none',
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
      onKeyDown={(e) => e.key === 'Enter' && onSubmit?.()}
      placeholder={placeholder}
      style={inputStyle}
    />
  );
}
