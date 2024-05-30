---
sidebar_position: 0
---

# Conta de Usuário

A conta de usuário é o ponto de partida para acessar o sistema. A seguir são apresentadas as
funcionalidades disponíveis para o usuário.

## Obtendo uma conta

A criação de conta depende de como o sistema foi configurado, podendo ser feita de algumas formas:

### Convite

O convite é feito por uma pessoa que tem acesso ao ambiente de implantação do sistema, em outras
palavras, a conta da AWS onde o sistema está implantado.

:::warning Importante

Caso o sistema esteja configurado para não aceitar registros de conta feitos diretamente pelo
usuário, o convite é a única forma de criar uma conta.

**Se você deseja criar uma conta manualmente, consulte o guia
[Criando Usuários Manualmente](/docs/technical-reference/manual-user-creation)**.

:::

### Registro

O registro de conta é feito diretamente pelo usuário, fornecendo as informações necessárias através
do formulário de cadastro.

Quando uma conta é criada através desse ponto de entrada, o acesso padrão é de usuário `PENDENTE`,
o que significa que o usuário tem acesso limitado ao sistema. Algum administrador do sistema deve
aprovar a conta para que o usuário possa acessar todas as funcionalidades.

### OpenID Connect (SSO)

O sistema pode ser configurado para aceitar autenticação via OpenID Connect. Nesse caso, o gerenciamento
de contas é feito pelo provedor de identidade configurado. Isso significa que o usuário não precisa
criar uma conta no sistema, apenas autenticar-se com o provedor de identidade.

No primeiro acesso, o sistema cria uma conta para o usuário com todas as funcionalidades disponíveis.
