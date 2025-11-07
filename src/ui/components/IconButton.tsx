import { ReactNode } from 'react';
import { smallLabelTextStyle } from './styles';

interface IconButtonProps {
  onClick: () => void;
  children: ReactNode;
}

const iconButtonStyle = {
  ...smallLabelTextStyle,
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  transition: 'transform 0.1s ease, box-shadow 0.1s ease, color 0.15s ease',
  transform: 'scale(1)',
  width: '28px',
  height: '28px',
  backgroundColor: 'transparent',
  color: 'var(--text-secondary)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxShadow: 'none',
};

export function IconButton({ onClick, children }: IconButtonProps) {
  const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.transform = 'scale(1.05)';
    e.currentTarget.style.color = 'var(--alert-color)';
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.transform = 'scale(0.95)';
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.transform = 'scale(1)';
    e.currentTarget.style.boxShadow = 'none';
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.transform = 'scale(1)';
    e.currentTarget.style.boxShadow = 'none';
    e.currentTarget.style.color = 'var(--text-secondary)';
  };

  return (
    <button
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      style={iconButtonStyle}
    >
      {children}
    </button>
  );
}
