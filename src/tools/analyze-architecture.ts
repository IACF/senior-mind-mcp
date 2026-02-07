import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { config } from "../config.js";

const technologyEnum = z.enum(["laravel", "nestjs", "generic"]);
type Technology = z.infer<typeof technologyEnum>;

type ProblemType = "api" | "batch" | "evento" | "crud" | "generico";

interface ArchitectureOption {
  name: string;
  description: string;
  pros: string[];
  cons: string[];
  principles: string[];
  tradeOff?: string;
}

function detectProblemType(
  problem: string,
  context: string | undefined
): ProblemType {
  const combined = `${problem} ${context ?? ""}`.toLowerCase();
  if (
    /api\s+(rest|restful|endpoint)|endpoint|rotas?\s+http|controller\s+(api|http)/i.test(
      combined
    ) ||
    combined.includes("api ") ||
    combined.includes(" api")
  ) {
    return "api";
  }
  if (
    combined.includes("batch") ||
    combined.includes("job") ||
    combined.includes("cron") ||
    combined.includes("processamento em lote") ||
    combined.includes("fila")
  ) {
    return "batch";
  }
  if (
    combined.includes("evento") ||
    combined.includes("event-driven") ||
    combined.includes("mensageria") ||
    combined.includes("publish") ||
    combined.includes("subscribe") ||
    combined.includes("domain events")
  ) {
    return "evento";
  }
  if (
    combined.includes("crud") ||
    combined.includes("abm") ||
    combined.includes("cadastro simples") ||
    /create\s*(read|update|delete)|(read|update|delete)\s*create/i.test(
      combined
    )
  ) {
    return "crud";
  }
  return "generico";
}

function getFolderStructure(
  technology: Technology,
  problemType: ProblemType
): string {
  if (technology === "nestjs") {
    const base = `src/
  modules/
    <dominio>/
      <dominio>.module.ts
      application/
        use-cases/
      domain/
        entities/
      infrastructure/
        controllers/
        persistence/`;
    if (problemType === "api") {
      return `src/
  modules/
    <dominio>/
      <dominio>.module.ts
      application/
      domain/
      infrastructure/
        controllers/
        dto/
        persistence/`;
    }
    if (problemType === "batch") {
      return `src/
  modules/
    <dominio>/
      jobs/
      application/
      domain/
      infrastructure/
        persistence/`;
    }
    if (problemType === "evento") {
      return `src/
  modules/
    <dominio>/
      application/
        handlers/
      domain/
        events/
      infrastructure/
        publishers/
        subscribers/`;
    }
    return base;
  }
  if (technology === "laravel") {
    const base = `app/
  Domain/
    <Dominio>/
      Entities/
  Application/
    UseCases/
  Infrastructure/
    Http/
      Controllers/
    Persistence/`;
    if (problemType === "api") {
      return `app/
  Http/
    Controllers/
      Api/
  Services/
  Repositories/
  Resources/  (API Resources)
routes/
  api.php`;
    }
    if (problemType === "batch") {
      return `app/
  Jobs/
  Console/
    Commands/
  Services/`;
    }
    if (problemType === "evento") {
      return `app/
  Events/
  Listeners/
  Domain/
    Events/`;
    }
    return base;
  }
  return `src/
  domain/
  application/
  infrastructure/`;
}

