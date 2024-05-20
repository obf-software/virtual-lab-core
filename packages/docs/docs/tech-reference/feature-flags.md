---
sidebar_position: 2
---

# Feature Flags

O projeto utiliza _feature flags_ para habilitar ou desabilitar recursos de infraestrutura e funcionalidades da aplicação.

## Configuração

As _feature flags_ são configuradas através de variáveis de ambiente, e podem receber os seguintes valores:

-   [`true`, `1`, `on`, `yes`]: habilita a _feature flag_.
-   [`false`, `0`, `off`, `no`]: desabilita a _feature flag_.

## Feature Flags Disponíveis

### `READABLE_LOG_FORMAT`

A _feature flag_ `READABLE_LOG_FORMAT` é utilizada para habilitar um formato de log mais legível para facilitar a depuração em ambientes de desenvolvimento.

-   **Valor Padrão**: `false`

:::warning

Essa _feature flag_ é habilitada automaticamente quando a aplicação é executada com o comando `npm run dev`.

:::

### `RETAIN_USER_POOL_ON_DELETE`

A _feature flag_ `RETAIN_USER_POOL_ON_DELETE` é utilizada para habilitar a retenção do _user pool_ do Cognito ao remover a stack de recursos da AWS.

-   **Valor Padrão**: `true`

:::warning

Essa _feature flag_ é desabilitada automaticamente quando a aplicação é executada com o comando `npm run dev`, para evitar a retenção do _user pool_ durante o desenvolvimento.

:::

### `USER_POOL_IDENTITY_PROVIDER`

A _feature flag_ `USER_POOL_IDENTITY_PROVIDER` é utilizada para habilitar a criação de um _identity provider_ no _user pool_ do Cognito, que permite a autenticação de usuários através de um provedor de identidade externo.

-   **Valor Padrão**: `false`

:::info

Essa _feature flag_ é utilizada em conjunto com outras variáveis de ambiente para configurar o provedor de identidade.
**Caso essas variáveis de ambiente não sejam configuradas corretamente, a stack de recursos da AWS falhará ao ser criada.**

-   `USER_POOL_IDENTITY_PROVIDER_CLIENT_ID`: ID do cliente do provedor de identidade.
-   `USER_POOL_IDENTITY_PROVIDER_CLIENT_SECRET`: Segredo do cliente do provedor de identidade.
-   `USER_POOL_IDENTITY_PROVIDER_ISSUER_URL`: URL do provedor de identidade.

:::
