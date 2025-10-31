import { ReactNode } from 'react';

interface InfoBoxProps {
  children: ReactNode;
}

const textStyle = {
  fontFamily: 'var(--font-small-label-family)',
  fontWeight: 'var(--font-small-label-weight)',
  fontSize: 'var(--font-small-label-size)',
  lineHeight: 'var(--font-small-label-line-height)',
  margin: 0,
  color: 'var(--text-primary)',
};

export function InfoBox({ children }: InfoBoxProps) {
  return (
    <div style={{ marginBottom: '16px', padding: '0 24px' }}>
      <p style={textStyle}>{children}</p>
    </div>
  );
}
