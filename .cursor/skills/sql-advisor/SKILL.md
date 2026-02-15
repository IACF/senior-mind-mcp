---
name: sql-advisor
description: Compara ORM vs SQL e analisa queries com Senior Mind MCP. Use ao otimizar queries, decidir entre ORM/SQL ou resolver problemas de performance.
---

# SQL Advisor com Senior Mind

## Workflow de Assessoria SQL

### 1. Comparar ORM vs SQL Puro

Quando decidir entre Eloquent/Query Builder (Laravel) ou TypeORM/Raw SQL (NestJS):

1. **Chamar `compare_sql` (tool MCP)**:
   - `description`: descrição da operação (ex.: "buscar pedidos com itens e usuários")
   - `technology`: laravel/nestjs/generic
   - `tables`: nomes das tabelas envolvidas (separadas por vírgula)
   - `context`: contexto adicional (ex.: "listagem paginada, filtros")

   **Resultado esperado:**
   - Código ORM (Eloquent ou TypeORM)
   - Código SQL puro equivalente
   - Análise de performance (N+1, índices, explain)
   - Recomendação (quando usar ORM, quando usar SQL)

2. **Quando usar ORM (recomendações típicas):**
   - CRUD simples
   - Queries com relacionamentos diretos (1:N, N:M)
   - Prototipagem rápida
   - Abstração de banco necessária

3. **Quando usar SQL puro (recomendações típicas):**
   - Agregações complexas
   - Queries com subqueries, CTEs, window functions
   - Otimização crítica de performance
   - Bulk operations

### 2. Analisar Query SQL Existente

Quando tiver uma query SQL complexa ou com problemas de performance:

1. **Invocar prompt `sql-analysis` (MCP)**:
   - `query`: query SQL completa
   - `context`: contexto da query (opcional, ex.: "executa a cada 5s no dashboard")

   **Resultado esperado:**
   - Template de análise SQL preenchido:
     - Leitura estruturada da query (propósito, tabelas, joins, filtros)
     - Pontos de atenção (N+1, full scan, cartesian product)
     - Sugestões de índices
     - Alternativas de otimização
     - Testes sugeridos (explain, benchmark)

2. **Validar com EXPLAIN ANALYZE**:
   - Executar `EXPLAIN ANALYZE` da query original
   - Executar das alternativas sugeridas
   - Comparar custo estimado e tempo real

## Exemplo de Uso: Comparação ORM vs SQL

```
Usuário: "Buscar pedidos dos últimos 30 dias com itens e usuários no Laravel"
Agente:
1. compare_sql(description="Buscar pedidos dos últimos 30 dias com itens e usuários", technology="laravel", tables="orders,order_items,users", context="Dashboard, paginado, filtros por status")
   → Retorna: ORM (Eloquent), SQL puro, Análise (ORM com eager loading + índice em created_at), Índices sugeridos
```

## Exemplo de Uso: Análise de Query

```
Usuário: "Analisar esta query lenta: [query complexa com 5 joins]"
Agente:
1. Invoca sql-analysis prompt(query="...", context="relatório financeiro mensal")
   → Retorna template preenchido: Propósito, Tabelas, Pontos de atenção, Sugestões, Query otimizada
```

## Integração com Framework

Ao trabalhar com Laravel ou NestJS:

- **Laravel**: consultar `senior-mind://references/laravel-conventions`
  - N+1 queries (eager loading)
  - Query scopes
  - Database transactions

- **NestJS**: consultar `senior-mind://references/nestjs-patterns`
  - TypeORM relations
  - QueryBuilder vs Repository
  - Custom repositories

Isso garante que as recomendações SQL sigam as convenções do framework.
