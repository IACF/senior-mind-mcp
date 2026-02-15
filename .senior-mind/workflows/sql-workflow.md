# Workflow: SQL Advisor com Senior Mind

Use ao comparar ORM vs SQL, otimizar queries ou analisar performance.

## Comparar ORM vs SQL

Chamar tool MCP `compare_sql`:
- description: descrição da operação
- technology: laravel | nestjs | generic
- tables: tabelas envolvidas (vírgula)
- context: ex. listagem paginada, filtros

Resultado: código ORM, SQL equivalente, análise de performance (N+1, índices), recomendação.

## Analisar query existente

Invocar prompt MCP `sql-analysis` (query, context).

Resultado: propósito, tabelas, pontos de atenção, sugestões de índices, alternativas, testes sugeridos.

Resources: senior-mind://references/laravel-conventions, nestjs-patterns para convenções de framework.
