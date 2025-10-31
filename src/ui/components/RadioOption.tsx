import { ReactNode } from 'react';

interface RadioOptionProps {
  id: string;
  label: string;
  selected: boolean;
  onSelect: () => void;
  children?: ReactNode;
}

const containerStyle = (selected: boolean) => ({
  border: selected ? '1px solid rgba(107, 117, 201, 0.22)' : '1px solid var(--border-color)',
  borderRadius: '10px',
  padding: '12px',
  marginBottom: '10px',
  background: selected
    ? 'linear-gradient(180deg, rgba(107, 117, 201, 0.08) 0%, rgba(107, 117, 201, 0.04) 100%)'
    : 'var(--card-bg-inactive)',
  boxShadow: 'var(--shadow-sm)',
  overflow: 'hidden',
  backdropFilter: selected ? 'saturate(110%) blur(2px)' : undefined,
  WebkitBackdropFilter: selected ? 'saturate(110%) blur(2px)' : undefined,
  opacity: selected ? 1 : 0.5,
  cursor: 'pointer',
  transition:
    'background 0.15s ease, border-color 0.15s ease, opacity 0.15s ease, box-shadow 0.15s ease, backdrop-filter 0.15s ease',
});

const headerStyle = (selected: boolean) => ({
  display: 'flex',
  alignItems: 'center',
  marginBottom: selected ? '12px' : '0',
  transition: 'margin-bottom 0.15s ease',
});

const labelStyle = (selected: boolean) => ({
  fontFamily: 'var(--font-body-family)',
  fontWeight: 'var(--font-body-weight)',
  fontSize: 'var(--font-body-size)',
  lineHeight: 'var(--font-body-line-height)',
  cursor: 'pointer',
  color: selected ? 'var(--text-primary)' : 'var(--text-disabled)',
  transition: 'color 0.15s ease',
});

export function RadioOption({ id, label, selected, onSelect, children }: RadioOptionProps) {
  return (
    <div style={containerStyle(selected)} onClick={onSelect}>
      <div style={headerStyle(selected)}>
        <input
          type="radio"
          id={id}
          checked={selected}
          onChange={onSelect}
          style={{
            width: '16px',
            height: '16px',
            marginRight: '10px',
            cursor: 'pointer',
            accentColor: 'var(--primary-color)',
            transform: selected ? 'scale(1.05)' : 'scale(1)',
            transition: 'transform 0.12s ease',
          }}
        />
        <label htmlFor={id} style={labelStyle(selected)}>
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
