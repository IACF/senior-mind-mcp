import { describe, it, expect, beforeEach } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createServer } from "../../src/server.js";

describe("tool analyze_architecture", () => {
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
    const tool = tools.find((t) => t.name === "analyze_architecture");

    expect(tool).toBeDefined();
    expect(tool!.description).toContain("Analisa um problema");
  });

  it("deve retornar opcoes de arquitetura para problema generico", async () => {
    const result = await client.callTool({
      name: "analyze_architecture",
      arguments: {
        problem: "Implementar sistema de notificacoes",
        technology: "generic",
      },
    });

    const text = (result.content as Array<{ type: string; text: string }>)[0]
      .text;

    expect(text).toContain("Analise de Arquitetura");
    expect(text).toContain("Implementar sistema de notificacoes");
    expect(text).toContain("Opcao 1");
    expect(text).toContain("Opcao 2");
    expect(text).toContain("Opcao 3");
  });

  it("deve conter pros e contras em cada opcao", async () => {
    const result = await client.callTool({
      name: "analyze_architecture",
      arguments: {
        problem: "Criar modulo de pagamentos",
        technology: "nestjs",
      },
    });

    const text = (result.content as Array<{ type: string; text: string }>)[0]
      .text;

    expect(text).toContain("Pros");
    expect(text).toContain("Contras");
    expect(text).toContain("Principios aplicados");
  });

  it("deve conter recomendacao com nome do desenvolvedor", async () => {
    const result = await client.callTool({
      name: "analyze_architecture",
      arguments: {
        problem: "Criar API de usuarios",
        technology: "laravel",
      },
    });

    const text = (result.content as Array<{ type: string; text: string }>)[0]
      .text;

    expect(text).toContain("Recomendacao");
    expect(text).toContain("recomendo a");
    expect(text).toContain("Proximos passos");
  });

  it("deve citar principios Clean Architecture e SOLID", async () => {
    const result = await client.callTool({
      name: "analyze_architecture",
      arguments: {
        problem: "Desenvolver modulo de relatorios",
        technology: "generic",
      },
    });

    const text = (result.content as Array<{ type: string; text: string }>)[0]
      .text;

    expect(text).toContain("Clean Architecture");
    expect(text).toContain("SRP");
    expect(text).toContain("DIP");
  });

  it("deve recomendar DDD para problemas complexos de dominio", async () => {
    const result = await client.callTool({
      name: "analyze_architecture",
      arguments: {
        problem: "Modelar dominio complexo de faturamento hospitalar",
        technology: "nestjs",
        context: "Dominio com muitas regras de negocio e eventos",
      },
    });

    const text = (result.content as Array<{ type: string; text: string }>)[0]
      .text;

    expect(text).toContain("Domain-Driven Design");
  });

  it("deve recomendar Service Layer para CRUDs simples", async () => {
    const result = await client.callTool({
      name: "analyze_architecture",
      arguments: {
        problem: "Criar CRUD simples de categorias",
        technology: "laravel",
      },
    });

    const text = (result.content as Array<{ type: string; text: string }>)[0]
      .text;

    expect(text).toContain("Service Layer");
  });

  it("deve incluir contexto adicional quando fornecido", async () => {
    const result = await client.callTool({
      name: "analyze_architecture",
      arguments: {
        problem: "Sistema de autenticacao",
        technology: "nestjs",
        context: "Equipe de 3 devs, prazo de 2 semanas",
      },
    });

    const text = (result.content as Array<{ type: string; text: string }>)[0]
      .text;

    expect(text).toContain("Equipe de 3 devs");
  });

  it("deve adaptar descricao para Laravel quando technology=laravel", async () => {
    const result = await client.callTool({
      name: "analyze_architecture",
      arguments: {
        problem: "API de pedidos",
        technology: "laravel",
      },
    });

    const text = (result.content as Array<{ type: string; text: string }>)[0]
      .text;

    expect(text).toContain("Laravel");
  });

  it("deve adaptar descricao para NestJS quando technology=nestjs", async () => {
    const result = await client.callTool({
      name: "analyze_architecture",
      arguments: {
        problem: "API de pedidos",
        technology: "nestjs",
      },
    });

    const text = (result.content as Array<{ type: string; text: string }>)[0]
      .text;

    expect(text).toContain("NestJS");
  });
});
