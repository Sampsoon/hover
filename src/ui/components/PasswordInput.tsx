import { useState } from 'react';
import { Input } from './Input';

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
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ display: 'block' }}
        >
          <path
            d="M12 5C7 5 2.73 8.11 1 12.5C2.73 16.89 7 20 12 20C17 20 21.27 16.89 23 12.5C21.27 8.11 17 5 12 5Z"
            stroke="var(--text-primary)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle
            cx="12"
            cy="12.5"
            r="3.5"
            stroke="var(--text-primary)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>
  );
}
