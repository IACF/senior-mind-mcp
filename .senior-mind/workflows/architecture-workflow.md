# Workflow: Architecture Advisor com Senior Mind

Use ao projetar features, validar Clean Architecture ou documentar ADRs.

## Workflow

1. Chamar tool MCP `analyze_architecture` (problem, technology, context)
2. Consultar resources: senior-mind://references/clean-architecture, clean-architecture-patterns, solid-principles
3. Se código/estrutura existente: chamar tool MCP `validate_architecture` (structure, technology, layer)
4. Se princípio violado: chamar tool MCP `explain_principle` (principle, language, context)
5. Documentar decisão: invocar prompt MCP `architecture-decision` (problem, constraints)

Resources: design-patterns para soluções.
