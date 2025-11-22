import { smallLabelTextStyle, GithubIcon, LinkedInIcon } from '../common';

const links = [
  {
    href: 'https://github.com/Sampsoon/vibey_lsp',
    icon: GithubIcon,
    label: 'GitHub',
  },
  {
    href: 'https://www.linkedin.com/in/sampsonj/',
    icon: LinkedInIcon,
    label: 'LinkedIn',
  },
];

const containerStyle = {
  display: 'flex',
  flexDirection: 'column' as const,
  gap: '16px',
  alignItems: 'center',
  justifyContent: 'center',
  paddingTop: '60px',
};

const iconsContainerStyle = {
  display: 'flex',
  gap: '16px',
  justifyContent: 'center',
};

const iconLinkStyle = {
  color: 'var(--text-primary)',
  padding: '12px',
  backgroundColor: 'var(--card-bg)',
  border: '1px solid var(--border-color)',
  borderRadius: '12px',
  boxShadow: 'var(--shadow-sm)',
  transition: 'transform 0.2s ease, box-shadow 0.2s ease, color 0.2s ease',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '56px',
  height: '56px',
  textDecoration: 'none',
};

const contactLabelStyle = {
  ...smallLabelTextStyle,
  color: 'var(--text-secondary)',
  textAlign: 'center' as const,
  marginTop: '8px',
};

export function ContactSection() {
  return (
    <div style={containerStyle}>
      <div style={iconsContainerStyle}>
        {links.map(({ href, icon: Icon, label }) => (
          <div key={href} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              style={iconLinkStyle}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'var(--shadow-md)';
              }}
            >
              <Icon width={48} height={48} />
            </a>
            <span style={contactLabelStyle}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
