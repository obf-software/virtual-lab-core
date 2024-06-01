---
sidebar_position: 1
---

# Instâncias

As instâncias são abstrações de máquinas virtuais, que são utilizadas para gerenciamento e orquestração de recursos computacionais.

Elas são criadas dentro do sistema a partir de [Templates de Instancia](/docs/user-guide/instance-templates), que definem as configurações iniciais das máquinas virtuais.

## Criando uma Instância

Para criar uma instância, siga os passos abaixo:

1. Acesse o sistema com uma conta de usuário que já tenha sido aprovada.

2. Acesse a página `Instâncias` no menu lateral.

3. Clique no botão `Nova Instância`, em seguida a tela listando os templates de instância disponíveis será exibida.

4. Selecione o template de instância desejado e clique no botão `Criar a partir deste template`.

5. Quando o modal de criação de instância for exibido, preencha os campos:

    1. **Nome da Instância**: Um nome para identificar a instância na listagem.
    2. **Descrição**: Uma descrição que ajude a identificar o propósito da instância, ou qualquer outra informação relevante.
    3. **Tipo de Instância**: Essa propriedade determina a especificação dos recursos de hardware que a máquina virtual tem acesso. Só é possível escolher entre os tipos de instância habilitados para o usuário.
    4. **Hibernação**: A hibernação é um estado intermediário entre ligado e desligado, que permite que a instância seja desligada, mas mantenha o estado da memória e do disco. Isso permite que a instância seja reiniciada rapidamente, sem a necessidade de inicialização completa. Só é possível habilitar a hibernação se o tipo de instância suportar essa funcionalidade e se o usuário tiver permissão para isso.

6. Clique no botão `Criar Instância`.

A partir desse momento, a criação de todos os recursos necessários para a instância será iniciada e o estado atual pode ser acompanhado na listagem de instâncias.

Quando toda configuração estiver pronta, um botão `Conectar` será exibido, permitindo que o usuário se conecte à instância.

## Conectando-se a uma Instância

A conexão com uma instância possibilita o acesso remoto à máquina virtual através do próprio navegador.

Para se conectar a uma instância é necessário que a mesma esteja ligada e que o usuário tenha permissão para acessá-la.

Nesse processo, o usuário recebe um token de acesso com validade limitada, que é utilizado para estabeler a conexão.

Para se conectar a uma instância, siga os passos abaixo:

1. Acesse o sistema com uma conta de usuário que já tenha sido aprovada.

2. Acesse a página `Instâncias` no menu lateral.

3. Localize a instância desejada na listagem.

4. Clique no botão `Conectar` na parte inferior do _card_ da instância.

5. Um redirecionamento para a página de conexão será feito e a conexão será estabelecida.

## Ligando uma Instância

Caso uma instância esteja desligada, é possível ligá-la com os seguintes passos:

1. Acesse o sistema com uma conta de usuário que já tenha sido aprovada.

2. Acesse a página `Instâncias` no menu lateral.

3. Localize a instância desejada na listagem.

4. Clique no botão `Ligar` na parte inferior do _card_ da instância.

O processo de inicialização da instância será iniciado e o estado atual pode ser acompanhado na listagem de instâncias.

## Desligando uma Instância

Caso uma instância esteja ligada, é possível desligá-la com os seguintes passos:

1. Acesse o sistema com uma conta de usuário que já tenha sido aprovada.

2. Acesse a página `Instâncias` no menu lateral.

3. Localize a instância desejada na listagem.

4. Clique no botão `Desligar` na parte inferior do _card_ da instância.

O processo de desligamento da instância será iniciado e o estado atual pode ser acompanhado na listagem de instâncias.

## Reiniciando uma Instância

Caso uma instância esteja ligada, é possível reiniciá-la. Isso é útil para aplicar configurações que necessitam de reinicialização, ou para corrigir problemas de software.

Para reiniciar uma instância, siga os passos abaixo:

