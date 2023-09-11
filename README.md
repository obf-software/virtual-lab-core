# virtual-lab-core

## Comandos

### Executar banco de dados local

```shell
docker run -d -p 5432:5432 -v /tmp/database:/var/lib/postgresql/data -e POSTGRES_PASSWORD=<PASSWORD> postgres
```

Ou, para executar sem senha

```shell
docker run -d -p 5432:5432 -v /tmp/database:/var/lib/postgresql/data -e POSTGRES_HOST_AUTH_METHOD=trust postgres
```

### Gerar token de autenticação

```shell
aws cognito-idp initiate-auth \
    --no-cli-pager \
    --region <REGION> \
    --auth-flow USER_PASSWORD_AUTH \
    --client-id <USER_POOL_CLIENT_ID> \
    --auth-parameters USERNAME=<USERNAME>,PASSWORD=<PASSWORD
```
