import { ReactNode } from 'react';
import { typography } from '../../config/theme';

interface InfoBoxProps {
  children: ReactNode;
}

const styles = {
  container: {
    marginBottom: '16px',
    padding: '0',
  },
  text: {
    ...typography.smallLabel,
    margin: 0,
    color: 'var(--text-primary)',
    lineHeight: '1.5',
    fontWeight: 500,
  },
};

export function InfoBox({ children }: InfoBoxProps) {
  return (
    <div style={styles.container}>
      <p style={styles.text}>{children}</p>
    </div>
  );
}
