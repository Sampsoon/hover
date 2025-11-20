import { smallLabelTextStyle } from './styles';

interface InputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  placeholder?: string;
  type?: string;
  style?: React.CSSProperties;
}

const inputStyle = {
  ...smallLabelTextStyle,
  width: '100%',
  padding: '8px 10px',
  border: '1px solid var(--border-color)',
  borderRadius: '8px',
  backgroundColor: 'var(--input-bg)',
  color: 'var(--text-primary)',
  outline: 'none',
  boxShadow: 'inset 0 1px 1px rgba(var(--shadow-base), 0.04)',
};

export function Input({ value, onChange, onSubmit, placeholder, type, style }: InputProps) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => {
        onChange(e.target.value);
      }}
      onKeyDown={(e) => e.key === 'Enter' && onSubmit?.()}
      onFocus={(e) => {
        e.currentTarget.style.borderColor = 'var(--primary-color)';
        e.currentTarget.style.boxShadow = '0 0 0 2px var(--slider-bg-start)';
      }}
      onBlur={(e) => {
        e.currentTarget.style.borderColor = 'var(--border-color)';
        e.currentTarget.style.boxShadow = 'inset 0 1px 1px rgba(var(--shadow-base), 0.04)';
      }}
      placeholder={placeholder}
      style={{ ...inputStyle, ...style }}
    />
  );
}
