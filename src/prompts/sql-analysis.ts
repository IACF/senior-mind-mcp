import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { config } from "../config.js";

export function register(server: McpServer): void {
  server.prompt(
    "sql-analysis",
    "Gera um template de analise profunda de query SQL: EXPLAIN ANALYZE, indices, N+1, JOINs vs subqueries",
    {
      query: z.string().describe("Query SQL ou descricao da query a ser analisada"),
      context: z
        .string()
        .optional()
        .describe("Contexto: volume de dados, banco (PostgreSQL, MySQL), estrutura de tabelas"),
    },
    ({ query, context }) => {
      let template = `# Analise de Query SQL\n\n`;
      template += `**Analista**: ${config.developerName}\n\n`;
      template += `---\n\n`;

      template += `## Query a analisar\n\n`;
      template += `\`\`\`sql\n${query}\n\`\`\`\n\n`;

      if (context) {
        template += `**Contexto**: ${context}\n\n`;
      }

      template += `---\n\n`;

      template += `## 1. EXPLAIN ANALYZE\n\n`;
      template += `Execute a query com EXPLAIN ANALYZE para obter o plano de execucao:\n\n`;
      template += `\`\`\`sql\nEXPLAIN ANALYZE\n${query}\n\`\`\`\n\n`;
      template += `### O que observar:\n`;
      template += `- [ ] **Seq Scan vs Index Scan**: Ha sequential scans em tabelas grandes?\n`;
      template += `- [ ] **Rows estimados vs reais**: Estatisticas do planner estao atualizadas?\n`;
      template += `- [ ] **Nested Loop vs Hash Join**: O tipo de join e adequado para o volume?\n`;
      template += `- [ ] **Sort**: Ha sorts sem indice? Considere indice na coluna ORDER BY\n`;
      template += `- [ ] **Custo total**: O custo esta aceitavel para o cenario?\n\n`;

      template += `## 2. Indices\n\n`;
      template += `### Verificar indices existentes:\n`;
      template += `\`\`\`sql\n-- PostgreSQL\nSELECT indexname, indexdef\nFROM pg_indexes\nWHERE tablename = 'nome_tabela';\n\n-- MySQL\nSHOW INDEX FROM nome_tabela;\n\`\`\`\n\n`;
      template += `### Checklist de indices:\n`;
      template += `- [ ] Colunas em **WHERE** tem indice?\n`;
      template += `- [ ] Colunas em **JOIN ON** tem indice?\n`;
      template += `- [ ] Colunas em **ORDER BY** tem indice?\n`;
      template += `- [ ] **Indices compostos**: Para queries com multiplas condicoes, considere indice composto na ordem correta (mais seletivo primeiro)\n`;
      template += `- [ ] **Indices parciais**: Para queries com filtro fixo (ex.: WHERE status = 'active'), considere indice parcial\n`;
      template += `- [ ] **Cardinalidade**: Evite indices em colunas com poucos valores distintos (booleanos, enums pequenos)\n\n`;

      template += `## 3. Problema N+1\n\n`;
      template += `### Deteccao:\n`;
      template += `- [ ] A query e executada dentro de um loop?\n`;
      template += `- [ ] Para cada registro pai, ha uma query separada para buscar filhos?\n`;
      template += `- [ ] O ORM esta fazendo lazy loading implicito?\n\n`;
      template += `### Solucao:\n`;
      template += `- **Eager loading**: Carregar relacoes na query principal\n`;
      template += `- **JOIN**: Trazer dados relacionados em uma unica query\n`;
      template += `- **Subquery IN**: \`WHERE id IN (SELECT ...)\` para batch loading\n`;
      template += `- **Ferramentas**: Use query logger para contar queries por request\n\n`;

      template += `## 4. JOINs vs Subqueries\n\n`;
      template += `### Quando usar JOIN:\n`;
      template += `- Combinar dados de tabelas relacionadas\n`;
      template += `- Quando precisa de colunas de ambas as tabelas\n`;
      template += `- Geralmente mais performatico para relacoes 1:1 e 1:N\n\n`;
      template += `### Quando usar Subquery:\n`;
      template += `- Filtros complexos com EXISTS/NOT EXISTS\n`;
      template += `- Agregacoes independentes\n`;
      template += `- Quando o otimizador transforma em semi-join (EXISTS)\n\n`;
      template += `### Checklist:\n`;
      template += `- [ ] JOINs estao usando colunas indexadas?\n`;
      template += `- [ ] Tipo de JOIN correto (INNER vs LEFT vs EXISTS)?\n`;
      template += `- [ ] Subqueries correlacionadas podem ser reescritas como JOIN?\n`;
      template += `- [ ] CTEs (WITH) para queries complexas melhoram legibilidade?\n\n`;

      template += `## 5. Otimizacoes Sugeridas\n\n`;
      template += `- [ ] **SELECT especifico**: Selecionar apenas colunas necessarias (nao SELECT *)\n`;
      template += `- [ ] **LIMIT**: Usar paginacao para conjuntos grandes\n`;
      template += `- [ ] **Cache**: Queries frequentes com dados estaveis podem ser cacheadas\n`;
      template += `- [ ] **Materialized Views**: Para agregacoes pesadas executadas frequentemente\n`;
      template += `- [ ] **VACUUM/ANALYZE**: Manter estatisticas atualizadas (PostgreSQL)\n\n`;

      template += `---\n\n`;
      template += `> ${config.developerName}, execute o EXPLAIN ANALYZE e preencha os checklists acima. Cada otimizacao deve ser validada com medicao antes e depois.\n`;

      return {
        messages: [
          {
            role: "user" as const,
            content: { type: "text" as const, text: template },
          },
        ],
      };
    }
  );
}
