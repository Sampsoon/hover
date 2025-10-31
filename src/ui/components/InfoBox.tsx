import { ReactNode } from 'react';
import { typography } from '../theme';

interface InfoBoxProps {
  children: ReactNode;
}

const textStyle = {
  ...typography.smallLabel,
  margin: 0,
  color: 'var(--text-primary)',
  lineHeight: '1.5',
  fontWeight: 500,
};

export function InfoBox({ children }: InfoBoxProps) {
  return (
    <div style={{ marginBottom: '16px', padding: '0 24px' }}>
      <p style={textStyle}>{children}</p>
    </div>
  );
}
