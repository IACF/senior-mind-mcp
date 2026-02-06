import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { config } from "../config.js";

const technologyEnum = z.enum(["laravel", "nestjs"]);
type Technology = z.infer<typeof technologyEnum>;

function generateAlignmentQuestions(
  feature: string,
  technology: Technology,
  requirements?: string
): string[] {
  const questions: string[] = [];

  // Perguntas universais sobre regra de negocio
  questions.push(
    `Quais sao os usuarios/atores que interagem com "${feature}"? (ex.: admin, usuario final, sistema externo)`
  );
  questions.push(
    `Quais sao as regras de negocio mais criticas para "${feature}"? Liste as validacoes obrigatorias.`
  );
  questions.push(
    `Existem integracoes com sistemas externos ou APIs de terceiros?`
  );
  questions.push(
    `Qual o volume esperado de dados/operacoes? (ex.: 100 registros/dia, 10k requisicoes/hora)`
  );
  questions.push(
    `Existem requisitos de seguranca especificos? (ex.: LGPD, autorizacao por roles, audit log)`
  );

  // Perguntas sobre fluxo
  questions.push(
    `Qual o fluxo principal (happy path) de "${feature}" passo a passo?`
  );
  questions.push(
    `Quais situacoes de erro devem ser tratadas? (ex.: dados duplicados, timeout, recurso nao encontrado)`
  );

  // Perguntas tecnicas por stack
  if (technology === "laravel") {
    questions.push(
      `Ja existem Models/tabelas relacionados que serao reutilizados? Quais?`
    );
    questions.push(
      `A feature precisa de processamento assincrono (Jobs/Queues)?`
    );
    questions.push(
      `Sera exposta como API REST, web (Blade/Inertia) ou ambos?`
    );
  } else {
    questions.push(
      `Ja existem Modules/Entities relacionados que serao reutilizados? Quais?`
    );
    questions.push(
      `A feature precisa de eventos assincronos (Event Emitter, Message Queue)?`
    );
    questions.push(
      `Sera exposta como API REST, GraphQL ou ambos?`
    );
  }

  if (!requirements) {
    questions.push(
      `Ha requisitos nao-funcionais importantes? (performance, disponibilidade, escalabilidade)`
    );
  }

  return questions;
}

function generateImplementationPlan(
  feature: string,
  technology: Technology,
  requirements?: string
): string {
  const techLabel = technology === "laravel" ? "Laravel" : "NestJS";
  const lang = technology === "laravel" ? "php" : "typescript";

  let plan = `## Plano de Implementacao Faseado\n\n`;

  // Fase 1: Estrutura e Entidades
  plan += `### Fase 1: Estrutura e Entidades de Dominio\n\n`;
  plan += `**Objetivo**: Criar a estrutura base e as entidades do dominio.\n\n`;

  if (technology === "laravel") {
    plan += `**Arquivos**:\n`;
    plan += `- \`app/Models/${pascalCase(feature)}.php\` — Model Eloquent\n`;
    plan += `- \`database/migrations/xxxx_create_${snakeCase(feature)}_table.php\` — Migration\n`;
    plan += `- \`database/factories/${pascalCase(feature)}Factory.php\` — Factory para testes\n\n`;
  } else {
    plan += `**Arquivos**:\n`;
    plan += `- \`src/${kebabCase(feature)}/${kebabCase(feature)}.entity.ts\` — Entidade\n`;
    plan += `- \`src/${kebabCase(feature)}/${kebabCase(feature)}.module.ts\` — Module NestJS\n`;
    plan += `- \`src/${kebabCase(feature)}/dto/\` — DTOs de entrada e saida\n\n`;
  }

  plan += `**Testes**:\n`;
  plan += `- Testes unitarios para validacoes da entidade\n`;
  plan += `- Testes para factory/fixtures\n\n`;

  // Fase 2: Repository / Acesso a Dados
  plan += `### Fase 2: Acesso a Dados (Repository)\n\n`;
  plan += `**Objetivo**: Implementar a camada de acesso a dados.\n\n`;

  if (technology === "laravel") {
    plan += `**Arquivos**:\n`;
    plan += `- \`app/Repositories/${pascalCase(feature)}Repository.php\` — Interface\n`;
    plan += `- \`app/Repositories/Eloquent${pascalCase(feature)}Repository.php\` — Implementacao\n\n`;
  } else {
    plan += `**Arquivos**:\n`;
    plan += `- \`src/${kebabCase(feature)}/${kebabCase(feature)}.repository.ts\` — Interface + Implementacao\n\n`;
  }

  plan += `**Testes**:\n`;
  plan += `- Testes de integracao com banco (factory + repository)\n\n`;

  // Fase 3: Service / Logica de Negocio
  plan += `### Fase 3: Logica de Negocio (Service)\n\n`;
  plan += `**Objetivo**: Implementar os casos de uso com TDD.\n\n`;

  if (technology === "laravel") {
    plan += `**Arquivos**:\n`;
    plan += `- \`app/Services/${pascalCase(feature)}Service.php\` — Logica de negocio\n`;
    plan += `- \`app/Exceptions/${pascalCase(feature)}Exception.php\` — Excecoes de dominio\n\n`;
  } else {
    plan += `**Arquivos**:\n`;
    plan += `- \`src/${kebabCase(feature)}/${kebabCase(feature)}.service.ts\` — Logica de negocio\n`;
    plan += `- \`src/${kebabCase(feature)}/exceptions/\` — Excecoes de dominio\n\n`;
  }

  plan += `**TDD** (Red → Green → Refactor):\n`;
  plan += `1. Red: Escrever testes para happy path, edge cases e error cases\n`;
  plan += `2. Green: Implementar o minimo para passar\n`;
  plan += `3. Refactor: Aplicar Clean Code e Object Calisthenics\n\n`;

  plan += `**Testes**:\n`;
  plan += `- Testes unitarios com mocks do Repository\n`;
  plan += `- Cobrir: criacao, leitura, atualizacao, exclusao (se aplicavel)\n\n`;

  // Fase 4: Controller / API
  plan += `### Fase 4: API / Controller\n\n`;
  plan += `**Objetivo**: Expor a feature via API.\n\n`;

  if (technology === "laravel") {
    plan += `**Arquivos**:\n`;
    plan += `- \`app/Http/Controllers/${pascalCase(feature)}Controller.php\` — Controller\n`;
    plan += `- \`app/Http/Requests/Store${pascalCase(feature)}Request.php\` — Validacao de entrada\n`;
    plan += `- \`app/Http/Requests/Update${pascalCase(feature)}Request.php\` — Validacao de atualizacao\n`;
    plan += `- \`app/Http/Resources/${pascalCase(feature)}Resource.php\` — Transformacao de saida\n`;
    plan += `- \`routes/api.php\` — Registrar rotas\n\n`;
  } else {
    plan += `**Arquivos**:\n`;
    plan += `- \`src/${kebabCase(feature)}/${kebabCase(feature)}.controller.ts\` — Controller\n`;
    plan += `- \`src/${kebabCase(feature)}/dto/create-${kebabCase(feature)}.dto.ts\` — Validacao de entrada\n`;
    plan += `- \`src/${kebabCase(feature)}/dto/update-${kebabCase(feature)}.dto.ts\` — Validacao de atualizacao\n`;
    plan += `- \`src/${kebabCase(feature)}/dto/${kebabCase(feature)}-response.dto.ts\` — Transformacao de saida\n\n`;
  }

  plan += `**Testes**:\n`;
  plan += `- Testes de integracao (HTTP) para cada endpoint\n`;
  plan += `- Testar validacao de entrada (dados invalidos)\n`;
  plan += `- Testar autorizacao (se aplicavel)\n\n`;

  // Fase 5: Refinamentos
  plan += `### Fase 5: Refinamentos e Integracao\n\n`;
  plan += `**Objetivo**: Polir a implementacao e integrar com o restante do sistema.\n\n`;
  plan += `**Tarefas**:\n`;
  plan += `- [ ] Adicionar paginacao (se aplicavel)\n`;
  plan += `- [ ] Adicionar filtros e ordenacao\n`;
  plan += `- [ ] Implementar cache (se necessario)\n`;
  plan += `- [ ] Adicionar logs estruturados\n`;
  plan += `- [ ] Revisar indices de banco de dados\n`;
  plan += `- [ ] Documentar API (Swagger/OpenAPI)\n`;

  if (requirements) {
    plan += `\n\n### Requisitos ja informados\n\n`;
    plan += `${requirements}\n`;
  }

  return plan;
}