function buildOptions(
  problem: string,
  technology: Technology
): ArchitectureOption[] {
  const baseOptions: ArchitectureOption[] = [
    {
      name: "Clean Architecture com Use Cases",
      description:
        "Organizar em camadas (Entities, Use Cases, Interface Adapters, Frameworks) com inversao de dependencia rigorosa. Cada caso de uso e uma classe/funcao independente.",
      pros: [
        "Testabilidade excelente — Use Cases testados sem framework",
        "Independencia de framework — trocar infraestrutura nao afeta logica",
        "Separacao clara de responsabilidades",
        "Facilita trabalho em equipe — cada camada pode ser desenvolvida independentemente",
      ],
      cons: [
        "Mais boilerplate inicial (interfaces, mappers, DTOs)",
        "Curva de aprendizado para equipes nao familiarizadas",
        "Pode ser over-engineering para CRUDs simples",
      ],
      principles: [
        "Clean Architecture (4 camadas)",
        "DIP — Dependency Inversion Principle",
        "SRP — Single Responsibility Principle",
        "OCP — Open/Closed Principle",
      ],
      tradeOff: "Complexidade media-alta; beneficio alto em testabilidade e evolucao. Ideal quando o dominio vai crescer.",
    },
    {
      name: "Service Layer Pattern",
      description:
        "Usar uma camada de Services entre Controllers e Models/Repositories. Services contem a logica de negocio, Controllers lidam com HTTP, Repositories lidam com dados.",
      pros: [
        "Mais simples que Clean Architecture completa",
        "Boa separacao de responsabilidades sem excesso de camadas",
        "Facil de entender e adotar pela equipe",
        "Testavel — Services podem ser testados com mocks de repositories",
      ],
      cons: [
        "Menos rigido — pode degenerar com o tempo se nao houver disciplina",
        "Services podem crescer e violar SRP",
        "Sem boundary explicito entre dominio e infraestrutura",
      ],
      principles: [
        "SRP — Single Responsibility Principle",
        "Separacao de concerns (Controller → Service → Repository)",
        "DIP parcial — Services dependem de interfaces de Repository",
      ],
      tradeOff: "Complexidade baixa; beneficio rapido. Trade-off: menos rigidez, maior risco de degradacao se a equipe nao mantiver disciplina.",
    },
    {
      name: "Domain-Driven Design (DDD) Tatico",
      description:
        "Modelar o dominio com Aggregates, Entities, Value Objects e Domain Events. Repositorios operam sobre Aggregates. Application Services orquestram o fluxo.",
      pros: [
        "Modelo de dominio rico e expressivo",
        "Excelente para dominios complexos com muitas regras de negocio",
        "Domain Events facilitam desacoplamento e extensibilidade",
        "Ubiquitous Language alinha equipe tecnica e dominio",
      ],
      cons: [
        "Complexidade significativa — nao indicado para dominios simples",
        "Requer conhecimento solido de DDD na equipe",
        "Mais codigo para dominios com pouca logica de negocio",
      ],
      principles: [
        "Clean Architecture (Entities como nucleo)",
        "ISP — Interface Segregation Principle",
        "Tell, Don't Ask (Object Calisthenics regra 9)",
        "Encapsular tipos primitivos (Object Calisthenics regra 3)",
      ],
      tradeOff: "Complexidade alta; beneficio maximo em dominios ricos. Trade-off: investimento inicial maior, retorno em manutencao e extensibilidade.",
    },
  ];

  if (technology === "laravel") {
    baseOptions[1].description +=
      " No Laravel: Controllers delegam para Services, Services usam Repositories ou Eloquent diretamente.";
    baseOptions[1].pros.push(
      "Alinhado com o ecossistema Laravel (FormRequests, Resources, Eloquent)"
    );
  } else if (technology === "nestjs") {
    baseOptions[1].description +=
      " No NestJS: Controllers delegam para Services injetados via DI, Services usam Repositories.";
    baseOptions[1].pros.push(
      "Alinhado com a DI nativa do NestJS (Modules, Providers)"
    );
  }

  return baseOptions;
}

function selectRecommendation(
  options: ArchitectureOption[],
  problem: string,
  context: string | undefined
): number {
  const combined = `${problem} ${context ?? ""}`.toLowerCase();

  const isComplex =
    combined.includes("complexo") ||
    combined.includes("dominio") ||
    combined.includes("regras de negocio") ||
    combined.includes("event") ||
    combined.includes("aggregate") ||
    combined.includes("ddd");

  const isSimple =
    combined.includes("crud") ||
    combined.includes("simples") ||
    combined.includes("basico") ||
    combined.includes("mvp") ||
    combined.includes("prototipo");

  if (isComplex) return 2; // DDD
  if (isSimple) return 1; // Service Layer
  return 0; // Clean Architecture (default balanceado)
}

