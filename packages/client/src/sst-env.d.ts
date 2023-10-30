/// <reference types="vite/client" />
interface ImportMetaEnv {
  readonly VITE_APP_AWS_REGION: string
  readonly VITE_APP_AWS_USER_POOL_ID: string
  readonly VITE_APP_AWS_USER_POOL_CLIENT_ID: string
  readonly VITE_APP_API_URL: string
  readonly VITE_APP_APP_SYNC_API_URL: string
  readonly VITE_APP_WEBSOCKET_SERVER_URL: string
}
interface ImportMeta {
  readonly env: ImportMetaEnv
}