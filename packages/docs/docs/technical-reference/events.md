---
sidebar_position: 3
---

# Eventos

Eventos são utilizados no projeto para notificar outros serviços sobre a ocorrência de ações específicas. Eles são implementados utilizando AWS EventBridge e AWS AppSync.

## Tipos de Eventos

A aplicação categoriza os eventos em dois tipos, de acordo com o seu destino:

-   **Eventos Operacionais**: são eventos que representam ações específicas que ocorrem na infraestrutura da aplicação. Eles são consumidos por serviços que precisam reagir a essas ações. Utilizam o AWS EventBridge para publicação e consumo.

-   **Eventos de Notificação**: São eventos que representam ações específicas que ocorrem na aplicação. Eles são consumidos por serviços que precisam notificar usuários sobre essas ações. Utilizam o AWS AppSync para publicação e consumo.

## Eventos Operacionais

### EC2 Instance State-change Notification

O evento `EC2 Instance State-change Notification` é publicado pelo serviço EC2 da AWS sempre que o estado de uma instância EC2 muda. Ele é consumido por uma função Lambda que notifica o dono da instância sobre a mudança de estado através de uma mensagem do Amazon AppSync.

### INSTANCE_CONNECTION_ENDED

O evento `INSTANCE_CONNECTION_ENDED` indica que a conexão com uma instância foi encerrada. Ele é consumido por uma função Lambda que agenda o desligamento da instância, a fim de economizar recursos.

### INSTANCE_CONNECTION_STARTED

O evento `INSTANCE_CONNECTION_STARTED` indica que a conexão com uma instância foi iniciada. Ele é consumido por uma função Lambda que cancela o desligamento da instância, a fim de manter a instância disponível.

### INSTANCE_IDLE

O evento `INSTANCE_IDLE` indica que uma instância está ociosa. Ele é consumido por uma função Lambda que inicia o desligamento da instância imediatamente.

## Eventos de Notificação

### INSTANCE_LAUNCHED

O evento `INSTANCE_LAUNCHED` é publicado sempre que uma nova instância é lançada. Ele é consumido pela aplicação cliente, que notifica o usuário sobre a nova instância.

### INSTANCE_STATE_CHANGED

O evento `INSTANCE_STATE_CHANGED` é publicado sempre que o estado de uma instância é alterado. Ele é consumido pela aplicação cliente, que notifica o usuário sobre a mudança de estado da instância.
