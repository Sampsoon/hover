import { ReactNode } from 'react';
import { typography } from '../../config/theme';

interface LabelProps {
  children: ReactNode;
}

const styles = {
  ...typography.smallLabel,
  display: 'block',
  marginBottom: '6px',
};

export function Label({ children }: LabelProps) {
  return <label style={styles}>{children}</label>;
}
