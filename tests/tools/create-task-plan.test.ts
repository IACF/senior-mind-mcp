import { describe, it, expect, beforeEach } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createServer } from "../../src/server.js";

const SAMPLE_BRIEF = `# Task Brief — Bug Fix: CartService

## Contexto

Bug no CartService onde o desconto percentual nao e aplicado corretamente.

## Comandos do Projeto

- Rodar todos os testes: ./vendor/bin/sail test
- Rodar testes de um arquivo: ./vendor/bin/sail test --filter {class}
- Linting: ./vendor/bin/sail bin phpcs

## Arquivos Criticos

| Arquivo | Acao |
|---------|------|
| \`app/Services/CartService.php\` | Corrigir logica com bug |
| \`tests/Unit/Services/CartServiceTest.php\` | RED: testes do bug + edge cases |

## Fases de Implementacao

### Fase 1 — CartService: Reproducao e Correcao do Bug

**Objetivo:** Escrever teste falhando que reproduz o bug, aplicar correcao minima.

**TDD:**

RED — \`tests/Unit/Services/CartServiceTest.php\`:
- testCartServiceBugReproduction
- testCartServiceHappyPathUnaffected

GREEN — \`app/Services/CartService.php\`:
Implementar correcao minima para os testes passarem.

REFACTOR + \`./vendor/bin/sail bin phpcs\`

---

### Fase 2 — CartService: Edge Cases e Cobertura

**Objetivo:** Cobrir casos extremos descobertos apos a correcao.

**TDD:**

RED — \`tests/Unit/Services/CartServiceTest.php\`:
- testCartServiceEdgeCaseEmpty
- testCartServiceEdgeCaseInvalidInput

GREEN — \`app/Services/CartService.php\`:
Tratar os edge cases identificados.

REFACTOR + \`./vendor/bin/sail bin phpcs\`

---

## Verificacao End-to-End

\`\`\`bash
./vendor/bin/sail test
./vendor/bin/sail bin phpcs
\`\`\`

---
Quais fases deseja executar? (numeros separados por virgula ou "todas")
`;

