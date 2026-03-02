/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_OPENAI_API_KEY: string;
  readonly VITE_OPENAI_ORG_ID: string;
  readonly VITE_OPENROUTER_API: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
