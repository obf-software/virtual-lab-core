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

:::warning Atenção

Essa _feature flag_ é habilitada automaticamente quando a aplicação é executada com o comando `npm run dev`.

:::

### `RETAIN_USER_POOL_ON_DELETE`

A _feature flag_ `RETAIN_USER_POOL_ON_DELETE` é utilizada para habilitar a retenção do _user pool_ do Cognito ao remover a stack de recursos da AWS.

-   **Valor Padrão**: `true`

:::warning Atenção

Essa _feature flag_ é desabilitada automaticamente quando a aplicação é executada com o comando `npm run dev`, para evitar a retenção do _user pool_ durante o desenvolvimento.

:::

### `USER_POOL_IDENTITY_PROVIDER`

A _feature flag_ `USER_POOL_IDENTITY_PROVIDER` é utilizada para habilitar a criação de um _identity provider_ no _user pool_ do Cognito, que permite a autenticação de usuários através de um provedor de identidade externo.

-   **Valor Padrão**: `false`

:::info Importante

Essa _feature flag_ é utilizada em conjunto com outras variáveis de ambiente para configurar o provedor de identidade.
**Caso essas variáveis de ambiente não sejam configuradas corretamente, a stack de recursos da AWS falhará ao ser criada.**

-   `USER_POOL_IDENTITY_PROVIDER_CLIENT_ID`: ID do cliente do provedor de identidade.
-   `USER_POOL_IDENTITY_PROVIDER_CLIENT_SECRET`: Segredo do cliente do provedor de identidade.
-   `USER_POOL_IDENTITY_PROVIDER_ISSUER_URL`: URL do provedor de identidade.

:::

### `USER_POOL_SELF_SIGN_UP`

A _feature flag_ `USER_POOL_SELF_SIGN_UP` é utilizada para permitir que os usuários se cadastrem por conta própria no _user pool_ do Cognito.
**Caso essa _feature flag_ seja desabilitada, apenas usuários criados manualmente no _user pool_ poderão se autenticar na aplicação.**

-   **Valor Padrão**: `true`

### `NEW_RELIC_LAMBDA_INSTRUMENTATION`

A _feature flag_ `NEW_RELIC_LAMBDA_INSTRUMENTATION` é utilizada para habilitar a instrumentação de funções Lambda com o New Relic.

-   **Valor Padrão**: `false`

:::info Importante

Essa _feature flag_ é utilizada em conjunto com outras variáveis de ambiente para configurar o New Relic. **Caso essas variáveis de ambiente não sejam configuradas corretamente, a instrumentação do New Relic falhará.**

-   `NEW_RELIC_ACCOUNT_ID`: ID da conta do New Relic.
-   `NEW_RELIC_TRUSTED_ACCOUNT_KEY`: Chave da conta confiável do New Relic. Caso a conta do New Relic tenha uma conta pai, essa chave deve ser configurada.
-   `NEW_RELIC_LICENSE_KEY`: Chave de licença do New Relic.

:::

:::warning Atenção

Essa _feature flag_ é desabilitada automaticamente quando a aplicação é executada com o comando `npm run dev`, pois a instrumentação do New Relic impacta na conexão das lambdas com o ambiente local.

:::

### `CLIENT_CUSTOM_DOMAIN`

A _feature flag_ `CLIENT_CUSTOM_DOMAIN` é utilizada para habilitar a configuração de um domínio personalizado para o cliente.

-   **Valor Padrão**: `false`

:::info Importante

Essa _feature flag_ é utilizada em conjunto com outras variáveis de ambiente para configurar o domínio personalizado. **Caso essas variáveis de ambiente não sejam configuradas corretamente, a configuração do domínio personalizado falhará.**

-   `CLIENT_CUSTOM_DOMAIN_NAME`: Nome do domínio personalizado.
-   `CLIENT_CUSTOM_DOMAIN_CERTIFICATE_ARN`: ARN do certificado SSL do domínio personalizado.

Depois de configurar o domínio personalizado, é necessário configurar o DNS adicionando um registro CNAME que aponte para o domínio do CloudFront do cliente.

:::

:::warning Atenção

Essa _feature flag_ é desabilitada automaticamente quando a aplicação é executada com o comando `npm run dev`, pois o cliente roda localmente.

:::

### `DOCS_CUSTOM_DOMAIN`

A _feature flag_ `DOCS_CUSTOM_DOMAIN` é utilizada para habilitar a configuração de um domínio personalizado para a documentação.

-   **Valor Padrão**: `false`

:::info Importante

Essa _feature flag_ é utilizada em conjunto com outras variáveis de ambiente para configurar o domínio personalizado. **Caso essas variáveis de ambiente não sejam configuradas corretamente, a configuração do domínio personalizado falhará.**

-   `DOCS_CUSTOM_DOMAIN_NAME`: Nome do domínio personalizado.
-   `DOCS_CUSTOM_DOMAIN_CERTIFICATE_ARN`: ARN do certificado SSL do domínio personalizado.

Depois de configurar o domínio personalizado, é necessário configurar o DNS adicionando um registro CNAME que aponte para o domínio do CloudFront da documentação.

:::

:::warning Atenção

Essa _feature flag_ é desabilitada automaticamente quando a aplicação é executada com o comando `npm run dev`, pois o cliente roda localmente.

:::
