import { describe, it, expect, beforeEach } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createServer } from "../../src/server.js";

describe("tool create_task_brief", () => {
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
    const tool = tools.find((t) => t.name === "create_task_brief");
    expect(tool).toBeDefined();
    expect(tool!.description).toContain("task brief");
  });

  it("deve conter secao Comandos do Projeto com os comandos passados", async () => {
    const result = await client.callTool({
      name: "create_task_brief",
      arguments: {
        task: "Implementar modulo de pagamentos",
        technology: "laravel",
        taskType: "modulo",
        testCommand: "./vendor/bin/sail test",
        testFileCommand: "./vendor/bin/sail test --filter {class}",
        lintCommand: "./vendor/bin/sail bin phpcs",
      },
    });
    const text = getText(result);
    expect(text).toContain("Comandos do Projeto");
    expect(text).toContain("./vendor/bin/sail test");
    expect(text).toContain("./vendor/bin/sail test --filter {class}");
    expect(text).toContain("./vendor/bin/sail bin phpcs");
  });

  it("deve conter tabela de Arquivos Criticos com formato de tabela", async () => {
    const result = await client.callTool({
      name: "create_task_brief",
      arguments: {
        task: "Corrigir bug no CartService",
        technology: "laravel",
        taskType: "bug-fix",
        testCommand: "npm test",
        testFileCommand: "npm test -- --grep",
      },
    });
    const text = getText(result);
    expect(text).toContain("Arquivos Criticos");
    expect(text).toMatch(/\|.*\|.*\|/);
  });

  it("deve conter fases com RED, GREEN e REFACTOR", async () => {
    const result = await client.callTool({
      name: "create_task_brief",
      arguments: {
        task: "Implementar servico de notificacao",
        technology: "nestjs",
        taskType: "servico",
        testCommand: "npm run test",
        testFileCommand: "npm run test -- --testPathPattern",
      },
    });
    const text = getText(result);
    expect(text).toContain("RED");
    expect(text).toContain("GREEN");
    expect(text).toContain("REFACTOR");
  });

  it("deve conter caminhos de arquivo reais para Laravel", async () => {
    const result = await client.callTool({
      name: "create_task_brief",
      arguments: {
        task: "Implementar modulo de produtos",
        technology: "laravel",
        taskType: "modulo",
        testCommand: "./vendor/bin/sail test",
        testFileCommand: "./vendor/bin/sail test --filter {class}",
      },
    });
    const text = getText(result);
    expect(text).toMatch(
      /app\/Services\/|app\/Models\/|tests\/Feature\/|tests\/Unit\//
    );
  });

  it("deve conter caminhos de arquivo reais para NestJS", async () => {
    const result = await client.callTool({
      name: "create_task_brief",
      arguments: {
        task: "Implementar modulo de usuarios",
        technology: "nestjs",
        taskType: "modulo",
        testCommand: "npm run test",
        testFileCommand: "npm run test -- --testPathPattern",
      },
    });
    const text = getText(result);
    expect(text).toMatch(
      /\.service\.ts|\.entity\.ts|\.controller\.ts|\.spec\.ts/
    );
  });

  it("bug-fix deve gerar fases focadas em reproducao e correcao com testes proprios", async () => {
    const result = await client.callTool({
      name: "create_task_brief",
      arguments: {
        task: "Bug no CartService: desconto percentual nao funciona",
        technology: "laravel",
        taskType: "bug-fix",
        testCommand: "./vendor/bin/sail test",
        testFileCommand: "./vendor/bin/sail test --filter {class}",
      },
    });
    const text = getText(result);
    expect(text).toContain("Reproducao");
    expect(text).toContain("Edge Cases");
    expect(text).toContain("Fase 1");
    expect(text).toContain("Fase 2");
  });

  it("refatoracao deve ter Fase 1 como rede de seguranca (testes antes de mudar codigo)", async () => {
    const result = await client.callTool({
      name: "create_task_brief",
      arguments: {
        task: "Refatorar o PaymentService para separar responsabilidades",
        technology: "laravel",
        taskType: "refatoracao",
        testCommand: "./vendor/bin/sail test",
        testFileCommand: "./vendor/bin/sail test --filter {class}",
      },
    });
    const text = getText(result);
    expect(text).toContain("Fase 1 — Rede de Seguranca");
    expect(text).toContain("comportamento atual ANTES");
  });

  it("modulo deve gerar exatamente 5 fases com arquivos independentes por fase", async () => {
    const result = await client.callTool({
      name: "create_task_brief",
      arguments: {
        task: "Implementar modulo de pedidos no Laravel",
        technology: "laravel",
        taskType: "modulo",
        testCommand: "./vendor/bin/sail test",
        testFileCommand: "./vendor/bin/sail test --filter {class}",
      },
    });
    const text = getText(result);
    expect(text).toContain("Fase 1");
    expect(text).toContain("Fase 2");
    expect(text).toContain("Fase 3");
    expect(text).toContain("Fase 4");
    expect(text).toContain("Fase 5");
  });

  it("cada fase de modulo deve ter seus proprios testes (autossuficiente)", async () => {
    const result = await client.callTool({
      name: "create_task_brief",
      arguments: {
        task: "Implementar modulo de produtos",
        technology: "laravel",
        taskType: "modulo",
        testCommand: "./vendor/bin/sail test",
        testFileCommand: "./vendor/bin/sail test --filter {class}",
      },
    });
    const text = getText(result);
    // Each phase should have its own RED block with a test file
    const redCount = (text.match(/^RED — `/gm) || []).length;
    expect(redCount).toBeGreaterThanOrEqual(5);
  });

  it("deve conter instrucao de revisao e selecao de fases no final", async () => {
    const result = await client.callTool({
      name: "create_task_brief",
      arguments: {
        task: "Implementar feature de exportacao",
        technology: "laravel",
        taskType: "nova-feature",
        testCommand: "./vendor/bin/sail test",
        testFileCommand: "./vendor/bin/sail test --filter {class}",
      },
    });
    const text = getText(result);
    expect(text).toContain("Quais fases deseja executar");
  });

  it("deve incluir requirements quando fornecidos", async () => {
    const result = await client.callTool({
      name: "create_task_brief",
      arguments: {
        task: "Implementar autenticacao JWT",
        technology: "nestjs",
        taskType: "nova-feature",
        testCommand: "npm run test",
        testFileCommand: "npm run test -- --testPathPattern",
        requirements: "Deve suportar refresh token e expirar em 24h",
      },
    });
    const text = getText(result);
    expect(text).toContain("refresh token");
  });

  it("deve incluir lintCommand no REFACTOR quando fornecido", async () => {
    const result = await client.callTool({
      name: "create_task_brief",
      arguments: {
        task: "Bug no OrderService",
        technology: "laravel",
        taskType: "bug-fix",
        testCommand: "./vendor/bin/sail test",
        testFileCommand: "./vendor/bin/sail test --filter {class}",
        lintCommand: "./vendor/bin/sail bin phpcs",
      },
    });
    const text = getText(result);
    expect(text).toMatch(/REFACTOR \+ `\.\/vendor\/bin\/sail bin phpcs`/);
  });
});
