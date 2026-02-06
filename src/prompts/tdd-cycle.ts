import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { config } from "../config.js";

export function register(server: McpServer): void {
  server.prompt(
    "tdd-cycle",
    "Gera um template completo do ciclo TDD (Red-Green-Refactor) com instrucoes passo a passo e checklists",
    {
      feature: z.string().describe("Descricao da feature a ser implementada com TDD"),
      technology: z.string().describe("Stack tecnologica (ex.: laravel, nestjs, react, vue)"),
    },
    ({ feature, technology }) => {
      let template = `# Ciclo TDD — ${feature}\n\n`;
      template += `**Stack**: ${technology}\n`;
      template += `**Autor**: ${config.developerName}\n\n`;
      template += `---\n\n`;

      // Fase RED
      template += `## 🔴 Fase 1: RED — Escreva testes que falham\n\n`;
      template += `### Objetivo\n`;
      template += `Descrever o comportamento desejado da feature "${feature}" atraves de testes, ANTES de escrever qualquer codigo de producao.\n\n`;
      template += `### Passos\n`;
      template += `1. Crie o arquivo de teste para a feature\n`;
      template += `2. Escreva os cenarios de teste:\n`;
      template += `   - **Happy path**: Fluxo principal com dados validos\n`;
      template += `   - **Edge cases**: Fronteiras e valores extremos\n`;
      template += `   - **Error cases**: Situacoes de falha esperada\n`;
      template += `3. Execute os testes — todos devem **falhar**\n`;
      template += `4. Verifique que falham pelo **motivo certo** (ex.: classe/funcao nao existe, nao por erro de sintaxe)\n\n`;
      template += `### Checklist\n`;
      template += `- [ ] Testes descrevem comportamento, nao implementacao\n`;
      template += `- [ ] Nomes dos testes sao especificacoes claras\n`;
      template += `- [ ] Padrao AAA (Arrange-Act-Assert) em cada teste\n`;
      template += `- [ ] Happy path coberto\n`;
      template += `- [ ] Pelo menos 2 edge cases cobertos\n`;
      template += `- [ ] Pelo menos 1 error case coberto\n`;
      template += `- [ ] Todos os testes falham pelo motivo certo\n\n`;
      template += `> ${config.developerName}, analise os cenarios antes de prosseguir. Os testes sao a especificacao da feature.\n\n`;

      template += `---\n\n`;

      // Fase GREEN
      template += `## 🟢 Fase 2: GREEN — Faca os testes passarem\n\n`;
      template += `### Objetivo\n`;
      template += `Escrever o **minimo de codigo** necessario para fazer os testes passarem. Foco: "Make it work".\n\n`;
      template += `### Passos\n`;
      template += `1. Crie os arquivos de producao necessarios\n`;
      template += `2. Implemente o minimo para o primeiro teste passar\n`;
      template += `3. Execute os testes — o primeiro deve passar\n`;
      template += `4. Repita para cada teste restante\n`;
      template += `5. Se necessario, use **Fake It** (valores hardcoded) para comecar\n\n`;
      template += `### Estrategias\n`;
      template += `- **Fake It**: Retorne valores hardcoded primeiro, depois generalize\n`;
      template += `- **Triangulation**: Use dados diferentes em testes para forcar generalizacao\n`;
      template += `- **Obvious Implementation**: Se a solucao e clara, va direto\n\n`;
      template += `### Checklist\n`;
      template += `- [ ] Todos os testes passam\n`;
      template += `- [ ] Nenhum teste anterior quebrou\n`;
      template += `- [ ] Codigo faz apenas o necessario (nao adicionou extras - YAGNI)\n`;
      template += `- [ ] Nao se preocupou com elegancia ainda\n\n`;
      template += `> ${config.developerName}, resista a tentacao de refatorar agora. Isso e a proxima fase.\n\n`;

      template += `---\n\n`;

      // Fase REFACTOR
      template += `## ♻️ Fase 3: REFACTOR — Melhore o codigo\n\n`;
      template += `### Objetivo\n`;
      template += `Melhorar a qualidade do codigo **sem alterar o comportamento**. Os testes devem continuar verdes apos cada mudanca.\n\n`;
      template += `### Passos\n`;
      template += `1. Revise o codigo de producao\n`;
      template += `2. Aplique principios de Clean Code\n`;
      template += `3. Verifique Object Calisthenics\n`;
      template += `4. Verifique SOLID\n`;
      template += `5. Execute os testes apos CADA mudanca\n`;
      template += `6. Se um teste quebrar, desfaca a ultima alteracao\n\n`;
      template += `### Checklist Clean Code\n`;
      template += `- [ ] Nomes significativos (revelam intencao)\n`;
      template += `- [ ] Funcoes pequenas (< 20 linhas, fazem UMA coisa)\n`;
      template += `- [ ] Sem duplicacao (DRY)\n`;
      template += `- [ ] Sem comentarios desnecessarios\n`;
      template += `- [ ] Tratamento de erros adequado\n\n`;
      template += `### Checklist Object Calisthenics\n`;
      template += `- [ ] Um nivel de indentacao por metodo\n`;
      template += `- [ ] Sem else (early return/guard clauses)\n`;
      template += `- [ ] Primitivos encapsulados (quando aplicavel)\n`;
      template += `- [ ] Um ponto por linha (Lei de Demeter)\n`;
      template += `- [ ] Nomes completos, sem abreviacoes\n`;
      template += `- [ ] Tell, Don't Ask\n\n`;
      template += `### Checklist SOLID\n`;
      template += `- [ ] SRP: Uma responsabilidade por classe/funcao\n`;
      template += `- [ ] OCP: Aberto para extensao, fechado para modificacao\n`;
      template += `- [ ] DIP: Dependencias injetadas via abstracoes\n\n`;

      template += `---\n\n`;

      // Proximo ciclo
      template += `## 🔄 Proximo Ciclo\n\n`;
      template += `Apos completar as 3 fases, o ciclo reinicia:\n\n`;
      template += `1. Identifique o proximo comportamento a implementar\n`;
      template += `2. Volte para a Fase RED\n`;
      template += `3. Repita ate a feature "${feature}" estar completa\n\n`;
      template += `> ${config.developerName}, lembre-se: TDD nao e sobre testes — e sobre design. Os testes guiam o design do codigo.\n`;

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
