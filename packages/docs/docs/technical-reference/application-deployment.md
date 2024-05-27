---
sidebar_position: 4
---

# Deploy da Aplicação

O projeto é construído utilizando a declaração dos recursos da infraestrutura como código com o
[AWS CDK](https://aws.amazon.com/cdk/) em conjunto com o [SST](https://sst.dev), que facilita a
construção de aplicações serverless na AWS, fornecendo uma camada de abstração sobre o CDK com
recursos adicionais.

:::warning Atenção

Para realizar o deploy da aplicação, é importante que você tenha configurado o ambiente de
desenvolvimento corretamente. Caso ainda não tenha feito isso, siga o guia de
[**Ambiente de Desenvolvimento**](./development-environment).

:::

Diferentemente da execução local, o deploy da aplicação não utiliza o perfil de credenciais
`virtual-lab` criado anteriormente. Em vez disso, ele utilizará as credenciais padrões configuradas
na sessão do terminal que está sendo utilizado.

O deploy da aplicação é realizado utilizando o comando `sst deploy` do SST. Esse comando
compila a aplicação e cria ou atualiza os recursos na AWS de acordo com a definição do projeto.

## Deploy Manual

Para fazer o deploy manual da aplicação, exporte as váriaveis de ambiente necessárias através
de um arquivo `.env` na raiz do projeto ou diretamente com o comando `export` no terminal.

As váriaveis de autenticação com a AWS são:

-   `AWS_ACCESS_KEY_ID`: ID da chave de acesso da AWS.
-   `AWS_SECRET_ACCESS_KEY`: Chave de acesso secreta da AWS.
-   `AWS_SESSION_TOKEN`: Token de sessão da AWS. Esse valor é opcional e só é necessário se você
    estiver utilizando credenciais temporárias.

Além disso, você pode exportar outras váriaveis de ambiente que controlam o comportamento das
**_feature flags_** da aplicação. Para mais informações, consulte o guia de
[**_Feature Flags_**](./feature-flags).

Para iniciar o deploy, execute o seguinte comando, substituindo `<STAGE>` pelo
ambiente desejado (`production`, `staging`, etc):

```bash title="Terminal"
npm run deploy -- --stage <STAGE>
```

:::warning Atenção

Caso alguma variável de ambiente tenha que ser alterada, é necessário realizar o deploy da aplicação
novamente para que as alterações tenham efeito.

:::
