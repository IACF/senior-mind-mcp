import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { config } from "../config.js";

const phaseEnum = z.enum(["red", "green", "refactor"]);
const technologyEnum = z.enum(["laravel", "nestjs"]);
type Phase = z.infer<typeof phaseEnum>;
type Technology = z.infer<typeof technologyEnum>;

function generateRedPhase(
  feature: string,
  technology: Technology
): string {
  const testFramework =
    technology === "laravel" ? "PHPUnit/Pest" : "Jest/Vitest";
  const lang = technology === "laravel" ? "php" : "typescript";

  let output = `# TDD — Fase RED 🔴\n\n`;
  output += `**Feature**: ${feature}\n`;
  output += `**Stack**: ${technology === "laravel" ? "Laravel" : "NestJS"}\n`;
  output += `**Framework de teste**: ${testFramework}\n\n`;
  output += `---\n\n`;
  output += `## Objetivo desta fase\n\n`;
  output += `Escrever testes que **falham** — eles descrevem o comportamento desejado ANTES de implementar.\n\n`;

  output += `## Cenarios de teste sugeridos\n\n`;
  output += `### 1. Happy Path (Caminho feliz)\n`;
  output += `Testa o fluxo principal com dados validos.\n\n`;

  if (technology === "laravel") {
    output += `\`\`\`${lang}\nit('deve ${feature.toLowerCase()} com dados validos', function () {\n    // Arrange\n    \$dados = [\n        // dados validos para o cenario\n    ];\n\n    // Act\n    \$resultado = \$this->service->${camelCase(feature)}(\$dados);\n\n    // Assert\n    expect(\$resultado)->not->toBeNull();\n    // adicione asserts especificos\n});\n\`\`\`\n\n`;
  } else {
    output += `\`\`\`${lang}\nit('deve ${feature.toLowerCase()} com dados validos', async () => {\n  // Arrange\n  const dados = {\n    // dados validos para o cenario\n  };\n\n  // Act\n  const resultado = await service.${camelCase(feature)}(dados);\n\n  // Assert\n  expect(resultado).toBeDefined();\n  // adicione asserts especificos\n});\n\`\`\`\n\n`;
  }

  output += `### 2. Edge Cases (Casos limite)\n`;
  output += `Testa fronteiras e valores extremos.\n\n`;

  if (technology === "laravel") {
    output += `\`\`\`${lang}\nit('deve lidar com dados vazios', function () {\n    expect(fn() => \$this->service->${camelCase(feature)}([]))\n        ->toThrow(ValidationException::class);\n});\n\nit('deve lidar com valores no limite', function () {\n    // Arrange - valores minimos/maximos\n    // Act & Assert\n});\n\`\`\`\n\n`;
  } else {
    output += `\`\`\`${lang}\nit('deve lidar com dados vazios', async () => {\n  await expect(service.${camelCase(feature)}({})).rejects.toThrow();\n});\n\nit('deve lidar com valores no limite', async () => {\n  // Arrange - valores minimos/maximos\n  // Act & Assert\n});\n\`\`\`\n\n`;
  }

  output += `### 3. Error Cases (Casos de erro)\n`;
  output += `Testa situacoes de falha esperada.\n\n`;

  if (technology === "laravel") {
    output += `\`\`\`${lang}\nit('deve retornar erro quando recurso nao existe', function () {\n    expect(fn() => \$this->service->${camelCase(feature)}(['id' => 999]))\n        ->toThrow(NotFoundException::class);\n});\n\nit('deve retornar erro quando usuario nao autorizado', function () {\n    // Arrange - usuario sem permissao\n    // Act & Assert\n});\n\`\`\`\n\n`;
  } else {
    output += `\`\`\`${lang}\nit('deve lancar erro quando recurso nao existe', async () => {\n  await expect(service.${camelCase(feature)}({ id: 'inexistente' }))\n    .rejects.toThrow(NotFoundException);\n});\n\nit('deve lancar erro quando usuario nao autorizado', async () => {\n  // Arrange - usuario sem permissao\n  // Act & Assert\n});\n\`\`\`\n\n`;
  }

  output += `---\n\n`;
  output += `## Checklist da fase Red\n\n`;
  output += `- [ ] Testes descrevem o comportamento desejado (nao a implementacao)\n`;
  output += `- [ ] Cada teste tem nome descritivo (especificacao)\n`;
  output += `- [ ] Testes seguem padrao AAA (Arrange-Act-Assert)\n`;
  output += `- [ ] Testes cobrem: happy path, edge cases, error cases\n`;
  output += `- [ ] Todos os testes **falham** (ainda nao ha implementacao)\n\n`;
  output += `---\n\n`;
  output += `${config.developerName}, analise os cenarios do teste antes de prosseguir para a fase Green. Ajuste os cenarios conforme as regras de negocio especificas da feature.\n`;

  return output;
}

