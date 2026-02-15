---
name: architecture-advisor
description: Guia decisões arquiteturais usando Senior Mind MCP. Use ao projetar features, validar Clean Architecture, explicar SOLID/DDD ou documentar ADRs.
---

# Architecture Advisor com Senior Mind

## Workflow de Assessoria Arquitetural

### 1. Analisar o Problema

Quando o usuário descrever uma feature ou problema arquitetural:

1. **Chamar `analyze_architecture` (tool MCP)**
   - `problem`: descrição do problema/feature
   - `technology`: laravel/nestjs/generic
   - `context`: contexto adicional (tamanho do projeto, restrições)

   **Resultado esperado:**
   - 2-3 opções de arquitetura (Clean Architecture, Service Layer, DDD)
   - Pros/cons de cada abordagem
   - Recomendação com justificativa

2. **Consultar resources fundamentais**
   - `senior-mind://references/clean-architecture` (camadas, regra de dependência)
   - `senior-mind://references/clean-architecture-patterns` (Repository, Use Case, DTOs)
   - `senior-mind://references/solid-principles` (SRP, OCP, DIP)

### 2. Validar Estrutura de Camadas

Quando o usuário tiver código/estrutura existente:

1. **Chamar `validate_architecture` (tool MCP)**
   - `structure`: estrutura de pastas/módulos ou código
   - `technology`: laravel/nestjs/generic
   - `layer`: entity/usecase/adapter/framework ou all

   **Resultado esperado:**
   - Imports inválidos (ex.: Entity importando Framework)
   - Violações da regra de dependência
   - Sugestões de correção

2. **Se violações detectadas:**
   - Explicar o princípio violado com `explain_principle`
   - Consultar `senior-mind://references/design-patterns` para soluções

### 3. Explicar Princípios

Para ensinar ou justificar decisões:

1. **Chamar `explain_principle` (tool MCP)**
   - Princípios disponíveis: srp, ocp, lsp, isp, dip, dry, kiss, yagni, demeter, tell-dont-ask, first, solid
   - `language`: php/typescript/javascript/generic
   - `context`: contexto específico (opcional)

   **Resultado esperado:**
   - Explicação do princípio
   - Exemplo (como aplicar)
   - Contra-exemplo (violação)
   - Aplicação no contexto fornecido

### 4. Documentar Decisão (ADR)

Quando uma decisão arquitetural for tomada:

1. **Invocar prompt `architecture-decision` (MCP)**
   - `problem`: problema que motivou a decisão
   - `constraints`: restrições técnicas/negócio (opcional)

   **Resultado esperado:**
   - Template ADR preenchido (Status, Contexto, Decisão, Consequências)

## Exemplo de Fluxo Completo

```
Usuário: "Como arquitetar um módulo de pagamentos no NestJS?"
Agente:
1. analyze_architecture(problem="Módulo de pagamentos com múltiplos gateways", technology="nestjs", context="API REST, ~5 gateways")
   → Recomenda: Clean Architecture com Strategy pattern
2. Consulta resources: clean-architecture (camadas), design-patterns (Strategy, Adapter)
3. validate_architecture(structure="[estrutura proposta]", technology="nestjs", layer="all")
   → Valida conformidade
4. Documenta com architecture-decision prompt → Gera ADR
```

## Convenções de Framework

Ao trabalhar com frameworks específicos:

- **Laravel**: consultar `senior-mind://references/laravel-conventions`
- **NestJS**: consultar `senior-mind://references/nestjs-patterns`

Isso garante que a arquitetura proposta siga convenções idiomáticas.
