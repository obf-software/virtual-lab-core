---
sidebar_position: 0
---

# Introdução

Este site é um guia de referência para o desenvolvimento e utilização do **Virtual Lab**.

O **Virtual Lab** é uma plataforma de simulação de laboratórios remotos, permitindo a execução de
cargas de trabalho em ambientes virtuais previamente configurados pelos usuários com função
de administrador.

Existem dois cargos em que um usuário pode ser atribuído: **Administrador** e **Usuário**.

O **Administrador** é responsável por configurar e manter os templates de laboratórios virtuais,
bem como gerenciar os usuários e suas permissões no sistema, como por exemplo os tipos de
instâncias que um usuário pode criar.

O **Usuário** representa o papel de um estudante ou pesquisador que precisa executar qualquer
tipo de carga de trabalho em um ambiente virtual previamente configurado (ou não) pelo administrador.

## Resumo da Arquitetura

### API

A API é responsável por gerenciar todas as regras de negócio do sistema. Dentro dela três módulos
principais podem ser identificados:

1. **Módulo de Usuários**: é responsável por gerenciar os usuários do sistema, bem como suas
   permissões e cargos.

2. **Módulo de Templates**: é responsável por gerenciar os templates de laboratórios virtuais, que
   são conjuntos de configurações que definem como uma instância virtual deve ser criada e quais
   recursos ela deve possuir.

3. **Módulo de Instâncias**: é responsável por gerenciar as instâncias virtuais, que são as
   representações concretas dos templates de laboratórios virtuais.

Todos os módulos se comunicam com um banco de dados **MongoDB** para persistir os dados e são
servidos em um modelo de arquitetura _serverless_ através do **AWS Lambda** e **API Gateway**.

### Gateway de Conexão

Ele é responsável por intermediar, e abstrair a conexão entre os usuários do
sistema e as instâncias virtuais. Ele se comunica com os clientes através do protocolo
**Guacamole**, que é um protocolo de conexão remota, enquanto se comunica com as instâncias
virtuais através de conexões VNC e RDP.

O **Gateway de Conexão** funciona através de uma servidor _WebSocket_ que recebe as conexões dos
clientes e as redireciona para as instâncias virtuais através de um processo em segundo plano
chamado [**Guacd**](https://guacamole.apache.org/doc/gug/guacamole-architecture.html#guacd).

Esse componenete é servido em um modelo de arquitetura de _containers_ através de um cluster
do **ECS Fargate** com um balanceador de carga **Application Load Balancer**.

### Cliente

é a interface gráfica que os usuários utilizam para interagir com o sistema. Ele se
comunica com o **Gateway de Conexão** através do protocolo **Guacamole**, bem como com a **API**
para realizar operações como a criação de instâncias, listagem de templates, etc.

O **Cliente** é construído com **React** e **TypeScript** e é servido através do **S3** e
**CloudFront**

### Documentação

A documentação é gerada a partir de arquivos Markdown e é servida através do **Docusaurus**.

Além disso, a documentação também disponibiliza a especificação
[openAPI](https://spec.openapis.org/oas/latest.html) da API com suporte para execuções interativas
de requisições e exemplos em diferentes linguagens de programação.

A documentação é servida através do **S3** e **CloudFront**.

Para mais informações sobre a API, consulte a [documentação da API](/api).

## Próximos Passos

Agora que você já conhece a arquitetura do **Virtual Lab**, você pode começar a explorar a
documentação para aprender como utilizar o sistema.

Se você é um **contribuidor do projeto**, você pode começar a explorar a seção de
[Referência Técnica](/docs/technical-reference) para entender como o sistema foi construído e como
você pode contribuir para o projeto.

Se você é um **usuário do sistema**, você pode começar a explorar a seção de
[Guia do Usuário](/docs/user-guide) para aprender como utilizar o sistema.
