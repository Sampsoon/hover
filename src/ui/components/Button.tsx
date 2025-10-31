import { ReactNode } from 'react';
import { typography } from '../theme';

interface ButtonProps {
  onClick: () => void;
  children: ReactNode;
  variant?: 'primary' | 'ghost' | 'success' | 'icon';
  size?: 'sm' | 'md';
}

const baseStyle = {
  ...typography.smallLabel,
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  fontWeight: 500,
  transition: 'transform 0.1s ease, box-shadow 0.1s ease, color 0.15s ease',
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
    backgroundColor: 'var(--card-bg-active)',
    border: '1px solid var(--border-color)',
    color: 'var(--success-color)',
    boxShadow: 'var(--shadow-sm)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '8px',
  },
  ghost: {
    width: '40px',
    height: '40px',
    backgroundColor: 'var(--card-bg-active)',
    border: '1px solid var(--border-color)',
    color: 'var(--text-secondary)',
    boxShadow: 'var(--shadow-sm)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '8px',
  },
  icon: {
    width: '40px',
    height: '40px',
    backgroundColor: 'transparent',
    border: 'none',
    color: 'var(--text-secondary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '8px',
    boxShadow: 'none',
  },
};

export function Button({ onClick, children, variant = 'primary', size = 'md' }: ButtonProps) {
  const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.transform = 'scale(1.05)';
    if (variant === 'success' || variant === 'ghost') {
      e.currentTarget.style.boxShadow = 'var(--shadow-md)';
    }
    if (variant === 'ghost' || variant === 'icon') {
      e.currentTarget.style.color = 'var(--alert-color)';
    }
  };

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
    } else if (variant === 'icon') {
      e.currentTarget.style.boxShadow = 'none';
    } else {
      e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
    }
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.transform = 'scale(1)';
    if (variant === 'success' || variant === 'ghost') {
      e.currentTarget.style.boxShadow = 'var(--shadow-md)';
    } else if (variant === 'icon') {
      e.currentTarget.style.boxShadow = 'none';
    } else {
      e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
    }
    if (variant === 'ghost' || variant === 'icon') {
      e.currentTarget.style.color = 'var(--text-secondary)';
    }
  };

  const sizeOverrides =
    variant === 'primary'
      ? undefined
      : size === 'sm'
        ? { width: '28px', height: '28px', borderRadius: '6px' }
        : { width: '40px', height: '40px' };

  return (
    <button
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      style={{ ...baseStyle, ...variantStyles[variant], ...(sizeOverrides ?? {}) }}
    >
      {children}
    </button>
  );
}
