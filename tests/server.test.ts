import { describe, it, expect, vi, beforeEach } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createServer } from "../src/server.js";

describe("MCP Server", () => {
  let client: Client;

  beforeEach(async () => {
    const server = createServer();

    const [clientTransport, serverTransport] =
      InMemoryTransport.createLinkedPair();

    await server.connect(serverTransport);

    client = new Client({ name: "test-client", version: "1.0.0" });
    await client.connect(clientTransport);
  });

  describe("tool ping", () => {
    it("deve estar listada nas tools disponiveis", async () => {
      const { tools } = await client.listTools();
      const pingTool = tools.find((t) => t.name === "ping");

      expect(pingTool).toBeDefined();
      expect(pingTool!.description).toBe(
        "Testa a conexao com o Senior Mind MCP"
      );
    });

    it("deve retornar pong com o nome do desenvolvedor", async () => {
      const result = await client.callTool({ name: "ping", arguments: {} });

      expect(result.content).toEqual([
        {
          type: "text",
          text: expect.stringContaining("pong - Senior Mind MCP ativo!"),
        },
      ]);
    });

    it("deve incluir o nome do config na resposta", async () => {
      const result = await client.callTool({ name: "ping", arguments: {} });

      const textContent = result.content as Array<{ type: string; text: string }>;
      expect(textContent[0].text).toContain("Ola,");
    });
  });
});
