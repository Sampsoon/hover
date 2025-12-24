import type { ReactNode } from 'react';
import { smallHeadingStyle, smallTextStyle } from './styles';

interface InfoBoxProps {
  title: string;
  children: ReactNode;
  style?: React.CSSProperties;
}

export function InfoBox({ title, children, style }: InfoBoxProps) {
  return (
    <section
      style={{
        border: '1px solid var(--border-color)',
        borderRadius: '10px',
        backgroundColor: 'var(--card-bg)',
        boxShadow: 'var(--shadow-sm)',
        overflow: 'hidden',
        ...style,
      }}
    >
      <div
        style={{
          padding: '12px 14px',
          borderBottom: '1px solid var(--border-color)',
          ...smallHeadingStyle,
        }}
      >
        {title}
      </div>
      <div
        style={{
          padding: '12px 14px',
          ...smallTextStyle,
        }}
      >
        {children}
      </div>
    </section>
  );
}
