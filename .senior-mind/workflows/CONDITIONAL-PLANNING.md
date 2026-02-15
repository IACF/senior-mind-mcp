# WORKFLOW OBRIGATÓRIO: Implementation Planning (com Complexidade definida pelo Usuário)

Quando em modo planejamento (antes de implementar), você DEVE seguir este workflow.

## Passo 0: PERGUNTAR COMPLEXIDADE (OBRIGATÓRIO)

Antes de gerar o plano, perguntar ao usuário e aguardar a resposta:

**"Esta tarefa/feature é complexa, mediana ou simples?"**

**Quem classifica é SEMPRE o usuário.** O agente NUNCA decide ou infere; apenas pergunta e adapta o plano conforme a resposta.

## Passo 1: Questionário de Alinhamento

Invocar prompt MCP `implementation-plan`:
- feature: [descrição]
- context: [contexto técnico]
- team_context: [nível da equipe]

Preencher questionário:
- Requisitos funcionais/não-funcionais
- Stack técnica
- Complexidade (a que o usuário informou)
- IDE/agente em uso
- Nível da equipe

## Passo 2: Gerar Plano Faseado

Chamar tool MCP `plan_implementation`:
- feature: [descrição]
- technology: laravel/nestjs/generic
- requirements: [lista]
- team_context: [opcional]

Resultado esperado ADAPTADO à resposta do usuário sobre complexidade:

**Se o usuário disse complexa ou mediana:**
- Plano detalhado com 5+ fases (Entidades → Repository → Service/TDD → API → Refinamentos)
- TDD + Mentor Mode obrigatórios em todas as fases de implementação
- Para cada fase: nível do modelo (rápido/avançado), justificativa, dica de uso
- Tabela resumo consolidando recomendações

**Se o usuário disse simples:**
- Plano simplificado (1-3 fases principais)
- TDD + Mentor Mode opcionais (perguntar ao usuário)
- Foco em eficiência (menos checkpoints, menos overhead)
- Tabela resumo simplificada

## Passo 3: Apresentar Plano

Apresentar plano ANTES de implementar, indicando:
- Qual skill/sub-agent usar em cada fase
- Quando usar tdd-workflow:
  - **Complexa/Mediana**: obrigatório em todas as fases
  - **Simples**: opcional (perguntar ao usuário)
- Quando usar architecture-advisor (fase de entidades/arquitetura)

**REGRA: Não implementar sem plano aprovado quando em modo Plan.**

MCP Resources a consultar:
- senior-mind://references/clean-architecture
- senior-mind://references/solid-principles