function formatOutput(
  problem: string,
  technology: Technology,
  context: string | undefined,
  options: ArchitectureOption[],
  recommendedIndex: number,
  problemType: ProblemType,
  folderStructure: string
): string {
  const techLabel =
    technology === "laravel"
      ? "Laravel"
      : technology === "nestjs"
        ? "NestJS"
        : "Generico";

  const problemTypeLabel =
    problemType === "api"
      ? "API (REST/HTTP)"
      : problemType === "batch"
        ? "Batch / Job / Fila"
        : problemType === "evento"
          ? "Evento / Mensageria"
          : problemType === "crud"
            ? "CRUD / Cadastro"
            : "Generico";

  let output = `# Analise de Arquitetura\n\n`;
  output += `**Problema**: ${problem}\n`;
  output += `**Stack**: ${techLabel}\n`;
  output += `**Tipo de problema identificado**: ${problemTypeLabel}\n`;
  if (context) {
    output += `**Contexto**: ${context}\n`;
  }
  output += `\n---\n\n`;

  options.forEach((opt, i) => {
    output += `## Opcao ${i + 1}: ${opt.name}\n\n`;
    output += `${opt.description}\n\n`;

    output += `### Pros\n`;
    opt.pros.forEach((p) => (output += `- ✅ ${p}\n`));
    output += `\n`;

    output += `### Contras\n`;
    opt.cons.forEach((c) => (output += `- ⚠️ ${c}\n`));
    output += `\n`;

    output += `### Principios aplicados\n`;
    opt.principles.forEach((p) => (output += `- 📐 ${p}\n`));
    if (opt.tradeOff) {
      output += `\n### Trade-off (complexidade vs beneficio)\n`;
      output += `${opt.tradeOff}\n`;
    }
    output += `\n---\n\n`;
  });

  output += `## Estrutura de pastas sugerida\n\n`;
  output += `Para **${techLabel}** e um problema do tipo **${problemTypeLabel}**, considere organizar assim:\n\n`;
  output += `\`\`\`\n${folderStructure}\n\`\`\`\n\n`;

  const rec = options[recommendedIndex];
  output += `## Recomendacao\n\n`;
  output += `${config.developerName}, para este cenario recomendo a **${rec.name}**.\n\n`;
  output += `**Justificativa**: `;

  if (recommendedIndex === 0) {
    output += `A Clean Architecture com Use Cases oferece o melhor equilibrio entre testabilidade, separacao de responsabilidades e independencia de framework. `;
    if (problemType === "api") {
      output += `Para uma API, as camadas de Controller (Adapter) e Use Case ficam bem definidas, facilitando testes e evolucao dos endpoints. `;
    } else if (problemType === "batch") {
      output += `Para batch/jobs, Use Cases isolados permitem testar a logica sem rodar o scheduler. `;
    }
    output += `E a escolha ideal quando o dominio tem complexidade moderada e voce quer garantir que a arquitetura escale com o tempo.\n`;
  } else if (recommendedIndex === 1) {
    output += `O Service Layer Pattern e pragmatico e eficaz para este cenario. `;
    if (problemType === "crud") {
      output += `Para um CRUD ou cadastro simples, evita over-engineering mantendo controllers finos e services testaveis. `;
    }
    output += `Oferece boa separacao de responsabilidades sem o overhead de camadas adicionais, sendo ideal para projetos que precisam de velocidade de entrega sem sacrificar qualidade.\n`;
  } else {
    output += `O DDD Tatico e a melhor escolha quando o dominio e complexo e cheio de regras de negocio. `;
    if (problemType === "evento") {
      output += `Para sistemas orientados a eventos, Aggregates e Domain Events modelam bem o fluxo. `;
    }
    output += `O investimento inicial em modelagem se paga rapidamente em expressividade e manutencibilidade a longo prazo.\n`;
  }

  output += `\n**Proximos passos sugeridos**:\n`;
  output += `1. Definir as entidades e regras de negocio centrais\n`;
  output += `2. Mapear os casos de uso principais\n`;
  output += `3. Definir os contratos (interfaces) entre camadas\n`;
  output += `4. Iniciar com TDD — escrever testes para o primeiro caso de uso\n`;

  return output;
}

export function register(server: McpServer): void {
  server.tool(
    "analyze_architecture",
    "Analisa um problema/feature e propoe opcoes de arquitetura fundamentadas em Clean Architecture e boas praticas",
    {
      problem: z
        .string()
        .describe("Descricao do problema ou feature a ser analisada"),
      technology: technologyEnum.describe("Stack tecnologica do projeto"),
      context: z
        .string()
        .optional()
        .describe(
          "Contexto adicional: restricoes, requisitos nao-funcionais, tamanho da equipe, etc."
        ),
    },
    async ({ problem, technology, context }) => {
      const options = buildOptions(problem, technology);
      const recommendedIndex = selectRecommendation(options, problem, context);
      const problemType = detectProblemType(problem, context);
      const folderStructure = getFolderStructure(technology, problemType);
      const text = formatOutput(
        problem,
        technology,
        context,
        options,
        recommendedIndex,
        problemType,
        folderStructure
      );

      return {
        content: [{ type: "text", text }],
      };
    }
  );
}
