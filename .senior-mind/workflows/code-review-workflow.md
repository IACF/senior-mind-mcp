# Workflow: Code Review com Senior Mind

Use quando revisar código, detectar code smells ou sugerir refatorações.

## Workflow

1. Identificar framework/linguagem (Laravel, NestJS, Vue, React ou genérico)
2. Chamar tool MCP `review_code` (code, language, focus: clean-code | object-calisthenics | all)
3. Chamar tool MCP `detect_code_smells` (code, language, category: comments | functions | general | names | all)
4. Se violações: chamar tool MCP `suggest_refactoring` (code, language, rules)
5. Consultar resources: senior-mind://references/clean-code, object-calisthenics, e do framework (laravel-conventions, nestjs-patterns, vue-patterns, react-patterns)
6. Apresentar relatório estruturado (crítico/médio/baixo)

Prompts MCP opcionais: `code-review-backend` ou `code-review-frontend` para template formal.
