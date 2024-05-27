/// <reference types="vite/client" />
interface ImportMetaEnv {
  readonly VITE_APP_AWS_REGION: string
  readonly VITE_APP_AWS_USER_POOL_ID: string
  readonly VITE_APP_AWS_USER_POOL_CLIENT_ID: string
  readonly VITE_APP_AWS_IDENTITY_POOL_ID: string
  readonly VITE_APP_AWS_USER_POOL_DOMAIN: string
  readonly VITE_APP_AWS_USER_POOL_SELF_SIGN_UP: string
  readonly VITE_APP_ENABLE_IDENTITY_PROVIDER: string
  readonly VITE_APP_AWS_IDENTITY_PROVIDER_NAME: string
  readonly VITE_APP_API_URL: string
  readonly VITE_APP_APP_SYNC_API_URL: string
  readonly VITE_APP_WEBSOCKET_SERVER_URL: string
}
interface ImportMeta {
  readonly env: ImportMetaEnv
}