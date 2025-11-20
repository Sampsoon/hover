import { CustomEndpointConfiguration } from './components/CustomEndpointConfiguration';

function OptionsApp() {
  return (
    <div
      style={{
        width: '100%',
        maxWidth: '800px',
        margin: '0 auto',
        padding: '20px',
      }}
    >
      <h1 style={{ color: 'var(--text-primary)', marginBottom: '20px' }}>Custom Endpoint Configuration</h1>
      <CustomEndpointConfiguration />
    </div>
  );
}

export default OptionsApp;
