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

## Acessando o sistema

O acesso ao sistema é feito através da página de login, que pode ser acessada através da url disponibilizada pelo responsável pelo sistema.

Para contas vinculadas a um provedor de identidade, o acesso é feito através do botão de login do provedor, que redireciona o usuário para a página de autenticação externa.

Caso você tenha recebido um convite, o link de acesso ao sistema deve estar disponível no email recebido.

## Recuperando a senha

Caso você tenha esquecido a senha, é possível recuperá-la através da página de login. Basta clicar no link **"Esqueceu a senha?"** e seguir as instruções.

Um email será enviado para o endereço cadastrado com um link para redefinir a senha.

:::warning Importante

1. Só é possível recuperar a senha se o email cadastrado estiver verificado, caso contrário, será necessário entrar em contato com um administrador do sistema.

2. Contas vinculadas a um provedor de identidade não possuem senha no sistema, portanto, não é possível recuperar a senha.

:::

## Aprovando contas

:::note Nota

Disponível apenas para usuários com cargo de administrador.

:::

A aprovação de contas é feita por um administrador do sistema. Quando uma conta é aprovada,
o usuário recebe acesso completo ao sistema, através do cargo `USUÁRIO`. **Para alterar o cargo para `ADMINISTRADOR`, é necessário acessar a página do usuário e alterar o cargo manualmente.**

Para aprovar uma conta criada através do formulário de registro, ou que tenha sido criada manualmente
e esteja com cargo `PENDENTE`, siga os passos abaixo:

1. Acesse o sistema com uma conta de administrador.

2. Acesse a página `Usuários` no menu lateral.

3. Localize o usuário que deseja aprovar. Aplique o filtro de texto e/ou ordenação para facilitar a busca.

4. Clique no botão `Verde` com o ícone de checkmark na coluna `Ações`.

5. O usuário agora tem acesso completo ao sistema.

## Verificando o email

:::note Nota

Não tem efeito para contas vinculadas a um provedor de identidade externo.

:::

A verificação do email é um passo importante para garantir a segurança da conta, possibilitando a recuperação de senha e o login através do email.

Isso pode ser feito de duas formas:

1. **Durante o registro**: Um modal é exibido após o cadastro, solicitando a confirmação do email. Basta seguir as instruções, utilizando o código enviado por email.

2. **Página de perfil**: Caso a verificação não tenha sido feita durante o registro, ou a conta tenha sido criada manualmente, é possível verificar o email através da página de perfil.
    1. Acesse a página de perfil clicando no seu nome de usuário no canto superior direito.
    2. Clique no botão `Verificar email`.
    3. Um email será enviado com um código de verificação. Basta inserir o código no campo correspondente.

## Cotas de uso

As cotas de uso são limites impostos para evitar o uso excessivo de recursos do sistema. Essas cotas são definidas pelo administrador do sistema e podem variar de acordo com o cargo do usuário.

:::tip Vale lembrar que

As cotas de uso são verificadas pelo sistema no momento da manipulação de recursos **apenas** para usuários com cargo de `USUÁRIO`.

:::

### Visualizar as cotas do usuário logado

Para visualizar as cotas disponíveis para você:

1. Acesse a página de perfil clicando no seu nome de usuário no canto superior direito.

2. As cotas disponíveis para o seu cargo serão exibidas na seção `Cotas de uso`.

### Visualizar as cotas de outros usuários

:::note Nota

Disponível apenas para usuários com cargo de administrador.

:::

Para visualizar as cotas disponíveis para outros usuários:

1. Acesse a página `Usuários` no menu lateral.

2. Localize o usuário que deseja visualizar as cotas. Aplique o filtro de texto e/ou ordenação para facilitar a busca.

3. Acesse a página de perfil do usuário clicando no botão `Azul` "Abrir Usuário" na coluna `Ações`.

4. As cotas disponíveis para o cargo do usuário serão exibidas na seção `Cotas de uso`.

### Atualizando as cotas de uso de um usuário

:::note Nota

Disponível apenas para usuários com cargo de administrador.

:::

Para atualizar as cotas de uso de um usuário:

1. Acesse a página `Usuários` no menu lateral.

2. Localize o usuário que deseja atualizar as cotas. Aplique o filtro de texto e/ou ordenação para facilitar a busca.

3. Acesse a página de perfil do usuário clicando no botão `Azul` "Abrir Usuário" na coluna `Ações`.

4. Altere as cotas de uso interagindo com os campos de inserção de valores. As novas cotas serão aplicadas imediatamente, sem a necessidade de aprovação.

## Notificações

As notificações são mensagens enviadas pelo sistema para informar o usuário sobre eventos relevantes relacionados à algum recurso de sua responsabilidade.

Elas são exibidas no canto superior direito da tela, no ícone de sino, junto com o número de notificações não lidas.

:::tip Vale lembrar que

As notificações têm caráter informativo e não requerem ação do usuário para a aplicação de alguma funcionalidade.

:::
