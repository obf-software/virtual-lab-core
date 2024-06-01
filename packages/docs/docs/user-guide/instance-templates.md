---
sidebar_position: 2
---

# Templates de Instância

:::note Nota

Essa página é destinada a administradores do sistema.

:::

Os templates de instância são modelos de instâncias que podem ser utilizados para criar novas instâncias com configurações pré-definidas.
Eles são úteis para distribuir conjuntos de configurações padronizados para os usuários do sistema.

## Criando um Template de Instância

É possível criar templates de instância de três formas diferentes, que serão descritas a seguir.

### A partir de uma Instância

Consulte a seção [Criando um Template de Instância a partir de uma Instância](/docs/user-guide/instances#criando-um-template-de-instância-a-partir-de-uma-instância) para mais informações.

### Do Zero

Essa é a forma elementar de criar um template de instância, onde todas as configurações são definidas manualmente.

Para criar um template de instância do zero, siga os passos abaixo:

1. Acesse o sistema com uma conta de administrador.

2. Acesse a página `Templates` no menu lateral.

3. Clique no botão `Novo Template` no canto superior direito da página.

4. No formulário que será exibido, informe os seguintes campos:

    1. **Nome do Template**: Nome do novo template de instância.
    2. **Descrição**: Descrição do novo template de instância.
    3. **Imagem da Máquina**: Esse campo representa a imagem da máquina que será utilizada para criar as instâncias a partir desse template. Selecione a imagem desejada no campo de seleção.
       :::warning Imagem da Máquina

        É recomendado escolher entre as imagens recomendadas que são apresentadas no campo de seleção.

        Caso deseje utilizar uma imagem personalizada, informe o ID (Obtido na página de [AMIs da AWS](console.aws.amazon.com/ec2/home#Images)) da imagem desejada no campo de texto.

        Não existe garantia de que uma imagem personalizada irá funcionar corretamente.

        :::

    4. **Armazenamento**: Esse campo representa o tamanho do disco mínimo que será utilizado para criar as instâncias a partir desse template. Informe o tamanho desejado em GB.

### A partir de outro Template de Instância

Criar um template de instância a partir de outro template de instância é uma forma de reutilizar configurações já existentes, sem a necessidade de copiar manualmente as configurações de um template para outro.

Para criar um template de instância a partir de outro template de instância, siga os passos abaixo:

1. Acesse o sistema com uma conta de administrador.

2. Acesse a página `Templates` no menu lateral.

3. Localize o template de instância de origem na listagem.

4. Clique no botão `Copiar` na parte inferior do _card_ do template de instância.

5. No modal que será exibido, é possível alterar os campos, porém os valores já estarão preenchidos com as informações do template de instância de origem.

6. Clique no botão `Criar Template` para criar o novo template de instância.

## Editando um Template de Instância

Para editar um template de instância, siga os passos abaixo:

1. Acesse o sistema com uma conta de administrador.

2. Acesse a página `Templates` no menu lateral.

3. Localize o template de instância na listagem.

4. Clique no botão `Editar` na parte inferior do _card_ do template de instância.

5. O formulário de edição será exibido, permitindo a alteração dos campos:

    1. **Nome do Template**: Nome do template de instância.
    2. **Descrição**: Descrição do template de instância.

6. Após realizar as alterações desejadas, clique no botão `Salvar` para aplicar as alterações.

## Excluindo um Template de Instância

Para excluir um template de instância, siga os passos abaixo:

1. Acesse o sistema com uma conta de administrador.

2. Acesse a página `Templates` no menu lateral.

3. Localize o template de instância na listagem.

4. Clique no botão `Excluir` na parte inferior do _card_ do template de instância.

5. Um modal de confirmação será exibido. Clique no botão `Excluir` para confirmar a exclusão.

:::tip Vale lembrar que

A exclusão de um template de instância **não** afeta as instâncias que foram criadas a partir desse template, apenas o template de instância será excluído.

:::

## Aumentando a velocidade de criação de Instâncias

Quando o sistema está em um estado inicial, é possível aprimorar a velocidade de criação de instâncias ao criar um template de instância baseado em uma instância já existente.

:::tip Mas por que?

Quando um template de instância é criado a partir de uma imagem recomendada, isto é, com nenhuma configuração adicional, uma série de comando são executados para configurar
o sistema operacional e instalar as dependências necessárias para o funcionamento do sistema.

**Ao criar um template de instância baseado em uma instância já existente, essas configurações são reaproveitadas, o que reduz o tempo de criação de instâncias.**

:::
