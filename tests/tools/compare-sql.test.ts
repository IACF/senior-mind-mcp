import { describe, it, expect, beforeEach } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createServer } from "../../src/server.js";

describe("tool compare_sql", () => {
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
    const tool = tools.find((t) => t.name === "compare_sql");

    expect(tool).toBeDefined();
    expect(tool!.description).toContain("ORM vs SQL");
  });

  it("deve gerar versao ORM e SQL puro para Laravel Eloquent", async () => {
    const result = await client.callTool({
      name: "compare_sql",
      arguments: {
        description: "Listar pedidos com dados do cliente (join)",
        technology: "laravel-eloquent",
      },
    });

    const text = (result.content as Array<{ type: string; text: string }>)[0]
      .text;

    expect(text).toContain("Versao ORM");
    expect(text).toContain("Versao SQL Puro");
    expect(text).toContain("Laravel Eloquent");
    expect(text).toContain("JOIN");
  });

  it("deve gerar versao ORM e SQL puro para TypeORM", async () => {
    const result = await client.callTool({
      name: "compare_sql",
      arguments: {
        description: "Listar pedidos com relacoes do cliente",
        technology: "typeorm",
      },
    });

    const text = (result.content as Array<{ type: string; text: string }>)[0]
      .text;

    expect(text).toContain("TypeORM");
    expect(text).toContain("Versao ORM");
    expect(text).toContain("Versao SQL Puro");
  });

  it("deve gerar versao ORM e SQL puro para Prisma", async () => {
    const result = await client.callTool({
      name: "compare_sql",
      arguments: {
        description: "Buscar pedidos com relacoes de cliente e itens",
        technology: "prisma",
      },
    });

    const text = (result.content as Array<{ type: string; text: string }>)[0]
      .text;

    expect(text).toContain("Prisma");
    expect(text).toContain("include");
  });

  it("deve incluir analise de performance com N+1", async () => {
    const result = await client.callTool({
      name: "compare_sql",
      arguments: {
        description: "Listar pedidos com dados do cliente (join relacional)",
        technology: "laravel-eloquent",
      },
    });

    const text = (result.content as Array<{ type: string; text: string }>)[0]
      .text;

    expect(text).toContain("N+1");
    expect(text).toContain("Analise de Performance");
  });

  it("deve incluir recomendacao com nome do desenvolvedor", async () => {
    const result = await client.callTool({
      name: "compare_sql",
      arguments: {
        description: "Buscar usuario por email",
        technology: "prisma",
      },
    });

    const text = (result.content as Array<{ type: string; text: string }>)[0]
      .text;

    expect(text).toContain("Recomendacao");
    expect(text).toContain("recomendo");
  });

  it("deve recomendar SQL puro para queries com agregacao complexa", async () => {
    const result = await client.callTool({
      name: "compare_sql",
      arguments: {
        description:
          "Agregacao de vendas por mes com subquery de ranking",
        technology: "typeorm",
      },
    });

    const text = (result.content as Array<{ type: string; text: string }>)[0]
      .text;

    expect(text).toContain("SQL puro");
  });

  it("deve recomendar ORM para queries simples", async () => {
    const result = await client.callTool({
      name: "compare_sql",
      arguments: {
        description: "Buscar usuario por ID",
        technology: "prisma",
      },
    });

    const text = (result.content as Array<{ type: string; text: string }>)[0]
      .text;

    expect(text).toContain("ORM");
  });

  it("deve incluir contexto quando fornecido", async () => {
    const result = await client.callTool({
      name: "compare_sql",
      arguments: {
        description: "Listar pedidos recentes",
        technology: "laravel-eloquent",
        context: "Tabela com 5 milhoes de registros, indice em created_at",
      },
    });

    const text = (result.content as Array<{ type: string; text: string }>)[0]
      .text;

    expect(text).toContain("5 milhoes");
  });

  it("deve mencionar indices e EXPLAIN ANALYZE", async () => {
    const result = await client.callTool({
      name: "compare_sql",
      arguments: {
        description: "Buscar pedidos por status",
        technology: "typeorm",
      },
    });

    const text = (result.content as Array<{ type: string; text: string }>)[0]
      .text;

    expect(text).toContain("Indices");
    expect(text).toContain("EXPLAIN ANALYZE");
  });
});
