import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { config } from "../config.js";

export function register(server: McpServer): void {
  server.prompt(
    "code-review-backend",
    "Gera um template de code review para backend focado em Clean Code, convencoes do framework, SOLID e performance SQL",
    {
      code: z.string().describe("Codigo backend a ser revisado"),
      framework: z.enum(["laravel", "nestjs"]).describe("Framework backend"),
    },
    ({ code, framework }) => {
      const frameworkLabel = framework === "laravel" ? "Laravel" : "NestJS";

      let template = `# Code Review — Backend (${frameworkLabel})\n\n`;
      template += `**Revisor**: ${config.developerName}\n`;
      template += `**Framework**: ${frameworkLabel}\n\n`;
      template += `---\n\n`;

      template += `## Codigo a revisar\n\n`;
      template += `\`\`\`${framework === "laravel" ? "php" : "typescript"}\n${code}\n\`\`\`\n\n`;
      template += `---\n\n`;

      template += `## 1. Clean Code\n\n`;
      template += `Revise o codigo acima contra os principios de Clean Code:\n\n`;
      template += `- [ ] **Nomes significativos**: Variaveis, funcoes e classes revelam intencao?\n`;
      template += `- [ ] **Funcoes pequenas**: Cada funcao faz UMA coisa? Menos de 20 linhas?\n`;
      template += `- [ ] **DRY**: Ha duplicacao de logica?\n`;
      template += `- [ ] **Sem comentarios desnecessarios**: O codigo e autodocumentado?\n`;
      template += `- [ ] **Tratamento de erros**: Excecoes especificas? Sem retorno de null?\n`;
      template += `- [ ] **Sem magic numbers/strings**: Constantes nomeadas?\n\n`;

      template += `## 2. Convencoes ${frameworkLabel}\n\n`;

      if (framework === "laravel") {
        template += `- [ ] **Nomenclatura**: Model (singular), Controller (plural), Migration (snake_case)?\n`;
        template += `- [ ] **FormRequest**: Validacao esta no FormRequest (nao no Controller)?\n`;
        template += `- [ ] **API Resource**: Retorno usa Resource/Collection (nao Model direto)?\n`;
        template += `- [ ] **Eloquent**: Usa scopes para queries reutilizaveis? Relationships tipadas?\n`;
        template += `- [ ] **Controller fino**: Logica de negocio esta no Service (nao no Controller)?\n`;
        template += `- [ ] **Mass Assignment**: Model tem $fillable ou $guarded definido?\n`;
        template += `- [ ] **Eager Loading**: Usa with() para evitar N+1?\n\n`;
      } else {
        template += `- [ ] **Module**: Feature encapsulada em seu proprio Module?\n`;
        template += `- [ ] **DTOs**: Entrada validada com class-validator? Saida com Response DTO?\n`;
        template += `- [ ] **Controller fino**: Logica de negocio esta no Service?\n`;
        template += `- [ ] **DI**: Dependencias injetadas via construtor? Interfaces usadas?\n`;
        template += `- [ ] **Pipes**: ValidationPipe global configurado (whitelist, transform)?\n`;
        template += `- [ ] **Guards**: Autorizacao via Guards (nao logica no Controller)?\n`;
        template += `- [ ] **Exception Filters**: Erros tratados de forma centralizada?\n\n`;
      }

      template += `## 3. SOLID\n\n`;
      template += `- [ ] **SRP**: Cada classe tem uma unica responsabilidade?\n`;
      template += `- [ ] **OCP**: O codigo permite extensao sem modificacao?\n`;
      template += `- [ ] **LSP**: Subtipos podem substituir tipos base?\n`;
      template += `- [ ] **ISP**: Interfaces sao pequenas e especificas?\n`;
      template += `- [ ] **DIP**: Depende de abstracoes (interfaces), nao de implementacoes?\n\n`;

      template += `## 4. Performance SQL\n\n`;
      template += `- [ ] **N+1**: Queries em loop? Falta eager loading?\n`;
      template += `- [ ] **Indices**: Colunas em WHERE/JOIN/ORDER BY tem indice?\n`;
      template += `- [ ] **SELECT ***: Seleciona apenas colunas necessarias?\n`;
      template += `- [ ] **Paginacao**: Queries grandes usam paginacao?\n`;
      template += `- [ ] **Queries complexas**: Seria melhor SQL puro ou query builder?\n\n`;

      template += `## 5. Seguranca\n\n`;
      template += `- [ ] **SQL Injection**: Usa parametros bind (nao concatenacao)?\n`;
      template += `- [ ] **Autorizacao**: Verifica permissoes antes de acao?\n`;
      template += `- [ ] **Dados sensiveis**: Nao expoe senhas, tokens ou dados pessoais?\n\n`;

      template += `---\n\n`;
      template += `## Resumo\n\n`;
      template += `| Categoria | Status | Observacoes |\n`;
      template += `|---|---|---|\n`;
      template += `| Clean Code | ✅/⚠️/❌ | |\n`;
      template += `| Convencoes ${frameworkLabel} | ✅/⚠️/❌ | |\n`;
      template += `| SOLID | ✅/⚠️/❌ | |\n`;
      template += `| Performance SQL | ✅/⚠️/❌ | |\n`;
      template += `| Seguranca | ✅/⚠️/❌ | |\n\n`;

      template += `> ${config.developerName}, preencha o status e observacoes de cada categoria apos a revisao.\n`;

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
