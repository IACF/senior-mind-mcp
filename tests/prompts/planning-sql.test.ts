import { describe, it, expect, beforeEach } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createServer } from "../../src/server.js";

describe("Prompts - Planejamento e SQL", () => {
  let client: Client;

  beforeEach(async () => {
    const server = createServer();
    const [clientTransport, serverTransport] =
      InMemoryTransport.createLinkedPair();
    await server.connect(serverTransport);
    client = new Client({ name: "test-client", version: "1.0.0" });
    await client.connect(clientTransport);
  });

  describe("listagem", () => {
    it("deve listar os 2 prompts de planejamento e SQL", async () => {
      const { prompts } = await client.listPrompts();
      const names = prompts.map((p) => p.name);

      expect(names).toContain("implementation-plan");
      expect(names).toContain("sql-analysis");
    });
  });

  describe("implementation-plan", () => {
    it("deve gerar template com a feature fornecida", async () => {
      const result = await client.getPrompt({
        name: "implementation-plan",
        arguments: {
          feature: "Sistema de notificacoes push",
        },
      });

      const text = result.messages[0].content.text as string;

      expect(text).toContain("Sistema de notificacoes push");
      expect(text).toContain("Plano de Implementacao");
    });

    it("deve conter questionario de alinhamento", async () => {
      const result = await client.getPrompt({
        name: "implementation-plan",
        arguments: {
          feature: "CRUD de produtos",
        },
      });

      const text = result.messages[0].content.text as string;

      expect(text).toContain("Questionario de Alinhamento");
      expect(text).toContain("Regras de negocio");
      expect(text).toContain("Fluxo principal");
    });

    it("deve conter plano faseado com checklist", async () => {
      const result = await client.getPrompt({
        name: "implementation-plan",
        arguments: {
          feature: "Modulo de pagamentos",
        },
      });

      const text = result.messages[0].content.text as string;

      expect(text).toContain("Fase 1");
      expect(text).toContain("Fase 2");
      expect(text).toContain("Fase 3");
      expect(text).toContain("Fase 4");
      expect(text).toContain("Fase 5");
      expect(text).toContain("TDD");
    });

    it("deve incluir contexto quando fornecido", async () => {
      const result = await client.getPrompt({
        name: "implementation-plan",
        arguments: {
          feature: "API de relatorios",
          context: "Stack NestJS com PostgreSQL",
        },
      });

      const text = result.messages[0].content.text as string;

      expect(text).toContain("Stack NestJS com PostgreSQL");
    });

    it("deve conter ordem de execucao", async () => {
      const result = await client.getPrompt({
        name: "implementation-plan",
        arguments: {
          feature: "Dashboard",
        },
      });

      const text = result.messages[0].content.text as string;

      expect(text).toContain("Ordem de Execucao");
      expect(text).toContain("independente");
    });

    it("deve conter pergunta sobre IDE/agente de IA (Fase 7)", async () => {
      const result = await client.getPrompt({
        name: "implementation-plan",
        arguments: {
          feature: "API de metricas",
        },
      });

      const text = result.messages[0].content.text as string;

      expect(text).toMatch(/IDE|agente de IA|Cursor|Claude|Copilot/);
    });

    it("deve conter tabela Recomendacao de Agente por Fase (Fase 7)", async () => {
      const result = await client.getPrompt({
        name: "implementation-plan",
        arguments: {
          feature: "Modulo de auditoria",
        },
      });

      const text = result.messages[0].content.text as string;

      expect(text).toContain("Recomendacao de Agente por Fase");
      expect(text).toMatch(/\|\s*1\. Entidades\s*\|/);
      expect(text).toMatch(/\|\s*5\. Refinamentos\s*\|/);
    });

    it("deve incluir indicacao de agente (Avancado/Rapido) em cada fase (Fase 7)", async () => {
      const result = await client.getPrompt({
        name: "implementation-plan",
        arguments: {
          feature: "Sistema de logs",
        },
      });

      const text = result.messages[0].content.text as string;

      expect(text).toMatch(/Agente:\s*Avancado|Agente:\s*Rapido|Agente:\s*Misto/);
    });

    it("deve incluir team_context quando fornecido (Fase 7)", async () => {
      const result = await client.getPrompt({
        name: "implementation-plan",
        arguments: {
          feature: "Cache distribuido",
          team_context: "Equipe senior, 5 devs",
        },
      });

      const text = result.messages[0].content.text as string;

      expect(text).toContain("Equipe senior, 5 devs");
    });
  });

  describe("sql-analysis", () => {
    it("deve gerar template com a query fornecida", async () => {
      const result = await client.getPrompt({
        name: "sql-analysis",
        arguments: {
          query: "SELECT * FROM users WHERE email = 'test@test.com'",
        },
      });

      const text = result.messages[0].content.text as string;

      expect(text).toContain("SELECT * FROM users");
      expect(text).toContain("Analise de Query SQL");
    });

    it("deve conter secao EXPLAIN ANALYZE", async () => {
      const result = await client.getPrompt({
        name: "sql-analysis",
        arguments: {
          query: "SELECT u.*, o.total FROM users u JOIN orders o ON u.id = o.user_id",
        },
      });

      const text = result.messages[0].content.text as string;

      expect(text).toContain("EXPLAIN ANALYZE");
      expect(text).toContain("Seq Scan");
      expect(text).toContain("Index Scan");
    });

    it("deve conter secao de indices", async () => {
      const result = await client.getPrompt({
        name: "sql-analysis",
        arguments: {
          query: "SELECT * FROM orders WHERE status = 'pending'",
        },
      });

      const text = result.messages[0].content.text as string;

      expect(text).toContain("Indices");
      expect(text).toContain("Indices compostos");
    });

    it("deve conter secao N+1", async () => {
      const result = await client.getPrompt({
        name: "sql-analysis",
        arguments: {
          query: "SELECT * FROM orders",
        },
      });

      const text = result.messages[0].content.text as string;

      expect(text).toContain("N+1");
      expect(text).toContain("Eager loading");
    });

    it("deve conter secao JOINs vs subqueries", async () => {
      const result = await client.getPrompt({
        name: "sql-analysis",
        arguments: {
          query: "SELECT * FROM users WHERE id IN (SELECT user_id FROM orders)",
        },
      });

      const text = result.messages[0].content.text as string;

      expect(text).toContain("JOINs vs Subqueries");
      expect(text).toContain("EXISTS");
      expect(text).toContain("CTE");
    });

    it("deve incluir contexto quando fornecido", async () => {
      const result = await client.getPrompt({
        name: "sql-analysis",
        arguments: {
          query: "SELECT COUNT(*) FROM logs",
          context: "PostgreSQL 15, tabela com 50 milhoes de registros",
        },
      });

      const text = result.messages[0].content.text as string;

      expect(text).toContain("50 milhoes");
    });
  });
});
