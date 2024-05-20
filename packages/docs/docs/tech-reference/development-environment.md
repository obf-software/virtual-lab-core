---
sidebar_position: 0
---

# Ambiente de Desenvolvimento

Neste guia, você aprenderá como configurar o ambiente de desenvolvimento para o projeto.

## Pré-requisitos

### Node.js

Node.js é um ambiente de execução JavaScript que permite executar JavaScript no servidor.

Toda a estrutura do projeto é baseada em Node.js, então você precisa instalar o Node.js na versão
correta para garantir que tudo funcione corretamente.

A versão utilizada no projeto pode ser encontrada no arquivo `.nvmrc`, que é um arquivo que indica a
versão do Node.js que deve ser utilizada no projeto.

:::tip
Recomendamos o uso da ferramenta `nvm` para gerenciar as versões do Node.js. Você pode encontrar mais
informações sobre o `nvm` [aqui](https://github.com/nvm-sh/nvm).
:::

Após instalar o `nvm`, execute o seguinte comando para instalar a ver~sao correta do Node.js:

```bash
nvm install
```

### AWS CLI

O AWS CLI é uma ferramenta que permite interagir com os serviços da AWS por meio da linha de comando.

O projeto utiliza o AWS CLI tanto para realizar o deploy da aplicação quanto para subir o ambiente de
desenvolvimento localmente.

Para instalar o AWS CLI, siga as instruções disponíveis na
[documentação oficial](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html#getting-started-install-instructions).

:::warning
Para concluir a instalação do AWS CLI, você precisará configurar suas credenciais de acesso à AWS.
:::

O projeto espera que um perfil de credenciais chamado `virtual-lab` esteja configurado no seu ambiente.
Para configurar o perfil `virtual-lab`, edite o arquivo `~/.aws/credentials` e adicione as seguintes
linhas:

```ini title="~/.aws/credentials"
[virtual-lab]
aws_access_key_id=<ACCESS_KEY_ID>
aws_secret_access_key=<SECRET_ACCESS_KEY>
aws_session_token=<SESSION_TOKEN> # Informe se estiver utilizando credenciais temporárias
```

### MongoDB

O MongoDB é um banco de dados NoSQL que armazena os dados da aplicação. Você pode instalar o MongoDB
localmente ou utilizar um serviço de banco de dados gerenciado, como o
[MongoDB Atlas](https://www.mongodb.com/cloud/atlas), que possui um plano gratuito.

### Extensões do Visual Studio Code (Opcional)

O Visual Studio Code é o editor de código recomendado para o projeto. Caso você opte por utilizá-lo,
recomendamos instalar as seguintes extensões:

-   [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) -
    Integra o ESLint ao VSCode, permitindo a execução de correções de estilo de código.
-   [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode) - Integra o
    Prettier ao VSCode, permitindo a execução de correções de formatação de código.
-   [MongoDB for VS Code](https://marketplace.visualstudio.com/items?itemName=mongodb.mongodb-vscode) -
    Permite visualizar e interagir com bancos de dados MongoDB diretamente no VSCode.
-   [MDX](https://marketplace.visualstudio.com/items?itemName=silvenon.mdx) - Suporte para arquivos MDX
    no VSCode, permitindo a visualização dos arquivos de documentação com a formatação correta.

## Instalação das Dependências

Depois de instalar a versão correta do Node.js, você pode instalar as dependências do projeto executando:

```bash
npm install
```

## Configuração da conta AWS

O projeto declara a maioria dos componentes da infraestrutura na AWS usando o
[AWS CDK](https://aws.amazon.com/cdk/). Porém, alguns componentes precisam ser configurados
manualmente através do console da AWS.

### AWS Systems Manager Parameter Store

O projeto utiliza o AWS Systems Manager Parameter Store para armazenar variáveis de ambiente.
Você precisa alterar o valor de algumas variáveis de ambiente no Parameter Store.

1. Acesse o console da AWS e navegue até o serviço `Systems Manager`.
2. No menu lateral, clique em `Parameter Store`.
3. Altere o valor das seguintes variáveis de ambiente:

    - `/virtual-lab/<NOME_DO_STAGE>/database-url` - URL de conexão com o banco de dados MongoDB.

## Execução do Projeto

Depois de instalar as dependências e configurar a conta AWS, você pode executar o projeto localmente
rodando o seguinte comando:

```bash
npm run dev
```
