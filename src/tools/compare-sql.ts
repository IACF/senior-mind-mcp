import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { config } from "../config.js";

const technologyEnum = z.enum(["laravel-eloquent", "typeorm", "prisma"]);
type Technology = z.infer<typeof technologyEnum>;

function generateOrmExample(
  description: string,
  technology: Technology,
  tables?: string
): string {
  const desc = description.toLowerCase();

  if (technology === "laravel-eloquent") {
    if (desc.includes("join") || desc.includes("relacio") || desc.includes("relaco")) {
      return `// Laravel Eloquent — com eager loading\n$result = Order::with(['customer', 'items.product'])\n    ->where('status', 'active')\n    ->get();\n\n// Ou com query builder para mais controle:\n$result = DB::table('orders')\n    ->join('customers', 'orders.customer_id', '=', 'customers.id')\n    ->join('order_items', 'orders.id', '=', 'order_items.order_id')\n    ->select('orders.*', 'customers.name as customer_name')\n    ->where('orders.status', 'active')\n    ->get();`;
    }
    if (desc.includes("agrega") || desc.includes("count") || desc.includes("sum") || desc.includes("group")) {
      return `// Laravel Eloquent — agregacao\n$result = Order::query()\n    ->selectRaw('customer_id, COUNT(*) as total_orders, SUM(amount) as total_amount')\n    ->groupBy('customer_id')\n    ->having('total_orders', '>', 5)\n    ->get();`;
    }
    return `// Laravel Eloquent\n$result = Model::query()\n    ->where('column', 'value')\n    ->orderBy('created_at', 'desc')\n    ->paginate(15);`;
  }

  if (technology === "typeorm") {
    if (desc.includes("join") || desc.includes("relacio") || desc.includes("relaco")) {
      return `// TypeORM — com relations\nconst result = await orderRepository.find({\n  relations: ['customer', 'items', 'items.product'],\n  where: { status: 'active' },\n});\n\n// Ou com query builder para mais controle:\nconst result = await orderRepository\n  .createQueryBuilder('order')\n  .innerJoinAndSelect('order.customer', 'customer')\n  .innerJoinAndSelect('order.items', 'item')\n  .where('order.status = :status', { status: 'active' })\n  .getMany();`;
    }
    if (desc.includes("agrega") || desc.includes("count") || desc.includes("sum") || desc.includes("group")) {
      return `// TypeORM — agregacao\nconst result = await orderRepository\n  .createQueryBuilder('order')\n  .select('order.customerId', 'customerId')\n  .addSelect('COUNT(*)', 'totalOrders')\n  .addSelect('SUM(order.amount)', 'totalAmount')\n  .groupBy('order.customerId')\n  .having('COUNT(*) > :min', { min: 5 })\n  .getRawMany();`;
    }
    return `// TypeORM\nconst result = await repository.find({\n  where: { column: 'value' },\n  order: { createdAt: 'DESC' },\n  take: 15,\n  skip: 0,\n});`;
  }

  // Prisma
  if (desc.includes("join") || desc.includes("relacio") || desc.includes("relaco")) {
    return `// Prisma — com include\nconst result = await prisma.order.findMany({\n  where: { status: 'active' },\n  include: {\n    customer: true,\n    items: {\n      include: { product: true },\n    },\n  },\n});`;
  }
  if (desc.includes("agrega") || desc.includes("count") || desc.includes("sum") || desc.includes("group")) {
    return `// Prisma — agregacao\nconst result = await prisma.order.groupBy({\n  by: ['customerId'],\n  _count: { id: true },\n  _sum: { amount: true },\n  having: {\n    id: { _count: { gt: 5 } },\n  },\n});`;
  }
  return `// Prisma\nconst result = await prisma.model.findMany({\n  where: { column: 'value' },\n  orderBy: { createdAt: 'desc' },\n  take: 15,\n  skip: 0,\n});`;
}

function generateRawSqlExample(
  description: string,
  tables?: string
): string {
  const desc = description.toLowerCase();

  if (desc.includes("join") || desc.includes("relacio") || desc.includes("relaco")) {
    return `-- SQL puro\nSELECT\n  o.*,\n  c.name AS customer_name,\n  oi.product_id,\n  oi.quantity,\n  p.name AS product_name\nFROM orders o\nINNER JOIN customers c ON o.customer_id = c.id\nINNER JOIN order_items oi ON o.id = oi.order_id\nINNER JOIN products p ON oi.product_id = p.id\nWHERE o.status = 'active'\nORDER BY o.created_at DESC;`;
  }
  if (desc.includes("agrega") || desc.includes("count") || desc.includes("sum") || desc.includes("group")) {
    return `-- SQL puro\nSELECT\n  customer_id,\n  COUNT(*) AS total_orders,\n  SUM(amount) AS total_amount\nFROM orders\nGROUP BY customer_id\nHAVING COUNT(*) > 5\nORDER BY total_amount DESC;`;
  }
  return `-- SQL puro\nSELECT *\nFROM table_name\nWHERE column = 'value'\nORDER BY created_at DESC\nLIMIT 15 OFFSET 0;`;
}

