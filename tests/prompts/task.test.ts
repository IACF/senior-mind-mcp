import { describe, it, expect, beforeEach } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createServer } from "../../src/server.js";

describe("Prompts - Task Workflow", () => {
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
    it("deve listar o prompt task", async () => {
      const { prompts } = await client.listPrompts();
      const names = prompts.map((p) => p.name);

      expect(names).toContain("task");
    });

    it("deve ter descricao correta", async () => {
      const { prompts } = await client.listPrompts();
      const prompt = prompts.find((p) => p.name === "task");

      expect(prompt).toBeDefined();
      expect(prompt!.description).toContain("Task Workflow");
    });
  });

  describe("MODO A — nova tarefa", () => {
    it("deve conter ETAPA 0 com coleta de comandos", async () => {
      const result = await client.getPrompt({
        name: "task",
        arguments: { input: "Implementar login com JWT" },
      });

      const text = (result.messages[0].content as { text: string }).text;

      expect(text).toContain("ETAPA 0");
    });

    it("deve mencionar create_task_brief", async () => {
      const result = await client.getPrompt({
        name: "task",
        arguments: { input: "Implementar login com JWT" },
      });

      const text = (result.messages[0].content as { text: string }).text;

      expect(text).toContain("create_task_brief");
    });

    it("deve instruir a parar e aguardar revisao do dev", async () => {
      const result = await client.getPrompt({
        name: "task",
        arguments: { input: "Implementar login com JWT" },
      });

      const text = (result.messages[0].content as { text: string }).text;

      expect(text).toContain("PARAR");
    });

    it("deve mencionar salvamento do brief em .senior-mind/", async () => {
      const result = await client.getPrompt({
        name: "task",
        arguments: { input: "Criar modulo de notificacoes" },
      });

      const text = (result.messages[0].content as { text: string }).text;

      expect(text).toContain(".senior-mind/");
    });

    it("deve mencionar create_task_plan na ETAPA 2", async () => {
      const result = await client.getPrompt({
        name: "task",
        arguments: { input: "Refatorar servico de pagamentos" },
      });

      const text = (result.messages[0].content as { text: string }).text;

      expect(text).toContain("create_task_plan");
    });
  });

  describe("MODO B — continuar tarefa existente", () => {
    it("input 'fase 2' deve acionar MODO B com busca por plan.json", async () => {
      const result = await client.getPrompt({
        name: "task",
        arguments: { input: "fase 2" },
      });

      const text = (result.messages[0].content as { text: string }).text;

      expect(text).toContain("plan.json");
    });

    it("input 'todas as fases' deve acionar MODO B", async () => {
      const result = await client.getPrompt({
        name: "task",
        arguments: { input: "todas as fases" },
      });

      const text = (result.messages[0].content as { text: string }).text;

      expect(text).toContain("plan.json");
    });

    it("input 'fase 2 e 3' deve acionar MODO B", async () => {
      const result = await client.getPrompt({
        name: "task",
        arguments: { input: "fase 2 e 3" },
      });

      const text = (result.messages[0].content as { text: string }).text;

      expect(text).toContain("plan.json");
    });

    it("MODO B deve referenciar TASK-WORKFLOW", async () => {
      const result = await client.getPrompt({
        name: "task",
        arguments: { input: "fase 1" },
      });

      const text = (result.messages[0].content as { text: string }).text;

      expect(text).toContain("TASK-WORKFLOW");
    });

    it("MODO B deve instruir a listar planos quando multiplos encontrados", async () => {
      const result = await client.getPrompt({
        name: "task",
        arguments: { input: "fase 3" },
      });

      const text = (result.messages[0].content as { text: string }).text;

      expect(text).toContain("Mais de um");
    });
  });
});
