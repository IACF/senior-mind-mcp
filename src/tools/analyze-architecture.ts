import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { config } from "../config.js";

const technologyEnum = z.enum(["laravel", "nestjs", "generic"]);
type Technology = z.infer<typeof technologyEnum>;

interface ArchitectureOption {
  name: string;
  description: string;
  pros: string[];
  cons: string[];
  principles: string[];
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
  recommendedIndex: number
): string {
  const techLabel =
    technology === "laravel"
      ? "Laravel"
      : technology === "nestjs"
        ? "NestJS"
        : "Generico";

  let output = `# Analise de Arquitetura\n\n`;
  output += `**Problema**: ${problem}\n`;
  output += `**Stack**: ${techLabel}\n`;
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
    output += `\n---\n\n`;
  });

  const rec = options[recommendedIndex];
  output += `## Recomendacao\n\n`;
  output += `${config.developerName}, para este cenario recomendo a **${rec.name}**.\n\n`;
  output += `**Justificativa**: `;

  if (recommendedIndex === 0) {
    output += `A Clean Architecture com Use Cases oferece o melhor equilibrio entre testabilidade, separacao de responsabilidades e independencia de framework. E a escolha ideal quando o dominio tem complexidade moderada e voce quer garantir que a arquitetura escale com o tempo.\n`;
  } else if (recommendedIndex === 1) {
    output += `O Service Layer Pattern e pragmatico e eficaz para este cenario. Oferece boa separacao de responsabilidades sem o overhead de camadas adicionais, sendo ideal para projetos que precisam de velocidade de entrega sem sacrificar qualidade.\n`;
  } else {
    output += `O DDD Tatico e a melhor escolha quando o dominio e complexo e cheio de regras de negocio. O investimento inicial em modelagem se paga rapidamente em expressividade e manutencibilidade a longo prazo.\n`;
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
      const text = formatOutput(
        problem,
        technology,
        context,
        options,
        recommendedIndex
      );

      return {
        content: [{ type: "text", text }],
      };
    }
  );
}
