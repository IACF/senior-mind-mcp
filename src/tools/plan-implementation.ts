import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { config } from "../config.js";

const technologyEnum = z.enum(["laravel", "nestjs"]);
type Technology = z.infer<typeof technologyEnum>;

type AgentLevel = "rapido" | "avancado" | "misto";

interface AgentRecommendation {
  level: AgentLevel;
  justification: string;
  usageTip: string;
}

const PHASE_AGENT_RECOMMENDATIONS: Record<number, Omit<AgentRecommendation, "usageTip"> & { usageTip: (tech: Technology) => string }> = {
  1: {
    level: "avancado",
    justification: "Requer decisoes de dominio, definir atributos e relacionamentos.",
    usageTip: (tech) =>
      tech === "laravel"
        ? "Peça para definir o Model, a migration e os relacionamentos com base nas regras de negocio."
        : "Peça para definir a entidade, o module e os DTOs com base nas regras de negocio.",
  },
  2: {
    level: "rapido",
    justification: "Boilerplate previsivel: interface + implementacao padrao.",
    usageTip: (tech) =>
      tech === "laravel"
        ? "Peça para gerar o Repository (interface + Eloquent) com base no modelo definido."
        : "Peça para gerar o Repository (interface + implementacao) com base na entidade definida.",
  },
  3: {
    level: "avancado",
    justification: "Logica de negocio, cenarios de teste e decisoes de design.",
    usageTip: () =>
      "Peça para escrever os testes primeiro (TDD) e depois implementar o Service/Use Case.",
  },
  4: {
    level: "rapido",
    justification: "Controller fino, DTOs e rotas — padrao mecanico.",
    usageTip: (tech) =>
      tech === "laravel"
        ? "Peça para criar o Controller, FormRequests e registrar rotas em api.php."
        : "Peça para criar o Controller, DTOs e registrar rotas no module.",
  },
  5: {
    level: "misto",
    justification: "Paginacao/filtros (rapido); cache e performance (avancado).",
    usageTip: () =>
      "Para paginacao e filtros use modelo rapido; para cache/otimizacao use modelo avancado.",
  },
};

function getAgentRecommendation(
  phaseNumber: number,
  technology: Technology,
  teamContext?: string
): AgentRecommendation {
  const base = PHASE_AGENT_RECOMMENDATIONS[phaseNumber];
  if (!base) {
    return {
      level: "avancado",
      justification: "Fase nao mapeada; use modelo avancado por seguranca.",
      usageTip: "Peça para implementar a fase com cuidado aos requisitos.",
    };
  }
  const usageTip = typeof base.usageTip === "function" ? base.usageTip(technology) : base.usageTip;
  let level = base.level;
  const isJunior =
    teamContext &&
    /junior|iniciante|iniciantes|júnior|juniors|equipe pequena|pouca experiencia/i.test(
      teamContext
    );
  if (isJunior && (level === "rapido" || level === "misto")) {
    level = level === "misto" ? "avancado" : "avancado";
  }
  return {
    level: level as AgentLevel,
    justification: base.justification,
    usageTip,
  };
}

function formatAgentSection(
  phaseNumber: number,
  technology: Technology,
  teamContext?: string
): string {
  const rec = getAgentRecommendation(phaseNumber, technology, teamContext);
  let out = `**Agente de IA recomendado**\n`;
  out += `- **Nivel do modelo**: ${rec.level}\n`;
  out += `- **Justificativa**: ${rec.justification}\n`;
  out += `- **Dica de uso**: ${rec.usageTip}\n\n`;
  return out;
}

function generateAgentSummaryTable(
  technology: Technology,
  teamContext?: string
): string {
  const rows: string[] = [];
  for (let p = 1; p <= 5; p++) {
    const rec = getAgentRecommendation(p, technology, teamContext);
    const phaseNames = [
      "1. Entidades",
      "2. Repository",
      "3. Service/TDD",
      "4. API",
      "5. Refinamentos",
    ];
    rows.push(`| ${phaseNames[p - 1]} | ${rec.level} | ${rec.justification} |`);
  }
  return (
    `## Recomendacao de Agente por Fase\n\n` +
    `| Fase | Agente Recomendado | Justificativa |\n` +
    `|---|---|---|\n` +
    rows.join("\n") +
    `\n\n`
  );
}

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

  questions.push(
    `Qual IDE/agente de IA voce esta usando? (Cursor, Claude Desktop, Copilot, outro) — para adaptar as dicas de uso por fase.`
  );

  return questions;
}

function generateImplementationPlan(
  feature: string,
  technology: Technology,
  requirements?: string,
  teamContext?: string
): string {
  const techLabel = technology === "laravel" ? "Laravel" : "NestJS";

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
  plan += formatAgentSection(1, technology, teamContext);

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
  plan += formatAgentSection(2, technology, teamContext);

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
  plan += formatAgentSection(3, technology, teamContext);

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
  plan += formatAgentSection(4, technology, teamContext);

  // Fase 5: Refinamentos
  plan += `### Fase 5: Refinamentos e Integracao\n\n`;
  plan += `**Objetivo**: Polir a implementacao e integrar com o restante do sistema.\n\n`;
  plan += `**Tarefas**:\n`;
  plan += `- [ ] Adicionar paginacao (se aplicavel)\n`;
  plan += `- [ ] Adicionar filtros e ordenacao\n`;
  plan += `- [ ] Implementar cache (se necessario)\n`;
  plan += `- [ ] Adicionar logs estruturados\n`;
  plan += `- [ ] Revisar indices de banco de dados\n`;
  plan += `- [ ] Documentar API (Swagger/OpenAPI)\n\n`;
  plan += formatAgentSection(5, technology, teamContext);

  plan += generateAgentSummaryTable(technology, teamContext);

  if (requirements) {
    plan += `### Requisitos ja informados\n\n`;
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
      team_context: z
        .string()
        .optional()
        .describe(
          "Contexto da equipe: nivel de experiencia, ferramentas de IA disponiveis (ex.: equipe junior pode precisar de modelo avancado em mais fases)"
        ),
    },
    async ({ feature, technology, requirements, team_context }) => {
      const questions = generateAlignmentQuestions(
        feature,
        technology,
        requirements
      );
      const plan = generateImplementationPlan(
        feature,
        technology,
        requirements,
        team_context
      );
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
