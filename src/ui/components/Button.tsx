import { ReactNode } from 'react';

interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  icon?: ReactNode;
  style?: React.CSSProperties;
  type?: 'button' | 'submit' | 'reset';
}

export function Button({ children, onClick, icon, style, type = 'button' }: ButtonProps) {
  return (
    <button
      type={type}
      style={{
        backgroundColor: 'var(--card-bg)',
        color: 'var(--text-primary)',
        border: '1px solid var(--border-color)',
        padding: '8px 12px',
        borderRadius: '6px',
        cursor: 'pointer',
        fontSize: 'var(--font-body-size)',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        transition: 'all 0.2s ease',
        ...style,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = 'var(--card-bg-hover)';
        e.currentTarget.style.borderColor = 'var(--primary-color)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'var(--card-bg)';
        e.currentTarget.style.borderColor = 'var(--border-color)';
      }}
      onClick={onClick}
    >
      {icon}
      {children}
    </button>
  );
}
