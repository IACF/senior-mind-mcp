import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { config } from "../config.js";

export function register(server: McpServer): void {
  server.prompt(
    "architecture-decision",
    "Gera um template ADR (Architecture Decision Record) formal para documentar decisoes de arquitetura",
    {
      problem: z.string().describe("Descricao do problema ou decisao de arquitetura"),
      constraints: z
        .string()
        .optional()
        .describe("Restricoes conhecidas (performance, prazo, equipe, etc.)"),
    },
    ({ problem, constraints }) => {
      let template = `# ADR: ${problem}\n\n`;
      template += `**Data**: ${new Date().toISOString().split("T")[0]}\n`;
      template += `**Autor**: ${config.developerName}\n`;
      template += `**Status**: Proposta\n\n`;
      template += `---\n\n`;

      template += `## Contexto\n\n`;
      template += `${config.developerName}, descreva o contexto que motivou esta decisao:\n\n`;
      template += `- **Problema**: ${problem}\n`;
      if (constraints) {
        template += `- **Restricoes**: ${constraints}\n`;
      }
      template += `- **Stakeholders impactados**: [liste os stakeholders]\n`;
      template += `- **Drivers de decisao**: [liste os fatores que influenciam a escolha]\n\n`;

      template += `## Decisao\n\n`;
      template += `Decidimos [descreva a decisao tomada].\n\n`;
      template += `**Justificativa**:\n`;
      template += `1. [Razao principal]\n`;
      template += `2. [Razao secundaria]\n`;
      template += `3. [Alinhamento com principios — Clean Architecture, SOLID, etc.]\n\n`;

      template += `## Consequencias\n\n`;
      template += `### Positivas\n`;
      template += `- [Beneficio 1 — ex.: melhor testabilidade]\n`;
      template += `- [Beneficio 2 — ex.: independencia de framework]\n`;
      template += `- [Beneficio 3 — ex.: facilidade de manutencao]\n\n`;
      template += `### Negativas\n`;
      template += `- [Trade-off 1 — ex.: mais boilerplate inicial]\n`;
      template += `- [Trade-off 2 — ex.: curva de aprendizado]\n\n`;
      template += `### Riscos\n`;
      template += `- [Risco 1 — ex.: complexidade acidental se mal aplicado]\n`;
      template += `- [Mitigacao sugerida]\n\n`;

      template += `## Alternativas Consideradas\n\n`;
      template += `### Alternativa 1: [Nome]\n`;
      template += `- **Descricao**: [Breve descricao]\n`;
      template += `- **Pros**: [Vantagens]\n`;
      template += `- **Contras**: [Desvantagens]\n`;
      template += `- **Motivo da rejeicao**: [Por que nao foi escolhida]\n\n`;
      template += `### Alternativa 2: [Nome]\n`;
      template += `- **Descricao**: [Breve descricao]\n`;
      template += `- **Pros**: [Vantagens]\n`;
      template += `- **Contras**: [Desvantagens]\n`;
      template += `- **Motivo da rejeicao**: [Por que nao foi escolhida]\n\n`;

      template += `## Referencias\n\n`;
      template += `- Clean Architecture — Robert C. Martin\n`;
      template += `- SOLID Principles\n`;
      template += `- [Adicione referencias relevantes]\n\n`;

      template += `---\n\n`;
      template += `> ${config.developerName}, preencha as secoes entre colchetes com os detalhes especificos da sua decisao. Este ADR serve como documentacao viva para a equipe.\n`;

      return {
        messages: [
          {
            role: "user" as const,
            content: {
              type: "text" as const,
              text: template,
            },
          },
        ],
      };
    }
  );
}
