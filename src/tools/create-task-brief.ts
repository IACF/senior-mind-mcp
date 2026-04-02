import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

const technologyEnum = z.enum(["laravel", "nestjs", "generic"]);
const taskTypeEnum = z.enum([
  "nova-feature",
  "bug-fix",
  "refatoracao",
  "modulo",
  "servico",
]);

type Technology = z.infer<typeof technologyEnum>;
type TaskType = z.infer<typeof taskTypeEnum>;

interface Commands {
  test: string;
  testFile: string;
  lint?: string;
  other?: string;
}

// ─── String helpers ───────────────────────────────────────────────────────────

function toPascal(str: string): string {
  return str
    .replace(/[_\-\s:→]+(.)/g, (_, c: string) => c.toUpperCase())
    .replace(/^(.)/, (c: string) => c.toUpperCase())
    .replace(/[^a-zA-Z0-9]/g, "");
}

function toKebab(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function extractMainEntity(task: string): string {
  const pascalMatches = task.match(/\b[A-Z][a-zA-Z0-9]{2,}\b/g);
  if (pascalMatches && pascalMatches.length > 0) {
    return pascalMatches[pascalMatches.length - 1];
  }
  const stopWords = new Set([
    "implementar",
    "criar",
    "refatorar",
    "corrigir",
    "adicionar",
    "remover",
    "bug",
    "modulo",
    "servico",
    "feature",
    "sistema",
    "o",
    "a",
    "de",
    "da",
    "do",
    "no",
    "na",
    "para",
    "com",
    "por",
    "um",
    "uma",
    "e",
    "em",
  ]);
  const words = task
    .split(/\s+/)
    .filter(
      (w) =>
        !stopWords.has(w.toLowerCase().replace(/[^a-z]/g, "")) && w.length > 2
    );
  if (words.length > 0) {
    const word = words[0].replace(/[^a-zA-Z0-9]/g, "");
    return word.charAt(0).toUpperCase() + word.slice(1);
  }
  return "Entity";
}

// ─── Path generators ─────────────────────────────────────────────────────────

function featureTestPath(
  entity: string,
  tech: Technology,
  area: string = "Services"
): string {
  const p = toPascal(entity);
  if (tech === "laravel") return `tests/Feature/App/${area}/${p}Test.php`;
  if (tech === "nestjs")
    return `src/${toKebab(entity)}/${toKebab(entity)}.service.spec.ts`;
  return `tests/${p}.test.ts`;
}

function unitTestPath(
  entity: string,
  tech: Technology,
  area: string = "Services"
): string {
  const p = toPascal(entity);
  if (tech === "laravel") return `tests/Unit/${area}/${p}Test.php`;
  if (tech === "nestjs")
    return `src/${toKebab(entity)}/${toKebab(entity)}.service.spec.ts`;
  return `tests/unit/${p}.test.ts`;
}

function modelTestPath(entity: string, tech: Technology): string {
  const p = toPascal(entity);
  if (tech === "laravel") return `tests/Feature/App/Models/${p}Test.php`;
  if (tech === "nestjs")
    return `src/${toKebab(entity)}/${toKebab(entity)}.entity.spec.ts`;
  return `tests/${p}Entity.test.ts`;
}

function controllerTestPath(entity: string, tech: Technology): string {
  const p = toPascal(entity);
  if (tech === "laravel")
    return `tests/Feature/App/Http/Controllers/${p}ControllerTest.php`;
  if (tech === "nestjs")
    return `src/${toKebab(entity)}/${toKebab(entity)}.controller.spec.ts`;
  return `tests/${p}Controller.test.ts`;
}

function servicePath(entity: string, tech: Technology): string {
  const p = toPascal(entity);
  if (tech === "laravel") return `app/Services/${p}Service.php`;
  if (tech === "nestjs")
    return `src/${toKebab(entity)}/${toKebab(entity)}.service.ts`;
  return `src/services/${p}Service.ts`;
}

function modelPath(entity: string, tech: Technology): string {
  const p = toPascal(entity);
  if (tech === "laravel") return `app/Models/${p}.php`;
  if (tech === "nestjs")
    return `src/${toKebab(entity)}/${toKebab(entity)}.entity.ts`;
  return `src/models/${p}.ts`;
}

function repositoryPath(entity: string, tech: Technology): string {
  const p = toPascal(entity);
  if (tech === "laravel") return `app/Repositories/${p}Repository.php`;
  if (tech === "nestjs")
    return `src/${toKebab(entity)}/${toKebab(entity)}.repository.ts`;
  return `src/repositories/${p}Repository.ts`;
}

function controllerPath(entity: string, tech: Technology): string {
  const p = toPascal(entity);
  if (tech === "laravel") return `app/Http/Controllers/${p}Controller.php`;
  if (tech === "nestjs")
    return `src/${toKebab(entity)}/${toKebab(entity)}.controller.ts`;
  return `src/controllers/${p}Controller.ts`;
}

function factoryPath(entity: string, tech: Technology): string {
  const p = toPascal(entity);
  if (tech === "laravel") return `database/factories/${p}Factory.php`;
  if (tech === "nestjs")
    return `src/${toKebab(entity)}/factories/${toKebab(entity)}.factory.ts`;
  return `src/factories/${p}Factory.ts`;
}

// ─── Brief section builders ───────────────────────────────────────────────────

function commandsSection(commands: Commands): string {
  let out = `## Comandos do Projeto\n\n`;
  out += `- Rodar todos os testes: ${commands.test}\n`;
  out += `- Rodar testes de um arquivo: ${commands.testFile}\n`;
  if (commands.lint) out += `- Linting: ${commands.lint}\n`;
  if (commands.other) out += `- Outros: ${commands.other}\n`;
  return out + "\n";
}

function criticalFilesSection(
  entity: string,
  tech: Technology,
  taskType: TaskType,
  context?: string
): string {
  const rows: Array<[string, string]> = [];

  if (taskType === "bug-fix") {
    rows.push([servicePath(entity, tech), "Corrigir logica com bug"]);
    rows.push([
      unitTestPath(entity, tech),
      "RED: testes do bug + edge cases",
    ]);
  } else if (taskType === "refatoracao") {
    rows.push([
      servicePath(entity, tech),
      "Refatorar apos rede de seguranca",
    ]);
    rows.push([
      unitTestPath(entity, tech),
      "Rede de seguranca + testes de regressao",
    ]);
  } else if (taskType === "modulo") {
    rows.push([modelPath(entity, tech), "Criar: entidade + campos"]);
    rows.push([factoryPath(entity, tech), "Criar: factory para testes"]);
    rows.push([
      repositoryPath(entity, tech),
      "Criar: interface + implementacao",
    ]);
    rows.push([servicePath(entity, tech), "Criar: logica de negocio (TDD)"]);
    rows.push([
      controllerPath(entity, tech),
      "Criar: controller fino + rotas",
    ]);
  } else if (taskType === "nova-feature") {
    rows.push([servicePath(entity, tech), "Criar: logica de negocio (TDD)"]);
    rows.push([controllerPath(entity, tech), "Criar: controller + rotas"]);
    rows.push([unitTestPath(entity, tech), "RED: testes do service"]);
    rows.push([
      controllerTestPath(entity, tech),
      "RED: testes de integracao HTTP",
    ]);
  } else if (taskType === "servico") {
    rows.push([
      servicePath(entity, tech),
      "Implementar: contratos + logica (TDD)",
    ]);
    rows.push([
      unitTestPath(entity, tech),
      "RED: testes unitarios do servico",
    ]);
  }

  if (context) {
    rows.push([context, "Contexto adicional informado pelo dev"]);
  }

  let out = `## Arquivos Criticos\n\n`;
  out += `| Arquivo | Acao |\n`;
  out += `|---------|------|\n`;
  for (const [file, action] of rows) {
    out += `| \`${file}\` | ${action} |\n`;
  }
  return out + "\n";
}

// ─── Phase generators per taskType ───────────────────────────────────────────

function refactorLine(commands: Commands): string {
  return commands.lint ? `REFACTOR + \`${commands.lint}\`` : `REFACTOR`;
}

function phaseBugFix(
  entity: string,
  tech: Technology,
  commands: Commands
): string {
  const p = toPascal(entity);
  const testFile = unitTestPath(entity, tech);
  const src = servicePath(entity, tech);
  const rf = refactorLine(commands);

  let out = `### Fase 1 — ${p}: Reproducao e Correcao do Bug\n\n`;
  out += `**Objetivo:** Escrever teste falhando que reproduz o bug, aplicar correcao minima.\n\n`;
  out += `**TDD:**\n\n`;
  out += `RED — \`${testFile}\`:\n`;
  out += `- test${p}BugReproduction\n`;
  out += `- test${p}HappyPathUnaffected\n\n`;
  out += `GREEN — \`${src}\`:\n`;
  out += `Implementar correcao minima para os testes passarem.\n\n`;
  out += `${rf}\n\n`;
  out += `---\n\n`;

  out += `### Fase 2 — ${p}: Edge Cases e Cobertura\n\n`;
  out += `**Objetivo:** Cobrir casos extremos descobertos apos a correcao.\n\n`;
  out += `**TDD:**\n\n`;
  out += `RED — \`${testFile}\`:\n`;
  out += `- test${p}EdgeCaseEmpty\n`;
  out += `- test${p}EdgeCaseInvalidInput\n`;
  out += `- test${p}EdgeCaseBoundaryValues\n\n`;
  out += `GREEN — \`${src}\`:\n`;
  out += `Tratar os edge cases identificados.\n\n`;
  out += `${rf}\n\n`;
  out += `---\n\n`;

  return out;
}

function phaseRefatoracao(
  entity: string,
  tech: Technology,
  commands: Commands
): string {
  const p = toPascal(entity);
  const testFile = unitTestPath(entity, tech);
  const src = servicePath(entity, tech);
  const rf = refactorLine(commands);

  let out = `### Fase 1 — Rede de Seguranca: Cobertura de Testes Existentes\n\n`;
  out += `**Objetivo:** Escrever testes cobrindo o comportamento atual ANTES de qualquer mudanca de codigo de producao.\n\n`;
  out += `**TDD:**\n\n`;
  out += `RED — \`${testFile}\`:\n`;
  out += `- test${p}CurrentBehaviorHappyPath\n`;
  out += `- test${p}CurrentBehaviorEdgeCases\n`;
  out += `- test${p}CurrentBehaviorInvalidInput\n\n`;
  out += `GREEN — \`${src}\` (sem mudancas):\n`;
  out += `Os testes devem passar com o codigo EXISTENTE sem modificacoes.\n\n`;
  out += `${rf}\n\n`;
  out += `---\n\n`;

  out += `### Fase 2 — Refatoracao: ${p}\n\n`;
  out += `**Objetivo:** Refatorar o codigo com a rede de seguranca ativa. Nenhum comportamento novo.\n\n`;
  out += `**TDD:**\n\n`;
  out += `RED — \`${testFile}\` (mesmos testes da Fase 1 devem continuar verdes):\n`;
  out += `- Nenhum teste novo. Se os testes da Fase 1 falharem, a refatoracao introduziu regressao.\n\n`;
  out += `GREEN — \`${src}\`:\n`;
  out += `Aplicar refatoracao: extrair metodos, renomear, simplificar logica, remover duplicacao.\n\n`;
  out += `${rf}\n\n`;
  out += `---\n\n`;

  out += `### Fase 3 — Validacao Arquitetural e Limpeza\n\n`;
  out += `**Objetivo:** Validar que a refatoracao nao violou principios de Clean Architecture.\n\n`;
  out += `**TDD:**\n\n`;
  out += `RED — \`${testFile}\` (todos os testes anteriores devem passar):\n`;
  out += `- Adicionar testes para comportamentos descobertos mas nao cobertos.\n\n`;
  out += `GREEN — \`${src}\`:\n`;
  out += `Corrigir qualquer violacao detectada pelo review_code e detect_code_smells.\n\n`;
  out += `${rf}\n\n`;
  out += `---\n\n`;

  return out;
}

function phaseModulo(
  entity: string,
  tech: Technology,
  commands: Commands
): string {
  const p = toPascal(entity);
  const rf = refactorLine(commands);
  const modelTestFile = modelTestPath(entity, tech);
  const modelFile = modelPath(entity, tech);
  const factoryFile = factoryPath(entity, tech);
  const repoTestFile = featureTestPath(entity, tech, "Repositories");
  const repoFile = repositoryPath(entity, tech);
  const serviceTestFile = unitTestPath(entity, tech);
  const serviceFile = servicePath(entity, tech);
  const controllerTestFile = controllerTestPath(entity, tech);
  const controllerFile = controllerPath(entity, tech);

  let out = `### Fase 1 — ${p}: Modelo e Entidade\n\n`;
  out += `**Objetivo:** Criar o modelo com campos, relacoes e factory para testes.\n\n`;
  out += `**TDD:**\n\n`;
  out += `RED — \`${modelTestFile}\`:\n`;
  out += `- test${p}HasRequiredFields\n`;
  out += `- test${p}FactoryCreatesValidRecord\n`;
  out += `- test${p}Relationships\n\n`;
  out += `GREEN — \`${modelFile}\` + \`${factoryFile}\`:\n`;
  out += `Implementar modelo com campos, casts e relacoes. Preencher factory.\n\n`;
  out += `${rf}\n\n`;
  out += `---\n\n`;

  out += `### Fase 2 — ${p}: Repository (Acesso a Dados)\n\n`;
  out += `**Objetivo:** Implementar interface de acesso a dados e sua implementacao concreta.\n\n`;
  out += `**TDD:**\n\n`;
  out += `RED — \`${repoTestFile}\`:\n`;
  out += `- test${p}RepositoryFindById\n`;
  out += `- test${p}RepositoryFindAll\n`;
  out += `- test${p}RepositorySave\n\n`;
  out += `GREEN — \`${repoFile}\`:\n`;
  out += `Implementar interface + implementacao concreta com acesso ao banco.\n\n`;
  out += `${rf}\n\n`;
  out += `---\n\n`;

  out += `### Fase 3 — ${p}: Service (Logica de Negocio, TDD)\n\n`;
  out += `**Objetivo:** Implementar casos de uso com TDD. Logica de negocio isolada do framework.\n\n`;
  out += `**TDD:**\n\n`;
  out += `RED — \`${serviceTestFile}\`:\n`;
  out += `- test${p}ServiceCreate_HappyPath\n`;
  out += `- test${p}ServiceCreate_ValidationError\n`;
  out += `- test${p}ServiceUpdate_Success\n`;
  out += `- test${p}ServiceDelete_Success\n\n`;
  out += `GREEN — \`${serviceFile}\`:\n`;
  out += `Implementar service com injecao do Repository. Minimo para passar os testes.\n\n`;
  out += `${rf}\n\n`;
  out += `---\n\n`;

  out += `### Fase 4 — ${p}: Controller e API\n\n`;
  out += `**Objetivo:** Expor a feature via HTTP. Controller fino que delega ao Service.\n\n`;
  out += `**TDD:**\n\n`;
  out += `RED — \`${controllerTestFile}\`:\n`;
  out += `- test${p}Create_Returns201\n`;
  out += `- test${p}Create_Returns422OnInvalidData\n`;
  out += `- test${p}List_Returns200\n`;
  out += `- test${p}Delete_Returns204\n\n`;
  out += `GREEN — \`${controllerFile}\`:\n`;
  out += `Criar controller com endpoints CRUD. Registrar rotas.\n\n`;
  out += `${rf}\n\n`;
  out += `---\n\n`;

  out += `### Fase 5 — Refinamentos e Integracao\n\n`;
  out += `**Objetivo:** Polir implementacao: paginacao, filtros, cache e documentacao.\n\n`;
  out += `**TDD:**\n\n`;
  out += `RED — \`${controllerTestFile}\`:\n`;
  out += `- test${p}List_SupportsPagination\n`;
  out += `- test${p}List_SupportsFilters\n\n`;
  out += `GREEN — \`${controllerFile}\` + \`${serviceFile}\`:\n`;
  out += `Adicionar paginacao, filtros e otimizacoes necessarias.\n\n`;
  out += `${rf}\n\n`;
  out += `---\n\n`;

  return out;
}

function phaseNovaFeature(
  entity: string,
  tech: Technology,
  commands: Commands
): string {
  const p = toPascal(entity);
  const rf = refactorLine(commands);
  const serviceTestFile = unitTestPath(entity, tech);
  const serviceFile = servicePath(entity, tech);
  const controllerTestFile = controllerTestPath(entity, tech);
  const controllerFile = controllerPath(entity, tech);

  let out = `### Fase 1 — Contratos e Interfaces\n\n`;
  out += `**Objetivo:** Definir contratos (interfaces), DTOs e estrutura antes de implementar.\n\n`;
  out += `**TDD:**\n\n`;
  out += `RED — \`${serviceTestFile}\`:\n`;
  out += `- test${p}ContractMethodSignatures\n`;
  out += `- test${p}DtoValidation\n\n`;
  out += `GREEN — \`${serviceFile}\`:\n`;
  out += `Definir interfaces e DTOs. Implementacao minima (stubs).\n\n`;
  out += `${rf}\n\n`;
  out += `---\n\n`;

  out += `### Fase 2 — ${p}: Service e Logica (TDD)\n\n`;
  out += `**Objetivo:** Implementar logica de negocio com TDD.\n\n`;
  out += `**TDD:**\n\n`;
  out += `RED — \`${serviceTestFile}\`:\n`;
  out += `- test${p}Execute_HappyPath\n`;
  out += `- test${p}Execute_ThrowsOnInvalidInput\n`;
  out += `- test${p}Execute_HandlesEdgeCases\n\n`;
  out += `GREEN — \`${serviceFile}\`:\n`;
  out += `Implementar logica completa do service/use case.\n\n`;
  out += `${rf}\n\n`;
  out += `---\n\n`;

  out += `### Fase 3 — API e Controller\n\n`;
  out += `**Objetivo:** Expor o service via HTTP com validacao e testes de integracao.\n\n`;
  out += `**TDD:**\n\n`;
  out += `RED — \`${controllerTestFile}\`:\n`;
  out += `- test${p}Endpoint_Returns200OnSuccess\n`;
  out += `- test${p}Endpoint_Returns422OnValidationError\n`;
  out += `- test${p}Endpoint_Returns401WhenUnauthorized\n\n`;
  out += `GREEN — \`${controllerFile}\`:\n`;
  out += `Criar controller, registrar rotas, aplicar middlewares.\n\n`;
  out += `${rf}\n\n`;
  out += `---\n\n`;

  out += `### Fase 4 — Refinamentos\n\n`;
  out += `**Objetivo:** Polir implementacao com paginacao, logs e documentacao.\n\n`;
  out += `**TDD:**\n\n`;
  out += `RED — \`${controllerTestFile}\`:\n`;
  out += `- test${p}Performance_LargeDataset\n`;
  out += `- test${p}Logging_AuditTrail\n\n`;
  out += `GREEN — \`${serviceFile}\` + \`${controllerFile}\`:\n`;
  out += `Implementar refinamentos e otimizacoes necessarias.\n\n`;
  out += `${rf}\n\n`;
  out += `---\n\n`;

  return out;
}

function phaseServico(
  entity: string,
  tech: Technology,
  commands: Commands
): string {
  const p = toPascal(entity);
  const rf = refactorLine(commands);
  const serviceTestFile = unitTestPath(entity, tech);
  const serviceFile = servicePath(entity, tech);
  const integTestFile = featureTestPath(entity, tech, "Integration");

  let out = `### Fase 1 — Contratos e Interfaces\n\n`;
  out += `**Objetivo:** Definir interface do servico antes da implementacao.\n\n`;
  out += `**TDD:**\n\n`;
  out += `RED — \`${serviceTestFile}\`:\n`;
  out += `- test${p}InterfaceMethodSignatures\n`;
  out += `- test${p}ContractFulfillment\n\n`;
  out += `GREEN — \`${serviceFile}\`:\n`;
  out += `Definir interface + stub de implementacao.\n\n`;
  out += `${rf}\n\n`;
  out += `---\n\n`;

  out += `### Fase 2 — ${p}: Implementacao (TDD)\n\n`;
  out += `**Objetivo:** Implementar o servico completo com TDD.\n\n`;
  out += `**TDD:**\n\n`;
  out += `RED — \`${serviceTestFile}\`:\n`;
  out += `- test${p}Execute_Success\n`;
  out += `- test${p}Execute_FailsOnInvalidInput\n`;
  out += `- test${p}Execute_HandlesExternalError\n\n`;
  out += `GREEN — \`${serviceFile}\`:\n`;
  out += `Implementar servico completo com tratamento de erros.\n\n`;
  out += `${rf}\n\n`;
  out += `---\n\n`;

  out += `### Fase 3 — Integracao e Testes E2E\n\n`;
  out += `**Objetivo:** Validar o servico integrado com dependencias reais.\n\n`;
  out += `**TDD:**\n\n`;
  out += `RED — \`${integTestFile}\`:\n`;
  out += `- test${p}Integration_FullFlow\n`;
  out += `- test${p}Integration_ErrorPropagation\n\n`;
  out += `GREEN — \`${serviceFile}\`:\n`;
  out += `Ajustes para integracao funcionar ponta a ponta.\n\n`;
  out += `${rf}\n\n`;
  out += `---\n\n`;

  return out;
}

// ─── Main generator ───────────────────────────────────────────────────────────

function generateBrief(
  task: string,
  technology: Technology,
  taskType: TaskType,
  commands: Commands,
  requirements?: string,
  context?: string
): string {
  const entity = extractMainEntity(task);
  const taskTypePt: Record<TaskType, string> = {
    "nova-feature": "Nova Feature",
    "bug-fix": "Bug Fix",
    refatoracao: "Refatoracao",
    modulo: "Modulo",
    servico: "Servico",
  };

  let brief = `# Task Brief — ${taskTypePt[taskType]}: ${task}\n\n`;

  brief += `## Contexto\n\n`;
  if (requirements) {
    brief += `${requirements}\n\n`;
  } else {
    brief += `${task}.\n\n`;
  }
  if (context) {
    brief += `**Contexto adicional:** ${context}\n\n`;
  }

  if (
    taskType === "modulo" ||
    taskType === "servico" ||
    taskType === "refatoracao"
  ) {
    const p = toPascal(entity);
    brief += `## Arquitetura da Solucao\n\n`;
    brief += "```\n";
    if (taskType === "modulo") {
      brief += `${p} (entidade)\n`;
      brief += `      ↓\n`;
      brief += `${p}Repository (acesso a dados)\n`;
      brief += `      ↓\n`;
      brief += `${p}Service (logica de negocio)\n`;
      brief += `      ↓\n`;
      brief += `${p}Controller (API/HTTP)\n`;
    } else if (taskType === "servico") {
      brief += `I${p}Service (interface)\n`;
      brief += `      ↓ implementa\n`;
      brief += `${p}Service (logica)\n`;
      brief += `      ↓ integra com\n`;
      brief += `Dependencias externas / outros servicos\n`;
    } else {
      brief += `[Estado atual: codigo refatoravel]\n`;
      brief += `      ↓ rede de seguranca (Fase 1)\n`;
      brief += `[Estado apos refatoracao: codigo limpo]\n`;
    }
    brief += "```\n\n";
  }

  brief += commandsSection(commands);
  brief += criticalFilesSection(entity, technology, taskType, context);

  brief += `## Fases de Implementacao\n\n`;

  if (taskType === "bug-fix") {
    brief += phaseBugFix(entity, technology, commands);
  } else if (taskType === "refatoracao") {
    brief += phaseRefatoracao(entity, technology, commands);
  } else if (taskType === "modulo") {
    brief += phaseModulo(entity, technology, commands);
  } else if (taskType === "nova-feature") {
    brief += phaseNovaFeature(entity, technology, commands);
  } else if (taskType === "servico") {
    brief += phaseServico(entity, technology, commands);
  }

  brief += `## Verificacao End-to-End\n\n`;
  brief += "```bash\n";
  brief += `${commands.test}\n`;
  if (commands.lint) brief += `${commands.lint}\n`;
  brief += "```\n\n";

  brief += `---\n`;
  brief += `Quais fases deseja executar? (numeros separados por virgula ou "todas")\n`;

  return brief;
}

// ─── Tool registration ────────────────────────────────────────────────────────

export function register(server: McpServer): void {
  server.tool(
    "create_task_brief",
    "Gera um plano tecnico de implementacao (task brief) estruturado com contexto arquitetural, arquivos criticos e fases TDD",
    {
      task: z.string().describe("Descricao da tarefa a implementar"),
      technology: technologyEnum.describe("Stack tecnologica do projeto"),
      taskType: taskTypeEnum.describe(
        "Tipo da tarefa: nova-feature, bug-fix, refatoracao, modulo, servico"
      ),
      testCommand: z
        .string()
        .describe("Comando para rodar todos os testes do projeto"),
      testFileCommand: z
        .string()
        .describe(
          "Comando para rodar os testes de um arquivo especifico (use {class} ou {file} como placeholder)"
        ),
      lintCommand: z
        .string()
        .optional()
        .describe("Comando de linting ou verificacao de padrao de codigo"),
      otherCommands: z
        .string()
        .optional()
        .describe(
          "Outros comandos relevantes para o ciclo de desenvolvimento (ex: migrate, build)"
        ),
      requirements: z
        .string()
        .optional()
        .describe("Requisitos ja conhecidos da tarefa"),
      context: z
        .string()
        .optional()
        .describe(
          "Contexto adicional: paths de arquivos existentes, contexto do dominio"
        ),
    },
    async ({
      task,
      technology,
      taskType,
      testCommand,
      testFileCommand,
      lintCommand,
      otherCommands,
      requirements,
      context,
    }) => {
      const commands: Commands = {
        test: testCommand,
        testFile: testFileCommand,
        lint: lintCommand,
        other: otherCommands,
      };
      const text = generateBrief(
        task,
        technology,
        taskType,
        commands,
        requirements,
        context
      );
      return { content: [{ type: "text", text }] };
    }
  );
}
