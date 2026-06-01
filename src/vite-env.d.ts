/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_AUTH_API_URL: string
  readonly VITE_FINANCE_API_URL: string
  readonly VITE_BILLING_API_URL: string
  // Agrega más variables de entorno aquí según sea necesario
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
