/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BASE_URL: string
  readonly VITE_APP_NAME: string
  readonly VITE_APP_VERSION: string
  // Add other environment variables as needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}