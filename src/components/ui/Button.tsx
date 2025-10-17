import { ReactNode } from 'react';
import { typography } from '../../config/theme';

interface ButtonProps {
  onClick: () => void;
  children: ReactNode;
  variant?: 'primary' | 'ghost' | 'success';
}

const styles = {
  base: {
    ...typography.smallLabel,
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    whiteSpace: 'nowrap' as const,
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    fontWeight: 500,
  },
  primary: {
    padding: '8px 12px',
    backgroundColor: 'transparent',
    color: 'var(--primary-color)',
    boxShadow: 'var(--shadow-sm)',
  },
  success: {
    padding: '0',
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
    padding: '0',
    width: '40px',
    height: '40px',
    background: 'none',
    backgroundColor: 'transparent',
    color: 'var(--text-secondary)',
    flexShrink: 0,
    boxShadow: 'var(--shadow-md)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
};

export function Button({ onClick, children, variant = 'primary' }: ButtonProps) {
  const variantStyle = variant === 'ghost' ? styles.ghost : variant === 'success' ? styles.success : styles.primary;

  return (
    <button onClick={onClick} style={{ ...styles.base, ...variantStyle }}>
      {children}
    </button>
  );
}