function generateGreenPhase(
  feature: string,
  technology: Technology,
  testCode?: string
): string {
  const lang = technology === "laravel" ? "php" : "typescript";

  let output = `# TDD — Fase GREEN 🟢\n\n`;
  output += `**Feature**: ${feature}\n`;
  output += `**Stack**: ${technology === "laravel" ? "Laravel" : "NestJS"}\n\n`;
  output += `---\n\n`;
  output += `## Objetivo desta fase\n\n`;
  output += `Escrever o **minimo de codigo** necessario para os testes passarem. Foco: "Make it work".\n\n`;

  output += `## Estrategia sugerida\n\n`;
  output += `1. **Fake It**: Comece retornando valores hardcoded para fazer os testes passarem\n`;
  output += `2. **Triangulate**: Adicione mais testes que forcem a implementacao real\n`;
  output += `3. **Obvious Implementation**: Se a solucao e clara, implemente direto\n\n`;

  if (testCode) {
    output += `## Testes recebidos\n\n`;
    output += `\`\`\`${lang}\n${testCode}\n\`\`\`\n\n`;
  }

  output += `## Estrutura sugerida de implementacao\n\n`;

  if (technology === "laravel") {
    output += `\`\`\`${lang}\n// app/Services/${pascalCase(feature)}Service.php\nclass ${pascalCase(feature)}Service\n{\n    public function __construct(\n        private readonly ${pascalCase(feature)}Repository \$repository,\n    ) {}\n\n    public function ${camelCase(feature)}(array \$data): mixed\n    {\n        // Implementacao MINIMA para os testes passarem\n        // Nao se preocupe com elegancia agora\n    }\n}\n\`\`\`\n\n`;
  } else {
    output += `\`\`\`${lang}\n// ${kebabCase(feature)}.service.ts\n@Injectable()\nexport class ${pascalCase(feature)}Service {\n  constructor(\n    private readonly repository: ${pascalCase(feature)}Repository,\n  ) {}\n\n  async ${camelCase(feature)}(data: ${pascalCase(feature)}Input): Promise<${pascalCase(feature)}Output> {\n    // Implementacao MINIMA para os testes passarem\n    // Nao se preocupe com elegancia agora\n  }\n}\n\`\`\`\n\n`;
  }

  output += `## Checklist da fase Green\n\n`;
  output += `- [ ] Todos os testes passam\n`;
  output += `- [ ] Codigo faz apenas o necessario para passar nos testes\n`;
  output += `- [ ] Nenhum teste anterior quebrou\n`;
  output += `- [ ] Nao adicionou funcionalidade extra (YAGNI)\n\n`;
  output += `---\n\n`;
  output += `${config.developerName}, apos os testes passarem, siga para a fase Refactor para melhorar a qualidade do codigo.\n`;

  return output;
}

