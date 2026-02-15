# WORKFLOW CONDICIONAL: TDD + Mentor Mode (Baseado em Complexidade)

Você DEVE seguir este workflow, adaptando ao nível de complexidade da tarefa.

## Passo 0: PERGUNTAR COMPLEXIDADE (OBRIGATÓRIO)

Antes de qualquer implementação, perguntar ao usuário e aguardar a resposta:

**"Esta tarefa é complexa, mediana ou simples?"**

**Quem classifica é SEMPRE o usuário.** O agente NUNCA decide ou infere a complexidade; apenas pergunta e aplica o fluxo conforme a resposta.

## Ação Baseada na Resposta do Usuário

- Se o usuário disser **complexa ou mediana** → Seguir workflow TDD + Mentor Mode completo (abaixo)
- Se o usuário disser **simples** → Perguntar "Deseja seguir TDD mesmo assim?"
  - Se sim → seguir workflow completo
  - Se não → implementação direta com code review opcional ao final

---

## Workflow Completo: TDD + Mentor Mode (Complexa/Mediana ou opcional em Simples)

### Mentor Mode (OBRIGATÓRIO quando aplicável)

Antes de qualquer código, invocar prompt MCP `mentor-mode`:
- feature: [descrição]
- technology: laravel/nestjs/generic
- complexity: low/medium/high

Aprovar 5 checkpoints:
1. Análise Arquitetural
2. Revisão Clean Code
3. Contratos e Interfaces (SOLID)
4. Estratégia de Testes (TDD)
5. Implementação Guiada

NÃO escrever código ANTES de aprovar todos os checkpoints.

## Ciclo TDD (OBRIGATÓRIO quando aplicável)

### Fase RED
1. Invocar prompt MCP `tdd-cycle`
2. Chamar tool MCP `tdd_guide(phase="red", test_code=...)`
3. Validar gate RED (teste compila mas falha, claro, um caso por vez)

### Fase GREEN
1. Chamar tool MCP `tdd_guide(phase="green", code=..., test_code=...)`
2. Validar gate GREEN (teste passa, código mínimo, outros testes verdes)

### Fase REFACTOR
1. Chamar tool MCP `tdd_guide(phase="refactor", code=..., test_code=...)`
2. Chamar tool MCP `review_code(code, language, focus="all")`
3. Chamar tool MCP `detect_code_smells(code, language, category="all")`
4. Validar gate REFACTOR (testes verdes, Clean Code, DRY)

### Ciclo Completo
RED → GREEN → REFACTOR → [próximo teste RED]

MCP Resources a consultar:
- senior-mind://references/tdd-reference
- senior-mind://references/clean-code
- senior-mind://references/object-calisthenics
