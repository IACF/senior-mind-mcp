import { describe, it, expect, beforeEach } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createServer } from "../../src/server.js";

describe("tool explain_principle", () => {
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
    const tool = tools.find((t) => t.name === "explain_principle");
    expect(tool).toBeDefined();
    expect(tool!.description).toMatch(/principio|dicionario|explica/i);
  });

  it("deve retornar explicacao para SRP", async () => {
    const result = await client.callTool({
      name: "explain_principle",
      arguments: {
        principle: "srp",
        language: "typescript",
      },
    });
    const text = (result.content as Array<{ type: string; text: string }>)[0]
      .text;
    expect(text).toMatch(/SRP|Single Responsibility|responsabilidade unica/i);
    expect(text).toMatch(/exemplo|Exemplo|contra-exemplo|Contra/i);
  });

  it("deve retornar explicacao para DIP", async () => {
    const result = await client.callTool({
      name: "explain_principle",
      arguments: {
        principle: "dip",
        language: "php",
      },
    });
    const text = (result.content as Array<{ type: string; text: string }>)[0]
      .text;
    expect(text).toMatch(/DIP|Dependency Inversion|abstracoes|depender/i);
  });

  it("deve incluir contexto quando fornecido", async () => {
    const result = await client.callTool({
      name: "explain_principle",
      arguments: {
        principle: "dry",
        language: "typescript",
        context: "Validacao de formulario em React",
      },
    });
    const text = (result.content as Array<{ type: string; text: string }>)[0]
      .text;
    expect(text).toMatch(/DRY|Don't Repeat|repeticao/i);
    expect(text).toMatch(/formulario|React|contexto/i);
  });

  it("deve retornar explicacao para principio demeter ou tell-dont-ask", async () => {
    const result = await client.callTool({
      name: "explain_principle",
      arguments: {
        principle: "demeter",
        language: "typescript",
      },
    });
    const text = (result.content as Array<{ type: string; text: string }>)[0]
      .text;
    expect(text).toMatch(/Demeter|conhecimento|encadeamento|ponto/i);
  });

  it("deve listar principios disponiveis quando principio desconhecido", async () => {
    const result = await client.callTool({
      name: "explain_principle",
      arguments: {
        principle: "principio_inexistente_xyz",
        language: "typescript",
      },
    });
    const text = (result.content as Array<{ type: string; text: string }>)[0]
      .text;
    expect(text).toMatch(/disponiveis|srp|ocp|dry|kiss|yagni/i);
  });
});
