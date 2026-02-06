import { describe, it, expect, beforeEach } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createServer } from "../../src/server.js";

describe("Prompts - Arquitetura e TDD", () => {
  let client: Client;

  beforeEach(async () => {
    const server = createServer();
    const [clientTransport, serverTransport] =
      InMemoryTransport.createLinkedPair();
    await server.connect(serverTransport);
    client = new Client({ name: "test-client", version: "1.0.0" });
    await client.connect(clientTransport);
  });

  describe("listagem de prompts", () => {
    it("deve listar os 2 prompts de arquitetura e TDD", async () => {
      const { prompts } = await client.listPrompts();
      const names = prompts.map((p) => p.name);

      expect(names).toContain("architecture-decision");
      expect(names).toContain("tdd-cycle");
    });
  });

  describe("architecture-decision", () => {
    it("deve ter descricao correta", async () => {
      const { prompts } = await client.listPrompts();
      const prompt = prompts.find((p) => p.name === "architecture-decision");

      expect(prompt).toBeDefined();
      expect(prompt!.description).toContain("ADR");
    });

    it("deve gerar template ADR com o problema fornecido", async () => {
      const result = await client.getPrompt({
        name: "architecture-decision",
        arguments: {
          problem: "Escolha entre monolito e microservicos",
        },
      });

      expect(result.messages).toHaveLength(1);
      const text = result.messages[0].content.text as string;

      expect(text).toContain("Escolha entre monolito e microservicos");
    });

    it("deve conter secoes ADR obrigatorias", async () => {
      const result = await client.getPrompt({
        name: "architecture-decision",
        arguments: {
          problem: "Definir estrategia de cache",
        },
      });

      const text = result.messages[0].content.text as string;

      expect(text).toContain("Contexto");
      expect(text).toContain("Decisao");
      expect(text).toContain("Consequencias");
      expect(text).toContain("Alternativas Consideradas");
    });

    it("deve incluir restricoes quando fornecidas", async () => {
      const result = await client.getPrompt({
        name: "architecture-decision",
        arguments: {
          problem: "Escolha de banco de dados",
          constraints: "Budget limitado, equipe de 2 devs",
        },
      });

      const text = result.messages[0].content.text as string;

      expect(text).toContain("Budget limitado");
    });

    it("deve conter referencias a Clean Architecture e SOLID", async () => {
      const result = await client.getPrompt({
        name: "architecture-decision",
        arguments: {
          problem: "Definir camadas da aplicacao",
        },
      });

      const text = result.messages[0].content.text as string;

      expect(text).toContain("Clean Architecture");
      expect(text).toContain("SOLID");
    });
  });

  describe("tdd-cycle", () => {
    it("deve ter descricao correta", async () => {
      const { prompts } = await client.listPrompts();
      const prompt = prompts.find((p) => p.name === "tdd-cycle");

      expect(prompt).toBeDefined();
      expect(prompt!.description).toContain("TDD");
    });

    it("deve gerar template com a feature fornecida", async () => {
      const result = await client.getPrompt({
        name: "tdd-cycle",
        arguments: {
          feature: "Criar sistema de autenticacao",
          technology: "nestjs",
        },
      });

      expect(result.messages).toHaveLength(1);
      const text = result.messages[0].content.text as string;

      expect(text).toContain("Criar sistema de autenticacao");
      expect(text).toContain("nestjs");
    });

    it("deve conter as 3 fases do TDD", async () => {
      const result = await client.getPrompt({
        name: "tdd-cycle",
        arguments: {
          feature: "CRUD de produtos",
          technology: "laravel",
        },
      });

      const text = result.messages[0].content.text as string;

      expect(text).toContain("RED");
      expect(text).toContain("GREEN");
      expect(text).toContain("REFACTOR");
    });

    it("deve incluir checklists em cada fase", async () => {
      const result = await client.getPrompt({
        name: "tdd-cycle",
        arguments: {
          feature: "Enviar notificacoes",
          technology: "nestjs",
        },
      });

      const text = result.messages[0].content.text as string;

      expect(text).toContain("Checklist");
      expect(text).toContain("AAA");
      expect(text).toContain("Clean Code");
      expect(text).toContain("Object Calisthenics");
      expect(text).toContain("SOLID");
    });

    it("deve incluir estrategias de implementacao", async () => {
      const result = await client.getPrompt({
        name: "tdd-cycle",
        arguments: {
          feature: "Calcular frete",
          technology: "laravel",
        },
      });

      const text = result.messages[0].content.text as string;

      expect(text).toContain("Fake It");
      expect(text).toContain("Triangulation");
    });

    it("deve conter instrucao de proximo ciclo", async () => {
      const result = await client.getPrompt({
        name: "tdd-cycle",
        arguments: {
          feature: "Gerar relatorio",
          technology: "nestjs",
        },
      });

      const text = result.messages[0].content.text as string;

      expect(text).toContain("Proximo Ciclo");
      expect(text).toContain("Volte para a Fase RED");
    });
  });
});
