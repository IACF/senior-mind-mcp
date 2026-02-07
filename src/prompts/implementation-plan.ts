import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { config } from "../config.js";

export function register(server: McpServer): void {
  server.prompt(
    "implementation-plan",
    "Gera questionario de alinhamento e plano de implementacao faseado com checklist para uma feature",
    {
      feature: z.string().describe("Descricao da feature a ser implementada"),
      context: z
        .string()
        .optional()
        .describe("Contexto adicional: stack, restricoes, requisitos conhecidos"),
      team_context: z
        .string()
        .optional()
        .describe(
          "Contexto da equipe: nivel de experiencia, ferramentas de IA disponiveis"
        ),
    },
    ({ feature, context, team_context }) => {
      let template = `# Plano de Implementacao — ${feature}\n\n`;
      template += `**Autor**: ${config.developerName}\n`;
      if (context) {
        template += `**Contexto**: ${context}\n`;
      }
      if (team_context) {
        template += `**Contexto da equipe**: ${team_context}\n`;
      }
      template += `\n---\n\n`;

      // Questionario
      template += `## Questionario de Alinhamento\n\n`;
      template += `${config.developerName}, responda as perguntas abaixo para alinhar a implementacao:\n\n`;
      template += `1. **Usuarios**: Quem sao os atores que interagem com "${feature}"?\n`;
      template += `2. **Regras de negocio**: Quais validacoes e regras sao obrigatorias?\n`;
      template += `3. **Fluxo principal**: Qual o passo a passo do happy path?\n`;
      template += `4. **Erros esperados**: Quais situacoes de erro devem ser tratadas?\n`;
      template += `5. **Integracoes**: Ha dependencias com outros sistemas ou APIs?\n`;
      template += `6. **Dados**: Quais entidades/tabelas estao envolvidas?\n`;
      template += `7. **Seguranca**: Ha requisitos de autorizacao ou LGPD?\n`;
      template += `8. **Performance**: Qual o volume esperado de dados/operacoes?\n`;
      template += `9. **IDE/Agente de IA**: Qual IDE ou agente de IA voce esta usando? (Cursor, Claude Desktop, Copilot, outro) — para adaptar as dicas de uso por fase.\n\n`;

      template += `---\n\n`;

      // Plano faseado
      template += `## Plano Faseado\n\n`;
      template += `Cada fase e independente e pode ser implementada em uma sessao de trabalho.\n\n`;

      template += `### Fase 1: Modelagem de Dados — *Agente: Avancado*\n`;
      template += `- [ ] Definir entidades e seus atributos\n`;
      template += `- [ ] Criar migrations/schemas\n`;
      template += `- [ ] Definir relacionamentos entre entidades\n`;
      template += `- [ ] Criar factories/fixtures para testes\n`;
      template += `- [ ] Validar modelo com testes unitarios\n\n`;

      template += `### Fase 2: Camada de Acesso a Dados — *Agente: Rapido*\n`;
      template += `- [ ] Definir interface do Repository\n`;
      template += `- [ ] Implementar Repository\n`;
      template += `- [ ] Escrever testes de integracao (repository + DB)\n`;
      template += `- [ ] Garantir queries otimizadas (indices, eager loading)\n\n`;

      template += `### Fase 3: Logica de Negocio (TDD) — *Agente: Avancado*\n`;
      template += `- [ ] RED: Escrever testes para o Service (happy path)\n`;
      template += `- [ ] RED: Escrever testes para edge cases e erros\n`;
      template += `- [ ] GREEN: Implementar Service com minimo para passar\n`;
      template += `- [ ] REFACTOR: Aplicar Clean Code e Object Calisthenics\n`;
      template += `- [ ] Criar excecoes de dominio especificas\n\n`;

      template += `### Fase 4: API / Interface — *Agente: Rapido*\n`;
      template += `- [ ] Criar DTOs/FormRequests de entrada (validacao)\n`;
      template += `- [ ] Criar DTOs/Resources de saida (transformacao)\n`;
      template += `- [ ] Implementar Controller (fino, delega para Service)\n`;
      template += `- [ ] Registrar rotas\n`;
      template += `- [ ] Escrever testes de integracao HTTP\n\n`;

      template += `### Fase 5: Refinamentos — *Agente: Misto (Rapido para paginacao/filtros; Avancado para cache/performance)*\n`;
      template += `- [ ] Adicionar paginacao e filtros\n`;
      template += `- [ ] Implementar autorizacao (policies/guards)\n`;
      template += `- [ ] Adicionar logs estruturados\n`;
      template += `- [ ] Revisar indices de banco\n`;
      template += `- [ ] Documentar endpoints (Swagger/OpenAPI)\n`;
      template += `- [ ] Revisar cobertura de testes\n\n`;

      template += `---\n\n`;
      template += `## Recomendacao de Agente por Fase\n\n`;
      template += `| Fase | Agente Recomendado | Justificativa |\n`;
      template += `|---|---|---|\n`;
      template += `| 1. Entidades | Avancado | Decisoes de dominio e modelagem |\n`;
      template += `| 2. Repository | Rapido | Boilerplate padrao |\n`;
      template += `| 3. Service/TDD | Avancado | Logica de negocio e testes |\n`;
      template += `| 4. API | Rapido | Controller fino, padrao mecanico |\n`;
      template += `| 5. Refinamentos | Misto | Depende da tarefa especifica |\n\n`;

      template += `---\n\n`;
      template += `## Ordem de Execucao\n\n`;
      template += `\`\`\`\nFase 1 → Fase 2 → Fase 3 (TDD) → Fase 4 → Fase 5\n\`\`\`\n\n`;
      template += `> ${config.developerName}, ajuste as fases conforme as respostas do questionario. Cada fase deve ser pequena o suficiente para ser completada de forma independente. Use a tabela acima para escolher o modelo de IA (rapido ou avancado) em cada fase.\n`;

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