function generatePerformanceAnalysis(
  description: string,
  technology: Technology,
  context?: string
): string {
  const desc = description.toLowerCase();
  let analysis = `## Analise de Performance\n\n`;

  // N+1
  if (desc.includes("join") || desc.includes("relacio") || desc.includes("relaco") || desc.includes("lista")) {
    analysis += `### Problema N+1\n`;
    analysis += `- **ORM**: Risco de N+1 se relationships nao forem carregadas com eager loading.\n`;

    if (technology === "laravel-eloquent") {
      analysis += `- **Solucao Laravel**: Use \`with()\` (eager loading) ou \`load()\` (lazy eager loading).\n`;
      analysis += `- **Deteccao**: Use o pacote \`barryvdh/laravel-debugbar\` para identificar queries N+1.\n\n`;
    } else if (technology === "typeorm") {
      analysis += `- **Solucao TypeORM**: Use \`relations\` no find ou \`leftJoinAndSelect\` no query builder.\n\n`;
    } else {
      analysis += `- **Solucao Prisma**: Use \`include\` para carregar relacoes em uma unica query.\n\n`;
    }
  }

  // JOINs
  analysis += `### JOINs vs Subqueries\n`;
  analysis += `- **JOINs** sao geralmente mais performaticos para combinar dados de tabelas relacionadas.\n`;
  analysis += `- **Subqueries** podem ser melhores para filtros complexos ou quando voce precisa de agregacoes independentes.\n`;
  analysis += `- **Dica**: Use \`EXPLAIN ANALYZE\` para comparar os planos de execucao.\n\n`;

  // Indices
  analysis += `### Indices recomendados\n`;
  analysis += `- Crie indices nas colunas usadas em \`WHERE\`, \`JOIN\` e \`ORDER BY\`.\n`;
  analysis += `- Para queries com multiplas condicoes, considere indices compostos.\n`;
  analysis += `- Evite indices em colunas com baixa cardinalidade (ex.: booleanos).\n\n`;

  if (desc.includes("agrega") || desc.includes("group")) {
    analysis += `### Agregacoes\n`;
    analysis += `- Agregacoes em tabelas grandes podem ser lentas. Considere:\n`;
    analysis += `  - Materialized views para dados que mudam pouco\n`;
    analysis += `  - Cache (Redis) para resultados frequentemente consultados\n`;
    analysis += `  - Paginacao ou limites nas agregacoes\n\n`;
  }

  if (context) {
    analysis += `### Contexto especifico\n`;
    analysis += `${context}\n\n`;
  }

  return analysis;
}

function formatOutput(
  description: string,
  technology: Technology,
  tables: string | undefined,
  context: string | undefined,
  ormCode: string,
  rawSql: string,
  performanceAnalysis: string
): string {
  const techLabel =
    technology === "laravel-eloquent"
      ? "Laravel Eloquent"
      : technology === "typeorm"
        ? "TypeORM"
        : "Prisma";

  let output = `# Comparacao ORM vs SQL Puro\n\n`;
  output += `**Query**: ${description}\n`;
  output += `**Tecnologia ORM**: ${techLabel}\n`;
  if (tables) {
    output += `**Tabelas**: ${tables}\n`;
  }
  output += `\n---\n\n`;

  output += `## Versao ORM (${techLabel})\n\n`;
  output += `\`\`\`${technology === "laravel-eloquent" ? "php" : "typescript"}\n${ormCode}\n\`\`\`\n\n`;

  output += `## Versao SQL Puro\n\n`;
  output += `\`\`\`sql\n${rawSql}\n\`\`\`\n\n`;

  output += performanceAnalysis;

  output += `## Recomendacao\n\n`;

  const desc = description.toLowerCase();
  const isComplex =
    desc.includes("agrega") ||
    desc.includes("subquer") ||
    desc.includes("window") ||
    desc.includes("cte") ||
    desc.includes("recursiv");

  if (isComplex) {
    output += `${config.developerName}, para esta query **recomendo SQL puro** (ou query builder). `;
    output += `Queries com agregacoes complexas, subqueries ou funcoes de window sao mais claras e performaticas em SQL direto. `;
    output += `O ORM pode gerar SQL ineficiente nestes casos.\n\n`;
  } else {
    output += `${config.developerName}, para esta query **recomendo usar o ORM** (${techLabel}). `;
    output += `A query e simples o suficiente para o ORM lidar bem, com os beneficios de type safety, `;
    output += `protecao contra SQL injection e manutencibilidade.\n\n`;
  }

  output += `**Dica**: Sempre valide com \`EXPLAIN ANALYZE\` em producao para confirmar o plano de execucao.\n`;

  return output;
}

export function register(server: McpServer): void {
  server.tool(
    "compare_sql",
    "Compara abordagem ORM vs SQL puro para queries complexas, com analise de performance",
    {
      description: z.string().describe("Descricao da query desejada"),
      technology: technologyEnum.describe(
        "Tecnologia ORM: laravel-eloquent, typeorm ou prisma"
      ),
      tables: z
        .string()
        .optional()
        .describe("Estrutura das tabelas envolvidas"),
      context: z
        .string()
        .optional()
        .describe("Contexto adicional: volume de dados, indices, etc."),
    },
    async ({ description, technology, tables, context }) => {
      const ormCode = generateOrmExample(description, technology, tables);
      const rawSql = generateRawSqlExample(description, tables);
      const performanceAnalysis = generatePerformanceAnalysis(
        description,
        technology,
        context
      );
      const text = formatOutput(
        description,
        technology,
        tables,
        context,
        ormCode,
        rawSql,
        performanceAnalysis
      );

      return {
        content: [{ type: "text", text }],
      };
    }
  );
}
