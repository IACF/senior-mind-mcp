---
name: code-review
description: Orquestra revisão de código usando Senior Mind MCP. Use quando revisar código, detectar code smells, sugerir refatorações ou analisar qualidade.
---

# Code Review com Senior Mind

## Workflow de Revisão

1. **Identificar o contexto**
   - Framework: Laravel, NestJS, Vue, React ou genérico?
   - Camada: Controller, Service, Repository, Component?

2. **Executar análise completa**
   - Chamar `review_code` (tool MCP) com:
     - `code`: código a revisar
     - `language`: php/typescript/javascript/vue/react
     - `focus`: clean-code, object-calisthenics ou all
   - Consultar resource `senior-mind://references/clean-code`
   - Consultar resource `senior-mind://references/object-calisthenics`

3. **Detectar code smells por categoria**
   - Chamar `detect_code_smells` (tool MCP) com:
     - `category`: comments, functions, general, names ou all
     - Foco em: magic numbers, flag arguments, God class, Long Method, Data Clumps

4. **Sugerir refatorações específicas**
   - Se violações de Object Calisthenics detectadas:
     - Chamar `suggest_refactoring` (tool MCP) com:
       - `rules`: regras específicas (ex.: "one-level-indentation,small-classes")
   - Priorizar refatorações de severidade alta

5. **Aplicar convenções do framework**
   - **Backend Laravel**: consultar resource `senior-mind://references/laravel-conventions`
   - **Backend NestJS**: consultar resource `senior-mind://references/nestjs-patterns`
   - **Frontend Vue**: consultar resource `senior-mind://references/vue-patterns`
   - **Frontend React**: consultar resource `senior-mind://references/react-patterns`

6. **Template de revisão estruturada (opcional)**
   - Para revisão formal, invocar prompt MCP:
     - Backend: `code-review-backend` (framework: laravel/nestjs)
     - Frontend: `code-review-frontend` (framework: vue/react)

## Estrutura do Relatório

Organize os resultados em:

- **Violações Críticas (severidade alta)**: Devem ser corrigidas antes de merge
- **Melhorias (severidade média)**: Recomendadas para qualidade
- **Sugestões (severidade baixa)**: Opcionais para excelência
- **Refatorações Específicas**: Antes/depois com regra aplicada

## Exemplo de Uso

```
Usuário: "Revise este código Laravel"
Agente:
1. Chama review_code(code, language="php", focus="all")
2. Chama detect_code_smells(code, language="php", category="all")
3. Consulta resource laravel-conventions
4. Se necessário: suggest_refactoring(code, language="php", rules="...")
5. Apresenta relatório estruturado
```

## Princípios Complementares

Quando necessário explicar princípios:
- Chamar `explain_principle` (tool MCP) com:
  - `principle`: srp, ocp, lsp, isp, dip, dry, kiss, yagni, demeter, tell-dont-ask, first, solid
  - `language`: linguagem do código
  - `context`: contexto opcional (ex.: "validação em React")
