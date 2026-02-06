import { describe, it, expect, beforeEach } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createServer } from "../../src/server.js";

describe("tool tdd_guide", () => {
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
    const tool = tools.find((t) => t.name === "tdd_guide");

    expect(tool).toBeDefined();
    expect(tool!.description).toContain("TDD");
  });

  describe("fase Red", () => {
    it("deve gerar cenarios de teste para Laravel", async () => {
      const result = await client.callTool({
        name: "tdd_guide",
        arguments: {
          feature: "Criar pedido",
          phase: "red",
          technology: "laravel",
        },
      });

      const text = (result.content as Array<{ type: string; text: string }>)[0]
        .text;

      expect(text).toContain("RED");
      expect(text).toContain("Happy Path");
      expect(text).toContain("Edge Cases");
      expect(text).toContain("Error Cases");
      expect(text).toContain("Criar pedido");
    });

    it("deve gerar cenarios de teste para NestJS", async () => {
      const result = await client.callTool({
        name: "tdd_guide",
        arguments: {
          feature: "Registrar usuario",
          phase: "red",
          technology: "nestjs",
        },
      });

      const text = (result.content as Array<{ type: string; text: string }>)[0]
        .text;

      expect(text).toContain("RED");
      expect(text).toContain("expect(");
      expect(text).toContain("async");
    });

    it("deve incluir mensagem de gate para o desenvolvedor", async () => {
      const result = await client.callTool({
        name: "tdd_guide",
        arguments: {
          feature: "Enviar notificacao",
          phase: "red",
          technology: "laravel",
        },
      });

      const text = (result.content as Array<{ type: string; text: string }>)[0]
        .text;

      expect(text).toContain("analise os cenarios do teste");
      expect(text).toContain("fase Green");
    });

    it("deve incluir checklist da fase", async () => {
      const result = await client.callTool({
        name: "tdd_guide",
        arguments: {
          feature: "Gerar relatorio",
          phase: "red",
          technology: "nestjs",
        },
      });

      const text = (result.content as Array<{ type: string; text: string }>)[0]
        .text;

      expect(text).toContain("Checklist");
      expect(text).toContain("AAA");
    });
  });

  describe("fase Green", () => {
    it("deve sugerir implementacao minima", async () => {
      const result = await client.callTool({
        name: "tdd_guide",
        arguments: {
          feature: "Criar pedido",
          phase: "green",
          technology: "laravel",
        },
      });

      const text = (result.content as Array<{ type: string; text: string }>)[0]
        .text;

      expect(text).toContain("GREEN");
      expect(text).toContain("Make it work");
      expect(text).toContain("minimo");
    });

    it("deve incluir estrategias (Fake It, Triangulate)", async () => {
      const result = await client.callTool({
        name: "tdd_guide",
        arguments: {
          feature: "Calcular desconto",
          phase: "green",
          technology: "nestjs",
        },
      });

      const text = (result.content as Array<{ type: string; text: string }>)[0]
        .text;

      expect(text).toContain("Fake It");
      expect(text).toContain("Triangulate");
    });

    it("deve incluir codigo de teste quando fornecido", async () => {
      const testCode = `it('deve criar pedido', () => { expect(true).toBe(true); });`;

      const result = await client.callTool({
        name: "tdd_guide",
        arguments: {
          feature: "Criar pedido",
          phase: "green",
          technology: "nestjs",
          test_code: testCode,
        },
      });

      const text = (result.content as Array<{ type: string; text: string }>)[0]
        .text;

      expect(text).toContain("deve criar pedido");
    });
  });

  describe("fase Refactor", () => {
    it("deve analisar contra Clean Code e Object Calisthenics", async () => {
      const result = await client.callTool({
        name: "tdd_guide",
        arguments: {
          feature: "Criar pedido",
          phase: "refactor",
          technology: "laravel",
        },
      });

      const text = (result.content as Array<{ type: string; text: string }>)[0]
        .text;

      expect(text).toContain("REFACTOR");
      expect(text).toContain("Clean Code");
      expect(text).toContain("Object Calisthenics");
      expect(text).toContain("SOLID");
    });

    it("deve incluir checklist especifica do framework", async () => {
      const result = await client.callTool({
        name: "tdd_guide",
        arguments: {
          feature: "Registrar usuario",
          phase: "refactor",
          technology: "nestjs",
        },
      });

      const text = (result.content as Array<{ type: string; text: string }>)[0]
        .text;

      expect(text).toContain("NestJS");
      expect(text).toContain("DTOs");
      expect(text).toContain("class-validator");
    });

    it("deve incluir codigo quando fornecido", async () => {
      const code = `class OrderService { create() { return true; } }`;

      const result = await client.callTool({
        name: "tdd_guide",
        arguments: {
          feature: "Criar pedido",
          phase: "refactor",
          technology: "nestjs",
          code,
        },
      });

      const text = (result.content as Array<{ type: string; text: string }>)[0]
        .text;

      expect(text).toContain("OrderService");
    });
  });
});