describe("tool create_task_plan", () => {
  let client: Client;

  beforeEach(async () => {
    const server = createServer();
    const [clientTransport, serverTransport] =
      InMemoryTransport.createLinkedPair();
    await server.connect(serverTransport);
    client = new Client({ name: "test-client", version: "1.0.0" });
    await client.connect(clientTransport);
  });

  function getText(
    result: Awaited<ReturnType<typeof client.callTool>>
  ): string {
    return (result.content as Array<{ type: string; text: string }>)[0].text;
  }

  it("deve estar listada nas tools disponiveis", async () => {
    const { tools } = await client.listTools();
    const tool = tools.find((t) => t.name === "create_task_plan");
    expect(tool).toBeDefined();
    expect(tool!.description).toContain("task-plan.json");
  });

  it("selectedPhases=[1]: apenas fase 1 selected=true, demais selected=false e status=skipped", async () => {
    const result = await client.callTool({
      name: "create_task_plan",
      arguments: {
        brief: SAMPLE_BRIEF,
        technology: "laravel",
        taskType: "bug-fix",
        selectedPhases: [1],
      },
    });
    const plan = JSON.parse(getText(result));
    const phase1 = plan.phases.find((p: { number: number }) => p.number === 1);
    const phase2 = plan.phases.find((p: { number: number }) => p.number === 2);
    expect(phase1.selected).toBe(true);
    expect(phase1.status).toBe("pending");
    expect(phase2.selected).toBe(false);
    expect(phase2.status).toBe("skipped");
  });

  it('selectedPhases="all": todas as fases ficam selected=true e status=pending', async () => {
    const result = await client.callTool({
      name: "create_task_plan",
      arguments: {
        brief: SAMPLE_BRIEF,
        technology: "laravel",
        taskType: "bug-fix",
        selectedPhases: "all",
      },
    });
    const plan = JSON.parse(getText(result));
    expect(plan.phases.every((p: { selected: boolean }) => p.selected)).toBe(
      true
    );
    expect(
      plan.phases.every((p: { status: string }) => p.status === "pending")
    ).toBe(true);
  });

  it("JSON gerado contem campo commands com os comandos do projeto", async () => {
    const result = await client.callTool({
      name: "create_task_plan",
      arguments: {
        brief: SAMPLE_BRIEF,
        technology: "laravel",
        taskType: "bug-fix",
        selectedPhases: "all",
      },
    });
    const plan = JSON.parse(getText(result));
    expect(plan.commands).toBeDefined();
    expect(plan.commands.test).toBe("./vendor/bin/sail test");
    expect(plan.commands.testFile).toBe(
      "./vendor/bin/sail test --filter {class}"
    );
    expect(plan.commands.lint).toBe("./vendor/bin/sail bin phpcs");
  });

  it("JSON gerado contem campo briefFile apontando para .senior-mind/[slug]-brief.md", async () => {
    const result = await client.callTool({
      name: "create_task_plan",
      arguments: {
        brief: SAMPLE_BRIEF,
        technology: "laravel",
        taskType: "bug-fix",
        selectedPhases: [1],
      },
    });
    const plan = JSON.parse(getText(result));
    expect(plan.briefFile).toBeDefined();
    expect(plan.briefFile).toContain(".senior-mind/");
    expect(plan.briefFile).toContain("-brief.md");
  });

  it("cada fase contem testFile, sourceFiles, tddPhase e qualityGates", async () => {
    const result = await client.callTool({
      name: "create_task_plan",
      arguments: {
        brief: SAMPLE_BRIEF,
        technology: "laravel",
        taskType: "bug-fix",
        selectedPhases: "all",
      },
    });
    const plan = JSON.parse(getText(result));
    for (const phase of plan.phases) {
      expect(phase.testFile).toBeDefined();
      expect(phase.sourceFiles).toBeInstanceOf(Array);
      expect(phase.tddPhase).toBeDefined();
      expect(phase.qualityGates).toBeInstanceOf(Array);
      expect(phase.qualityGates.length).toBeGreaterThan(0);
    }
  });

  it("fase selecionada tem testFile e sourceFiles corretos parseados do brief", async () => {
    const result = await client.callTool({
      name: "create_task_plan",
      arguments: {
        brief: SAMPLE_BRIEF,
        technology: "laravel",
        taskType: "bug-fix",
        selectedPhases: [1],
      },
    });
    const plan = JSON.parse(getText(result));
    const phase1 = plan.phases.find((p: { number: number }) => p.number === 1);
    expect(phase1.testFile).toBe(
      "tests/Unit/Services/CartServiceTest.php"
    );
    expect(phase1.sourceFiles).toContain("app/Services/CartService.php");
  });

  it("fases nao selecionadas ficam com status skipped", async () => {
    const result = await client.callTool({
      name: "create_task_plan",
      arguments: {
        brief: SAMPLE_BRIEF,
        technology: "laravel",
        taskType: "bug-fix",
        selectedPhases: [1],
      },
    });
    const plan = JSON.parse(getText(result));
    const skipped = plan.phases.filter(
      (p: { status: string }) => p.status === "skipped"
    );
    expect(skipped.length).toBeGreaterThan(0);
    expect(skipped.every((p: { selected: boolean }) => !p.selected)).toBe(
      true
    );
  });

  it("JSON contem campos obrigatorios: task, technology, taskType, generatedAt", async () => {
    const result = await client.callTool({
      name: "create_task_plan",
      arguments: {
        brief: SAMPLE_BRIEF,
        technology: "laravel",
        taskType: "bug-fix",
        selectedPhases: "all",
      },
    });
    const plan = JSON.parse(getText(result));
    expect(plan.task).toBeDefined();
    expect(plan.technology).toBe("laravel");
    expect(plan.taskType).toBe("bug-fix");
    expect(plan.generatedAt).toBeDefined();
  });
});
