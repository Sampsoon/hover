import { ReactNode } from 'react';
import { bodyTextStyle } from './styles';

interface RadioOptionProps {
  id: string;
  label: string;
  selected: boolean;
  onSelect: () => void;
  children?: ReactNode;
}

const containerStyle = (selected: boolean) => ({
  border: selected ? `1px solid var(--radio-selected-border)` : '1px solid var(--border-color)',
  borderRadius: '10px',
  padding: '12px',
  marginBottom: '10px',
  background: selected
    ? `linear-gradient(180deg, var(--radio-selected-bg-start) 0%, var(--radio-selected-bg-end) 100%)`
    : 'var(--card-bg)',
  boxShadow: 'var(--shadow-sm)',
  overflow: 'hidden',
  backdropFilter: selected ? 'saturate(110%) blur(2px)' : undefined,
  WebkitBackdropFilter: selected ? 'saturate(110%) blur(2px)' : undefined,
  opacity: selected ? 1 : 0.5,
  cursor: 'pointer',
  transition: 'all 0.15s ease',
});

const radioHeaderStyle = (selected: boolean) => ({
  display: 'flex',
  alignItems: 'center',
  marginBottom: selected ? '12px' : '0',
  transition: 'margin-bottom 0.15s ease',
});

const radioInputStyle = (selected: boolean) => ({
  width: '16px',
  height: '16px',
  marginRight: '10px',
  cursor: 'pointer',
  accentColor: 'var(--primary-color)',
  transform: selected ? 'scale(1.05)' : 'scale(1)',
  transition: 'transform 0.12s ease',
});

const radioLabelStyle = (selected: boolean) => ({
  ...bodyTextStyle,
  cursor: 'pointer',
  color: selected ? 'var(--text-primary)' : 'var(--text-disabled)',
  transition: 'color 0.15s ease',
});

export function RadioOption({ id, label, selected, onSelect, children }: RadioOptionProps) {
  return (
    <div style={containerStyle(selected)} onClick={onSelect}>
      <div style={radioHeaderStyle(selected)}>
        <input type="radio" id={id} checked={selected} onChange={onSelect} style={radioInputStyle(selected)} />
        <label htmlFor={id} style={radioLabelStyle(selected)}>
          {label}
        </label>
      </div>
      {selected && children && (
        <div
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
}
