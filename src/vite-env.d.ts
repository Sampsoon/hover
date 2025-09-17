/// <reference types="vite/client" />
/// <reference types="chrome" />
interface ImportMetaEnv {
  readonly VITE_OPEN_ROUTER_API_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