function generateRefactorPhase(
  feature: string,
  technology: Technology,
  code?: string
): string {
  const lang = technology === "laravel" ? "php" : "typescript";

  let output = `# TDD — Fase REFACTOR ♻️\n\n`;
  output += `**Feature**: ${feature}\n`;
  output += `**Stack**: ${technology === "laravel" ? "Laravel" : "NestJS"}\n\n`;
  output += `---\n\n`;
  output += `## Objetivo desta fase\n\n`;
  output += `Melhorar o codigo **sem alterar o comportamento**. Os testes devem continuar verdes apos cada mudanca.\n\n`;

  if (code) {
    output += `## Codigo recebido para refatoracao\n\n`;
    output += `\`\`\`${lang}\n${code}\n\`\`\`\n\n`;
  }

  output += `## Checklist de refatoracao\n\n`;
  output += `### Clean Code\n`;
  output += `- [ ] Nomes significativos (variaveis, funcoes, classes revelam intencao)\n`;
  output += `- [ ] Funcoes pequenas (< 20 linhas, fazem UMA coisa)\n`;
  output += `- [ ] Sem duplicacao (DRY)\n`;
  output += `- [ ] Sem comentarios desnecessarios (codigo autodocumentado)\n`;
  output += `- [ ] Tratamento de erros adequado (excecoes especificas, sem null)\n\n`;

  output += `### Object Calisthenics\n`;
  output += `- [ ] Regra 1: Um nivel de indentacao por metodo\n`;
  output += `- [ ] Regra 2: Sem else (use early return/guard clauses)\n`;
  output += `- [ ] Regra 3: Primitivos encapsulados em Value Objects (quando aplicavel)\n`;
  output += `- [ ] Regra 5: Um ponto por linha (Lei de Demeter)\n`;
  output += `- [ ] Regra 6: Nomes completos, sem abreviacoes\n`;
  output += `- [ ] Regra 9: Tell, Don't Ask (sem getters/setters desnecessarios)\n\n`;

  output += `### SOLID\n`;
  output += `- [ ] SRP: Cada classe/funcao tem uma unica responsabilidade\n`;
  output += `- [ ] OCP: Aberto para extensao, fechado para modificacao\n`;
  output += `- [ ] DIP: Dependencias injetadas via interface/abstracoes\n\n`;

  output += `### Padroes ${technology === "laravel" ? "Laravel" : "NestJS"}\n`;
  if (technology === "laravel") {
    output += `- [ ] FormRequest para validacao\n`;
    output += `- [ ] API Resource para transformacao de saida\n`;
    output += `- [ ] Service para logica de negocio (Controller fino)\n`;
    output += `- [ ] Repository para acesso a dados (quando aplicavel)\n`;
    output += `- [ ] Eloquent scopes para queries reutilizaveis\n\n`;
  } else {
    output += `- [ ] DTOs com class-validator para entrada\n`;
    output += `- [ ] Response DTOs para saida\n`;
    output += `- [ ] Service para logica de negocio (Controller fino)\n`;
    output += `- [ ] Repository com interface para acesso a dados\n`;
    output += `- [ ] Module encapsulando a feature\n\n`;
  }

  output += `## Regra de ouro\n\n`;
  output += `> Execute os testes apos CADA mudanca. Se algum teste quebrar, desfaca a ultima alteracao.\n\n`;
  output += `---\n\n`;
  output += `${config.developerName}, refatore com confianca — os testes sao sua rede de seguranca. Apos concluir, o ciclo TDD reinicia com uma nova feature ou cenario.\n`;

  return output;
}

function camelCase(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-zA-Z0-9]+(.)/g, (_, c) => c.toUpperCase())
    .replace(/^./, (c) => c.toLowerCase());
}

function pascalCase(str: string): string {
  const camel = camelCase(str);
  return camel.charAt(0).toUpperCase() + camel.slice(1);
}

function kebabCase(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function register(server: McpServer): void {
  server.tool(
    "tdd_guide",
    "Guia o ciclo TDD (Red-Green-Refactor) com gates de aprovacao entre fases",
    {
      feature: z.string().describe("Descricao da feature"),
      phase: phaseEnum.describe("Fase atual do TDD: red, green ou refactor"),
      technology: technologyEnum.describe("Stack tecnologica: laravel ou nestjs"),
      code: z
        .string()
        .optional()
        .describe("Codigo atual da implementacao (para green/refactor)"),
      test_code: z
        .string()
        .optional()
        .describe("Codigo do teste (para green/refactor)"),
    },
    async ({ feature, phase, technology, code, test_code }) => {
      let text: string;

      switch (phase) {
        case "red":
          text = generateRedPhase(feature, technology);
          break;
        case "green":
          text = generateGreenPhase(feature, technology, test_code);
          break;
        case "refactor":
          text = generateRefactorPhase(feature, technology, code);
          break;
      }

      return {
        content: [{ type: "text", text }],
      };
    }
  );
}