function formatOutput(
  feature: string,
  technology: Technology,
  requirements: string | undefined,
  questions: string[],
  plan: string
): string {
  const techLabel = technology === "laravel" ? "Laravel" : "NestJS";

  let output = `# Plano de Implementacao\n\n`;
  output += `**Feature**: ${feature}\n`;
  output += `**Stack**: ${techLabel}\n\n`;
  output += `---\n\n`;

  output += `## Perguntas de Alinhamento\n\n`;
  output += `${config.developerName}, antes de comecar, preciso alinhar alguns pontos sobre a regra de negocio:\n\n`;

  questions.forEach((q, i) => {
    output += `${i + 1}. ${q}\n`;
  });

  output += `\n---\n\n`;
  output += plan;
  output += `\n\n---\n\n`;
  output += `## Ordem de Execucao\n\n`;
  output += `\`\`\`\nFase 1 (Entidades) → Fase 2 (Repository) → Fase 3 (Service/TDD) → Fase 4 (API) → Fase 5 (Refinamentos)\n\`\`\`\n\n`;
  output += `Cada fase e independente e cabe no contexto de uma sessao de trabalho. `;
  output += `Comece sempre pelos testes (TDD) em cada fase.\n`;

  return output;
}

function pascalCase(str: string): string {
  return str
    .replace(/[^a-zA-Z0-9]+(.)/g, (_, c) => c.toUpperCase())
    .replace(/^./, (c) => c.toUpperCase())
    .replace(/[^a-zA-Z0-9]/g, "");
}

function camelCase(str: string): string {
  const pascal = pascalCase(str);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

function kebabCase(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function snakeCase(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

export function register(server: McpServer): void {
  server.tool(
    "plan_implementation",
    "Cria plano de implementacao faseado, fazendo perguntas para alinhar regras de negocio",
    {
      feature: z.string().describe("Descricao da feature a implementar"),
      technology: technologyEnum.describe("Stack tecnologica: laravel ou nestjs"),
      requirements: z
        .string()
        .optional()
        .describe("Requisitos ja conhecidos"),
    },
    async ({ feature, technology, requirements }) => {
      const questions = generateAlignmentQuestions(
        feature,
        technology,
        requirements
      );
      const plan = generateImplementationPlan(feature, technology, requirements);
      const text = formatOutput(
        feature,
        technology,
        requirements,
        questions,
        plan
      );

      return {
        content: [{ type: "text", text }],
      };
    }
  );
}
