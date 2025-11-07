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
  border: '1px solid rgba(107, 117, 201, 0.18)',
  borderRadius: '8px',
  backgroundColor: 'var(--bg-primary)',
  color: 'var(--text-primary)',
  outline: 'none',
  boxShadow: 'inset 0 1px 1px rgba(47, 43, 72, 0.04)',
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
      placeholder={placeholder}
      style={{ ...inputStyle, ...style }}
    />
  );
}
