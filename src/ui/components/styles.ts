export const smallLabelTextStyle = {
  fontFamily: 'var(--font-family)',
  fontWeight: 'var(--font-small-label-weight)',
  fontSize: 'var(--font-small-label-size)',
  lineHeight: 'var(--font-small-label-line-height)',
};

export const bodyTextStyle = {
  fontFamily: 'var(--font-family)',
  fontWeight: 'var(--font-body-weight)',
  fontSize: 'var(--font-body-size)',
  lineHeight: 'var(--font-body-line-height)',
};

export const baseSliderStyle = {
  position: 'absolute' as const,
  background: 'linear-gradient(180deg, var(--slider-bg-start) 0%, var(--slider-bg-end) 100%)',
  border: '1px solid var(--slider-border)',
  borderRadius: '10px',
  boxShadow: 'var(--slider-shadow)',
  zIndex: 0,
  pointerEvents: 'none' as const,
  backdropFilter: 'saturate(120%) blur(2px)',
  WebkitBackdropFilter: 'saturate(120%) blur(2px)',
};

export const fieldLabelStyle = {
  ...smallLabelTextStyle,
  display: 'block',
  marginBottom: '6px',
  color: 'var(--text-primary)',
};
