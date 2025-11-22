import { useState } from 'react';
import { Input } from './Input';
import { EyeIcon } from './Icons';

interface PasswordInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onShowChange?: (show: boolean) => void;
}

export function PasswordInput({ value, onChange, placeholder, onShowChange }: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  const handleShowChange = (show: boolean) => {
    setShowPassword(show);
    onShowChange?.(show);
  };

  return (
    <div style={{ position: 'relative' }}>
      <Input type={showPassword ? 'text' : 'password'} placeholder={placeholder} value={value} onChange={onChange} />
      <button
        onMouseDown={() => {
          handleShowChange(true);
        }}
        onMouseUp={() => {
          handleShowChange(false);
        }}
        onMouseLeave={() => {
          handleShowChange(false);
        }}
        style={{
          position: 'absolute',
          right: '10px',
          top: '50%',
          transform: 'translateY(-50%)',
          padding: '4px',
          border: 'none',
          background: 'transparent',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: showPassword ? 1 : 0.5,
          transition: 'opacity 0.2s',
        }}
      >
        <EyeIcon />
      </button>
    </div>
  );
}
