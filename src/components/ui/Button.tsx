import { ReactNode } from 'react';
import { typography } from '../../config/theme';

interface ButtonProps {
  onClick: () => void;
  children: ReactNode;
  variant?: 'primary' | 'ghost' | 'success';
}

const baseStyle = {
  ...typography.smallLabel,
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  fontWeight: 500,
  transition: 'transform 0.1s ease, box-shadow 0.1s ease',
  transform: 'scale(1)',
};

const variantStyles = {
  primary: {
    padding: '8px 12px',
    backgroundColor: 'transparent',
    color: 'var(--primary-color)',
    boxShadow: 'var(--shadow-sm)',
  },
  success: {
    width: '40px',
    height: '40px',
    backgroundColor: 'transparent',
    color: 'var(--success-color)',
    boxShadow: 'var(--shadow-md)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ghost: {
    width: '40px',
    height: '40px',
    backgroundColor: 'transparent',
    color: 'var(--text-secondary)',
    boxShadow: 'var(--shadow-md)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
};

export function Button({ onClick, children, variant = 'primary' }: ButtonProps) {
  const handleMouseDown = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.transform = 'scale(0.95)';
    if (variant === 'success' || variant === 'ghost') {
      e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.transform = 'scale(1)';
    if (variant === 'success' || variant === 'ghost') {
      e.currentTarget.style.boxShadow = 'var(--shadow-md)';
    } else {
      e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
    }
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.transform = 'scale(1)';
    if (variant === 'success' || variant === 'ghost') {
      e.currentTarget.style.boxShadow = 'var(--shadow-md)';
    } else {
      e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
    }
  };

  return (
    <button
      onClick={onClick}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      style={{ ...baseStyle, ...variantStyles[variant] }}
    >
      {children}
    </button>
  );
}
