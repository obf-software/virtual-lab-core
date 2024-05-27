---
sidebar_position: 5
---

# Criando Usuários Manualmente

É possível criar usuários manualmente no projeto, isso é útil para possibilitar o acesso ao sistema
caso o registro _self-service_ não esteja habilitado ou para criar usuários de teste.

:::tip Dica

Verifique a _feature flag_ `USER_POOL_SELF_SIGN_UP` no manual de
[Feature Flags](/docs/technical-reference/feature-flags) para saber se o registro _self-service_ está
habilitado.

:::

## AWS Console

Aceessando página do [Amazon Cognito](console.aws.amazon.com/cognito/v2/idp/user-pools), você pode
criar um usuário seguindo os passos abaixo:

1. Selecione a _User Pool_ desejada.

2. Na aba _Users_, clique no botão **Create user**.

3. Preencha os campos obrigatórios e clique em **Create user**.

## AWS CLI

Você também pode criar usuários utilizando o AWS CLI. Para isso, execute o seguinte comando:

```bash title="Criar usuário"
USER_POOL_ID=<REPLACE>
USERNAME=<REPLACE>
EMAIL=<REPLACE>
NAME=<REPLACE>
TEMP_PASSWORD=<REPLACE>

aws cognito-idp admin-create-user \
    --user-pool-id $USER_POOL_ID \
    --username $USERNAME
    --user-attributes Name=name,Value=$NAME,Name=email,Value=$EMAIL \
    --temporary-password $TEMP_PASSWORD \
    --no-force-alias-creation \
    --message-action SUPPRESS
```
