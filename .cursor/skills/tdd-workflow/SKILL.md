---
name: tdd-workflow
description: Guia o ciclo TDD (Red-Green-Refactor) + Mentor Mode usando Senior Mind MCP. OBRIGATÓRIO para tarefas complexas/medianas, opcional para simples.
---

# TDD Workflow com Senior Mind - Condicional por Complexidade

## Passo 0: SEMPRE perguntar a complexidade primeiro

**Antes de qualquer implementação, o agente pergunta ao usuário e aguarda a resposta:**

**"Esta tarefa é complexa, mediana ou simples?"**

**Quem classifica é SEMPRE o usuário.** O agente NUNCA decide ou infere; apenas pergunta e aplica o fluxo conforme a resposta.

### Ação Baseada na Resposta do Usuário

- Se o usuário disser **complexa ou mediana** → Seguir workflow TDD + Mentor Mode completo (abaixo)
- Se o usuário disser **simples** → Perguntar: "Deseja seguir TDD mesmo assim?"
  - Se sim → seguir workflow completo
  - Se não → implementação direta com code review opcional ao final

(Opcional: o agente pode exibir exemplos como referência para o usuário decidir — complexa: >3 dias, múltiplos módulos; mediana: 1-3 dias; simples: <1 dia, CRUD/bug pontual — mas não usa isso para classificar.)

---

## Workflow Completo: TDD + Mentor Mode (Complexa/Mediana)

### Passo 1: Invocar Mentor Mode primeiro

Antes de qualquer código, **OBRIGATORIAMENTE** invocar prompt `mentor-mode` (MCP):

- `feature`: descrição do que será implementado (feature/bug/refatoração)
- `technology`: laravel/nestjs/generic
- `complexity`: low/medium/high (estimativa inicial)

**Resultado esperado:**
- 5 checkpoints obrigatórios:
  1. Análise Arquitetural
  2. Revisão Clean Code
  3. Contratos e Interfaces (SOLID)
  4. Estratégia de Testes (TDD)
  5. Implementação Guiada

**REGRA:** O agente NÃO pode escrever código de produção ANTES de aprovar todos os 5 checkpoints.

## Ciclo TDD com Gates de Aprovação

Após aprovar os checkpoints do Mentor Mode, o Senior Mind MCP guia cada fase do TDD com validação antes de prosseguir.

### Fase 1: RED (Escrever teste que falha)

1. **Invocar prompt `tdd-cycle` (MCP)** para guia completo:
   - `feature`: descrição da feature
   - `technology`: laravel/nestjs/generic

   **Resultado esperado:**
   - Template com checklists para cada fase
   - Estratégias de teste por camada (Entity → Use Case → Adapter)

2. **Chamar `tdd_guide` (tool MCP) na fase RED**:
   - `feature`: nome da feature
   - `phase`: "red"
   - `technology`: laravel/nestjs/generic
   - `test_code`: código do teste criado

   **Gate de aprovação para GREEN:**
   - Teste compila mas FALHA (comportamento esperado não implementado)
   - Teste é claro e específico (FIRST principles)
   - Um único caso de teste por vez (baby steps)

3. **Consultar `senior-mind://references/tdd-reference`**:
   - FIRST principles (Fast, Independent, Repeatable, Self-validating, Timely)
   - Estratégias de teste por camada

### Fase 2: GREEN (Fazer o teste passar)

1. **Chamar `tdd_guide` (tool MCP) na fase GREEN**:
   - `phase`: "green"
   - `code`: código de produção implementado
   - `test_code`: código do teste

   **Gate de aprovação para REFACTOR:**
   - Teste passa (verde)
   - Código é mínimo para fazer passar (sem over-engineering)
   - Não há outros testes falhando

### Fase 3: REFACTOR (Melhorar código mantendo testes verdes)

1. **Chamar `tdd_guide` (tool MCP) na fase REFACTOR**:
   - `phase`: "refactor"
   - `code`: código após refatoração
   - `test_code`: testes (devem permanecer verdes)

   **Validação:**
   - Todos os testes continuam passando
   - Código segue Clean Code e Object Calisthenics
   - Duplicação eliminada (DRY)

2. **Complementar com tools de qualidade** (se necessário):
   - Chamar `review_code` (focus="all") para validar refatoração
   - Chamar `detect_code_smells` para garantir ausência de smells
   - Chamar `suggest_refactoring` se Object Calisthenics violado

### Ciclo Completo

```
RED → GREEN → REFACTOR → [próximo teste RED]
Gate   Gate     Gate + Code Review
```

## Estratégia de Testes por Camada (Clean Architecture)

Ordem recomendada pelo Senior Mind:

1. **Entity** (domínio): testes unitários puros (sem dependências)
2. **Use Case** (regras de negócio): testes com test doubles (mocks/stubs)
3. **Adapter** (controllers, repositories): testes de integração
4. **Framework** (infraestrutura): testes end-to-end (quando necessário)

Consultar `senior-mind://references/tdd-reference` para patterns de teste por camada.

## Fluxo Completo Obrigatório (quando aplicável)

```
1. mentor-mode → 5 checkpoints (arquitetura, clean code, SOLID, TDD, implementação)
2. tdd-cycle prompt → guia completo Red-Green-Refactor
3. Fase RED → tdd_guide → Gate RED
4. Fase GREEN → tdd_guide → Gate GREEN
5. Fase REFACTOR → tdd_guide + review_code + detect_code_smells → Gate REFACTOR
6. Repetir ciclo até feature completa
```

Este fluxo é OBRIGATÓRIO quando o usuário informou complexa/mediana (ou quando informou simples e optou por TDD).
