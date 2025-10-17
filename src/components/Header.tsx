import { typography } from '../config/theme';

export function Header() {
  return (
    <div style={{ marginBottom: '20px' }}>
      <h1 style={{ ...typography.heading, fontSize: '20px' }}>Welcome to Vibey LSP</h1>
    </div>
  );
}
