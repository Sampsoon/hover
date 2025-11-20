import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import OptionsApp from './OptionsApp';

const rootElement = document.getElementById('root');
if (rootElement !== null) {
  createRoot(rootElement).render(
    <StrictMode>
      <OptionsApp />
    </StrictMode>,
  );
}
