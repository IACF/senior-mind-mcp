---
name: implementation-planning
description: OBRIGATÓRIO no modo Plan. Cria planos de implementação faseados com recomendação de agente IA por fase e avaliação de complexidade. Use SEMPRE em modo Plan.
---

# Implementation Planning com Senior Mind - OBRIGATÓRIO NO MODO PLAN

**REGRA FUNDAMENTAL: Quando estiver em modo Plan, SEMPRE use este workflow (incluindo pergunta de complexidade).**

## Detectar Modo Plan

Este workflow é obrigatório quando:
- Cursor: está em "Plan Mode" (antes de aprovar para execução)
- Claude Code: usuário pediu "crie um plano" ou "planeje a implementação"
- Outros agentes: contexto de planejamento antes de implementação

## Passo 0: SEMPRE perguntar a complexidade primeiro

**Antes de gerar o plano, o agente pergunta ao usuário e aguarda a resposta:**

**"Esta tarefa/feature é complexa, mediana ou simples?"**

**Quem classifica é SEMPRE o usuário.** O agente NUNCA decide ou infere; apenas pergunta e adapta o plano conforme a resposta.

### Impacto no Plano (conforme resposta do usuário)

- Se o usuário disser **complexa ou mediana** → Plano detalhado com TDD obrigatório em todas as fases
- Se o usuário disser **simples** → Plano simplificado, TDD opcional

## Workflow de Planejamento

### 1. Questionário de Alinhamento

Antes de gerar o plano, invocar prompt `implementation-plan` (MCP):

- `feature`: descrição da feature
- `context`: contexto técnico (opcional)
- `team_context`: nível da equipe (opcional, ex.: "equipe junior, 2 devs")

**Perguntas incluídas:**
- Requisitos funcionais/não-funcionais
- Stack técnica
- Complexidade estimada
- IDE/agente de IA em uso (Cursor, Claude Desktop, etc.)
- Nível da equipe (junior/pleno/senior)

**Resultado esperado:**
- Questionário preenchido
- Plano inicial de fases

### 2. Gerar Plano Faseado com Recomendação de IA

Chamar `plan_implementation` (tool MCP):

- `feature`: descrição da feature
- `technology`: laravel/nestjs/generic
- `requirements`: requisitos em formato estruturado ou lista
- `team_context`: (opcional) contexto da equipe

**Resultado esperado:**
- Plano dividido em 5+ fases típicas (complexa/mediana) ou 1-3 fases (simples):
  1. Entidades/Modelagem → **Agente avançado** (decisões de domínio)
  2. Repository → **Agente rápido** (boilerplate previsível)
  3. Service/TDD → **Agente avançado** (lógica de negócio)
  4. API/Controller → **Agente rápido** (DTOs e rotas mecânicas)
  5. Refinamentos → **Misto** (cache/performance = avançado; filtros = rápido)

- Para cada fase:
  - **Nível do modelo**: rápido ou avançado
  - **Justificativa**: por que este nível
  - **Dica de uso**: como instruir o agente (Agent mode, Chat mode, etc.)

- Tabela resumo ao final consolidando recomendações

### 3. Ajustar por Contexto da Equipe

Se `team_context` indicar equipe menos experiente:
- Mais fases com agente **avançado** (incluindo Repository e API)
- Reduz retrabalho e aumenta qualidade para times junior

Se equipe experiente:
- Mantém agente **rápido** para boilerplate
- Reserva agente **avançado** só para decisões críticas

## Integração com Outras Skills

Após gerar o plano:

- **Fase de entidades/arquitetura** → usar skill `architecture-advisor`
- **Fase de Service/TDD** → usar skill `tdd-workflow` (conforme complexidade informada pelo usuário)
- **Após implementação** → usar skill `code-review`

O plano indica QUANDO usar cada skill/sub-agent ao longo da implementação.

## Recomendação de Modelo (Cursor)

No Cursor, os modelos disponíveis geralmente são:

- **Avançado**: claude-sonnet-4, gpt-4 (para decisões arquiteturais, lógica complexa)
- **Rápido**: claude-sonnet-3.5, gpt-3.5-turbo (para boilerplate, CRUD, DTOs)

O plano gerado pelo Senior Mind indica qual usar em cada fase.
