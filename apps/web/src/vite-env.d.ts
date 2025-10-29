/// <reference types="vite/client" />

interface Window {
  __TAURI__?: {
    [key: string]: any;
  };
}

interface ImportMetaEnv {
  readonly VITE_SERVER_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
