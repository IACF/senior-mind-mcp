import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { config } from "../config.js";

const technologyEnum = z.enum(["laravel", "nestjs", "generic"]);
const complexityEnum = z.enum(["low", "medium", "high"]);

export function register(server: McpServer): void {
  server.prompt(
    "mentor-mode",
    "Instrui o agente a NAO escrever codigo final ate completar checkpoints de Clean Architecture, Clean Code e TDD",
    {
      feature: z.string().describe("Descricao da feature"),
      technology: technologyEnum.describe("Stack tecnologica"),
      complexity: complexityEnum
        .optional()
        .default("medium")
        .describe("Complexidade: low (checkpoints simplificados), medium (completos), high (+ trade-offs e ADR)"),
    },
    ({ feature, technology, complexity = "medium" }) => {
      let template = `# Modo Mentor — ${feature}\n\n`;
      template += `**Stack**: ${technology}\n`;
      template += `**Complexidade**: ${complexity}\n`;
      template += `**Autor**: ${config.developerName}\n\n`;
      template += `> NAO escreva codigo final ate que os checkpoints abaixo sejam completados e aprovados. Cada checkpoint e um gate de qualidade.\n\n`;
      template += `---\n\n`;

      const isLow = complexity === "low";
      const isHigh = complexity === "high";

      // Checkpoint 1 - Analise Arquitetural
      template += `## Checkpoint 1 — Analise Arquitetural (Clean Architecture)\n\n`;
      template += `- [ ] Identificar camadas envolvidas (Entity, Use Case, Adapter, Framework)\n`;
      template += `- [ ] Listar Entities e regras de negocio\n`;
      template += `- [ ] Definir Use Cases necessarios\n`;
      template += `- [ ] Mapear Interface Adapters e dependencias externas\n`;
      if (!isLow) {
        template += `- [ ] Apresentar diagrama de camadas\n`;
      }
      template += `- [ ] Justificar escolhas citando Regra de Dependencia e DIP\n\n`;
      if (isHigh) {
        template += `**Trade-offs**: Documente alternativas descartadas e motivo.\n\n`;
      }
      template += `---\n\n`;

      // Checkpoint 2 - Revisao Clean Code
      template += `## Checkpoint 2 — Revisao Clean Code\n\n`;
      template += `- [ ] Definir convencoes de nomes (classes, metodos, variaveis)\n`;
      template += `- [ ] Planejar tamanho das funcoes (cada uma faz UMA coisa)\n`;
      template += `- [ ] Definir estrategia de tratamento de erros (excecoes de dominio, sem null)\n`;
      template += `- [ ] Identificar onde aplicar DRY, KISS, YAGNI\n`;
      template += `- [ ] Listar potenciais code smells a evitar\n\n`;
      template += `---\n\n`;

      // Checkpoint 3 - Contratos e Interfaces (SOLID)
      template += `## Checkpoint 3 — Contratos e Interfaces (SOLID)\n\n`;
      template += `- [ ] Definir interfaces/ports que os Use Cases precisam\n`;
      template += `- [ ] Definir DTOs de entrada e saida\n`;
      template += `- [ ] Verificar SRP de cada classe planejada\n`;
      template += `- [ ] Verificar OCP (extensivel sem modificar)\n`;
      template += `- [ ] Justificar decisoes citando principios SOLID\n\n`;
      template += `---\n\n`;

      // Checkpoint 4 - Estrategia de Testes (TDD)
      template += `## Checkpoint 4 — Estrategia de Testes (TDD)\n\n`;
      template += `- [ ] Listar cenarios de teste por Use Case (happy path, edge cases, erros)\n`;
      if (!isLow) {
        template += `- [ ] Detalhar cenarios criticos e borda\n`;
      }
      template += `- [ ] Definir test doubles necessarios (mocks, stubs, fakes)\n`;
      template += `- [ ] Propor ordem de implementacao (Entity -> Use Case -> Adapter)\n`;
      template += `- [ ] Definir estrategia por cenario: Fake It, Triangulation ou Obvious Implementation\n`;
      template += `- [ ] Planejar ciclo Red-Green-Refactor\n\n`;
      template += `---\n\n`;

      // Checkpoint 5 - Implementacao Guiada
      template += `## Checkpoint 5 — Implementacao Guiada\n\n`;
      template += `**Somente apos aprovacao dos 4 checkpoints anteriores.**\n\n`;
      template += `- [ ] TDD rigoroso: explicar CADA decisao de design\n`;
      template += `- [ ] Object Calisthenics durante o Refactor\n`;
      template += `- [ ] Nao pular para codigo final antes dos gates\n\n`;

      if (isHigh) {
        template += `---\n\n`;
        template += `## ADR (Architecture Decision Record)\n\n`;
        template += `Para complexidade alta, registre as decisoes arquiteturais:\n\n`;
        template += `- **Contexto**: O que motivou a decisao?\n`;
        template += `- **Decisao**: O que foi escolhido?\n`;
        template += `- **Consequencias**: Impactos e trade-offs aceitos\n\n`;
      }

      template += `---\n\n`;
      template += `> ${config.developerName}, complete cada checkpoint em ordem. So avance para codigo apos validacao do Checkpoint 5.\n`;

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
