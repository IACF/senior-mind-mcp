import { describe, it, expect, beforeEach } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createServer } from "../../src/server.js";

describe("Prompts - Mentor Mode", () => {
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
    it("deve listar o prompt mentor-mode", async () => {
      const { prompts } = await client.listPrompts();
      const names = prompts.map((p) => p.name);

      expect(names).toContain("mentor-mode");
    });
  });

  describe("mentor-mode", () => {
    it("deve ter descricao correta", async () => {
      const { prompts } = await client.listPrompts();
      const prompt = prompts.find((p) => p.name === "mentor-mode");

      expect(prompt).toBeDefined();
      expect(prompt!.description).toContain("checkpoints");
      expect(prompt!.description).toMatch(/Clean Architecture|TDD/i);
    });

    it("deve gerar template com feature e technology", async () => {
      const result = await client.getPrompt({
        name: "mentor-mode",
        arguments: {
          feature: "CRUD de pedidos",
          technology: "laravel",
        },
      });

      expect(result.messages).toHaveLength(1);
      const text = (result.messages[0].content as { text: string }).text;

      expect(text).toContain("CRUD de pedidos");
      expect(text).toContain("laravel");
    });

    it("deve conter os 5 checkpoints", async () => {
      const result = await client.getPrompt({
        name: "mentor-mode",
        arguments: {
          feature: "Autenticacao JWT",
          technology: "nestjs",
        },
      });

      const text = (result.messages[0].content as { text: string }).text;

      expect(text).toContain("Checkpoint 1");
      expect(text).toContain("Checkpoint 2");
      expect(text).toContain("Checkpoint 3");
      expect(text).toContain("Checkpoint 4");
      expect(text).toContain("Checkpoint 5");
    });

    it("deve conter conteudo do Checkpoint 1 (Clean Architecture)", async () => {
      const result = await client.getPrompt({
        name: "mentor-mode",
        arguments: {
          feature: "Enviar notificacoes",
          technology: "generic",
        },
      });

      const text = (result.messages[0].content as { text: string }).text;

      expect(text).toContain("Entity");
      expect(text).toContain("Use Case");
      expect(text).toContain("Adapter");
      expect(text).toContain("Regra de Dependencia");
      expect(text).toContain("DIP");
    });

    it("deve conter conteudo do Checkpoint 2 (Clean Code)", async () => {
      const result = await client.getPrompt({
        name: "mentor-mode",
        arguments: {
          feature: "Calcular frete",
          technology: "laravel",
        },
      });

      const text = (result.messages[0].content as { text: string }).text;

      expect(text).toContain("DRY");
      expect(text).toContain("KISS");
      expect(text).toContain("YAGNI");
      expect(text).toContain("code smells");
    });

    it("deve conter conteudo do Checkpoint 3 (SOLID)", async () => {
      const result = await client.getPrompt({
        name: "mentor-mode",
        arguments: {
          feature: "Relatorio de vendas",
          technology: "nestjs",
        },
      });

      const text = (result.messages[0].content as { text: string }).text;

      expect(text).toContain("SRP");
      expect(text).toContain("OCP");
      expect(text).toContain("DTOs");
      expect(text).toContain("SOLID");
    });

    it("deve conter conteudo do Checkpoint 4 (TDD)", async () => {
      const result = await client.getPrompt({
        name: "mentor-mode",
        arguments: {
          feature: "Webhook de pagamento",
          technology: "generic",
        },
      });

      const text = (result.messages[0].content as { text: string }).text;

      expect(text).toContain("happy path");
      expect(text).toContain("Red-Green-Refactor");
      expect(text).toContain("Fake It");
      expect(text).toContain("Triangulation");
    });

    it("deve conter Checkpoint 5 (Implementacao Guiada)", async () => {
      const result = await client.getPrompt({
        name: "mentor-mode",
        arguments: {
          feature: "Exportar PDF",
          technology: "laravel",
        },
      });

      const text = (result.messages[0].content as { text: string }).text;

      expect(text).toContain("aprovacao");
      expect(text).toContain("Object Calisthenics");
    });

    describe("variacao por complexidade", () => {
      it("complexidade low: nao deve incluir diagrama no Checkpoint 1", async () => {
        const result = await client.getPrompt({
          name: "mentor-mode",
          arguments: {
            feature: "Listar categorias",
            technology: "nestjs",
            complexity: "low",
          },
        });

        const text = (result.messages[0].content as { text: string }).text;

        expect(text).toContain("Complexidade**: low");
        expect(text).not.toContain("diagrama de camadas");
      });

      it("complexidade medium: deve incluir diagrama no Checkpoint 1", async () => {
        const result = await client.getPrompt({
          name: "mentor-mode",
          arguments: {
            feature: "Checkout completo",
            technology: "laravel",
            complexity: "medium",
          },
        });

        const text = (result.messages[0].content as { text: string }).text;

        expect(text).toContain("Complexidade**: medium");
        expect(text).toContain("diagrama de camadas");
      });

      it("complexidade high: deve incluir ADR e trade-offs", async () => {
        const result = await client.getPrompt({
          name: "mentor-mode",
          arguments: {
            feature: "Sistema de eventos assincronos",
            technology: "generic",
            complexity: "high",
          },
        });

        const text = (result.messages[0].content as { text: string }).text;

        expect(text).toContain("Complexidade**: high");
        expect(text).toContain("ADR");
        expect(text).toContain("Architecture Decision Record");
        expect(text).toContain("Trade-offs");
      });

      it("sem complexity deve default para medium", async () => {
        const result = await client.getPrompt({
          name: "mentor-mode",
          arguments: {
            feature: "Login social",
            technology: "nestjs",
          },
        });

        const text = (result.messages[0].content as { text: string }).text;

        expect(text).toContain("Complexidade**: medium");
      });
    });

    describe("variacao por tecnologia", () => {
      it("deve aceitar technology laravel", async () => {
        const result = await client.getPrompt({
          name: "mentor-mode",
          arguments: {
            feature: "API de produtos",
            technology: "laravel",
          },
        });

        const text = (result.messages[0].content as { text: string }).text;
        expect(text).toContain("laravel");
      });

      it("deve aceitar technology nestjs", async () => {
        const result = await client.getPrompt({
          name: "mentor-mode",
          arguments: {
            feature: "API de produtos",
            technology: "nestjs",
          },
        });

        const text = (result.messages[0].content as { text: string }).text;
        expect(text).toContain("nestjs");
      });

      it("deve aceitar technology generic", async () => {
        const result = await client.getPrompt({
          name: "mentor-mode",
          arguments: {
            feature: "API de produtos",
            technology: "generic",
          },
        });

        const text = (result.messages[0].content as { text: string }).text;
        expect(text).toContain("generic");
      });
    });
  });
});
