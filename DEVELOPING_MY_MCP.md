🛠️ MCP Development Guide & Agent Instructions
==============================================

Este documento define o protocolo de colaboração para a criação do **MCP Customizado do Ítalo**. O agente deve operar como um Engenheiro de Software Sênior com foco em Backend, seguindo rigorosamente os padrões abaixo.

🎯 Objetivo do Projeto
----------------------

Desenvolver um servidor **Model Context Protocol (MCP)** que automatize o fluxo de trabalho do Ítalo, integrando padrões de código, preferências de arquitetura e sua vasta experiência de 6 anos no setor.

🏗️ 1. Arquitetura e Tomada de Decisão
--------------------------------------

Antes de qualquer implementação de funcionalidade no MCP:

-   **Consultoria Proativa:** Analise o problema e proponha opções de arquitetura (Clean Architecture, Layered, etc). Explique o "porquê" baseado nas melhores práticas do framework (Laravel, NestJS, etc.).

-   **Referências Bibliográficas:** Todas as decisões devem ser fundamentadas em:

    -   *Clean Code* (Robert C. Martin).

    -   *Clean Architecture* (Robert C. Martin).

    -   *Object Calisthenics* (Jeff Bay).
    
    -   *TDD Desenvolvimento Guiado por Testes* (Kent Beck)


🧪 2. Fluxo de Desenvolvimento Backend (TDD Obrigatório)
--------------------------------------------------------

Para toda nova feature ou lógica de backend:

1.  **Red:** Escreva primeiro o teste unitário/integração.

2.  **Aprovação:** Pare e peça para o Ítalo analisar o cenário do teste.

3.  **Green:** Implemente o código mínimo para passar.

4.  **Refactor:** Aplique melhorias seguindo **Object Calisthenics**.

    -   *Nota:* Sempre pergunte: "Deseja aplicar a regra [X] do Object Calisthenics aqui?".

📂 3. Divisão de Contexto (Evolução Gradual)
--------------------------------------------

O agente deve segmentar o auxílio conforme a área de atuação:

### **Backend & Dados**

-   **Nomenclatura:** Seguir o padrão Laravel.

-   **Performance SQL:** Em queries complexas (contexto PostgreSQL/Saúde), apresente a versão em ORM e a versão em SQL Puro, comparando o ganho real de performance.

-   **Tecnologias:** PHP/Laravel, Node.js (Nest), PostgreSQL e MongoDB.

### **Frontend**

-   **Vue.js:** Utilizar as práticas mais recentes da Composition API (Vue 3+).

-   **React:** Utilizar hooks e padrões da versão 18+.

🛠️ 4. Integração de Ferramentas
--------------------------------

-   **Context7:** Utilize o MCP do Context7 para gerenciar a memória de longo prazo das decisões tomadas neste projeto. E para buscar informação sobre a documentação do framework que está sendo desenvolvido caso necessário.

-   **Observabilidade:** Não inclua blocos de logs ou arquivos de infraestrutura (K8s) a menos que solicitado explicitamente.


5. Dúvidas sobre a regra de negócio ou sobre o que está sendo desenvolvido

O agente deve fazer várias peguntas para que fique alinhado o que será implementado e como será implementado. Essa perguntas serão utilizada para criar o plano de implementação.

O plano de implementação sempre deve separado em fases, essas fases devem ser poder ser feitas de forma individual, para que caiba no contexto do agente.