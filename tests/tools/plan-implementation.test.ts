import { describe, it, expect, beforeEach } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createServer } from "../../src/server.js";

describe("tool plan_implementation", () => {
  let client: Client;

  beforeEach(async () => {
    const server = createServer();
    const [clientTransport, serverTransport] =
      InMemoryTransport.createLinkedPair();
    await server.connect(serverTransport);
    client = new Client({ name: "test-client", version: "1.0.0" });
    await client.connect(clientTransport);
  });

  it("deve estar listada nas tools disponiveis", async () => {
    const { tools } = await client.listTools();
    const tool = tools.find((t) => t.name === "plan_implementation");

    expect(tool).toBeDefined();
    expect(tool!.description).toContain("plano de implementacao");
  });

  it("deve gerar perguntas de alinhamento para Laravel", async () => {
    const result = await client.callTool({
      name: "plan_implementation",
      arguments: {
        feature: "Sistema de notificacoes",
        technology: "laravel",
      },
    });

    const text = (result.content as Array<{ type: string; text: string }>)[0]
      .text;

    expect(text).toContain("Perguntas de Alinhamento");
    expect(text).toContain("regras de negocio");
    expect(text).toContain("Sistema de notificacoes");
  });

  it("deve gerar perguntas de alinhamento para NestJS", async () => {
    const result = await client.callTool({
      name: "plan_implementation",
      arguments: {
        feature: "Modulo de pagamentos",
        technology: "nestjs",
      },
    });

    const text = (result.content as Array<{ type: string; text: string }>)[0]
      .text;

    expect(text).toContain("Perguntas de Alinhamento");
    expect(text).toContain("Modules");
  });

  it("deve gerar plano faseado com 5 fases", async () => {
    const result = await client.callTool({
      name: "plan_implementation",
      arguments: {
        feature: "CRUD de produtos",
        technology: "laravel",
      },
    });

    const text = (result.content as Array<{ type: string; text: string }>)[0]
      .text;

    expect(text).toContain("Fase 1");
    expect(text).toContain("Fase 2");
    expect(text).toContain("Fase 3");
    expect(text).toContain("Fase 4");
    expect(text).toContain("Fase 5");
  });

  it("deve incluir estrutura de arquivos no plano Laravel", async () => {
    const result = await client.callTool({
      name: "plan_implementation",
      arguments: {
        feature: "Gestao de usuarios",
        technology: "laravel",
      },
    });

    const text = (result.content as Array<{ type: string; text: string }>)[0]
      .text;

    expect(text).toContain("Models/");
    expect(text).toContain("Controller");
    expect(text).toContain("Service");
    expect(text).toContain("Repository");
  });

  it("deve incluir estrutura de arquivos no plano NestJS", async () => {
    const result = await client.callTool({
      name: "plan_implementation",
      arguments: {
        feature: "Gestao de usuarios",
        technology: "nestjs",
      },
    });

    const text = (result.content as Array<{ type: string; text: string }>)[0]
      .text;

    expect(text).toContain(".entity.ts");
    expect(text).toContain(".module.ts");
    expect(text).toContain(".service.ts");
    expect(text).toContain(".controller.ts");
  });

  it("deve incluir TDD no plano de cada fase", async () => {
    const result = await client.callTool({
      name: "plan_implementation",
      arguments: {
        feature: "Checkout de pedido",
        technology: "nestjs",
      },
    });

    const text = (result.content as Array<{ type: string; text: string }>)[0]
      .text;

    expect(text).toContain("TDD");
    expect(text).toContain("Red");
    expect(text).toContain("Green");
    expect(text).toContain("Refactor");
    expect(text).toContain("Testes");
  });

  it("deve conter nome do desenvolvedor", async () => {
    const result = await client.callTool({
      name: "plan_implementation",
      arguments: {
        feature: "Dashboard de metricas",
        technology: "laravel",
      },
    });

    const text = (result.content as Array<{ type: string; text: string }>)[0]
      .text;

    expect(text).toContain("alinhar");
  });

  it("deve incluir requisitos quando fornecidos", async () => {
    const result = await client.callTool({
      name: "plan_implementation",
      arguments: {
        feature: "API de relatorios",
        technology: "nestjs",
        requirements: "Deve suportar exportacao em PDF e CSV",
      },
    });

    const text = (result.content as Array<{ type: string; text: string }>)[0]
      .text;

    expect(text).toContain("exportacao em PDF e CSV");
  });

  it("deve incluir ordem de execucao", async () => {
    const result = await client.callTool({
      name: "plan_implementation",
      arguments: {
        feature: "Sistema de avaliacoes",
        technology: "laravel",
      },
    });

    const text = (result.content as Array<{ type: string; text: string }>)[0]
      .text;

    expect(text).toContain("Ordem de Execucao");
    expect(text).toContain("independente");
  });
});