1. Acesse o sistema com uma conta de usuário que já tenha sido aprovada.

2. Acesse a página `Instâncias` no menu lateral.

3. Localize a instância desejada na listagem.

4. Clique no botão de `Mais opções (...)` na parte inferior do _card_ da instância.

5. Clique na opção `Reiniciar`.

O processo de reinicialização da instância será iniciado e o estado atual pode ser acompanhado na listagem de instâncias.

## Detalhes de uma Instância

Ao acessar a página de detalhes de uma instância, é possível visualizar informações detalhadas sobre a instância.
Isso pode ser útil para identificar problemas, ou para entender melhor sobre todos os recursos e configurações da instância.

:::tip Vale lembrar que

Todos os detalhes exibidos são apenas leitura e não podem ser alterados através dessa tela.

:::

Para acessar os detalhes de uma instância, siga os passos abaixo:

1. Acesse o sistema com uma conta de usuário que já tenha sido aprovada.

2. Acesse a página `Instâncias` no menu lateral.

3. Localize a instância desejada na listagem.

4. Clique no botão de `Mais opções (...)` na parte inferior do _card_ da instância.

5. Clique na opção `Detalhes`.

O modal de detalhes da instância será exibido, contendo todas as informações disponíveis.

## Criando um Template de Instância a partir de uma Instância

:::note Nota

Disponível apenas para usuários com cargo de administrador.

:::

É possível criar um template de instância a partir de uma instância existente. Isso é útil para disponibilizar uma configuração específica para outros usuários, ou para reutilizar uma configuração já existente.

Para criar um template de instância a partir de uma instância, siga os passos abaixo:

1. Acesse o sistema com uma conta de administrador.

2. Acesse a página `Instâncias` no menu lateral.

3. Localize a instância desejada na listagem.

4. Caso a instância esteja ligada, desligue-a e aguarde até que o estado seja atualizado.

5. Clique no botão de `Mais opções (...)` na parte inferior do _card_ da instância.

6. Clique na opção `Criar Template`.

7. No modal de criação de template, preencha os campos:

    1. **Nome do Template**: Um nome para identificar o template na listagem.
    2. **Descrição**: Uma descrição que ajude a identificar o propósito do template, ou qualquer outra informação relevante.
    3. **Armazenamento**: A quantidade de armazenamento de disco que será disponibilizada para a instância. Esse valor deve ser maior ou igual ao armazenamento atual da instância.

8. Clique no botão `Confirmar` para criar o template.

A partir desse momento, o processo de criação do template será iniciado e quando finalizado, o template estará disponível na listagem de templates de instância.

Em alguns casos, o processo de criação de template pode demorar alguns minutos, dependendo da quantidade de dados a serem copiados.

## Excluindo uma Instância

A exclusão de uma instância é uma ação irreversível e todos os dados e recursos associados à instância serão perdidos após a confirmação.

Para excluir uma instância, siga os passos abaixo:

1. Acesse o sistema com uma conta de usuário que já tenha sido aprovada.

2. Acesse a página `Instâncias` no menu lateral.

3. Localize a instância desejada na listagem.

4. Clique no botão de `Mais opções (...)` na parte inferior do _card_ da instância.

5. Clique na opção `Excluir`.

6. Um modal de confirmação será exibido, solicitando a confirmação da exclusão. Clique no botão `Excluir` para confirmar a ação.

A partir desse momento a instância será excluída e não aparecerá mais na listagem de instâncias.

## Desligamento automático de Instâncias ociosas

O desligamento automático de instâncias ociosas é uma funcionalidade que tem como objetivo economizar recursos do sistema.

Quando uma instância está ociosa, ou seja, sem uma conexão ativa por um período de 15 minutos, o sistema irá desligá-la automaticamente.

:::warning Importante

Não é possível alterar o comportamento de desligamento automático de instâncias ociosas, nem desativar essa funcionalidade.

:::
