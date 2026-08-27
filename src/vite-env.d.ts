/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Where the Acheva API lives. The verify endpoint is public — no key. */
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
