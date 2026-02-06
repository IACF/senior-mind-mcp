import { describe, it, expect, beforeEach } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { register } from "../../src/tools/ping.js";

describe("tool ping (modulo isolado)", () => {
  let client: Client;

  beforeEach(async () => {
    const server = new McpServer({
      name: "test-server",
      version: "1.0.0",
    });

    register(server);

    const [clientTransport, serverTransport] =
      InMemoryTransport.createLinkedPair();

    await server.connect(serverTransport);

    client = new Client({ name: "test-client", version: "1.0.0" });
    await client.connect(clientTransport);
  });

  it("deve registrar a tool ping no servidor", async () => {
    const { tools } = await client.listTools();
    const pingTool = tools.find((t) => t.name === "ping");

    expect(pingTool).toBeDefined();
  });

  it("deve retornar conteudo do tipo text", async () => {
    const result = await client.callTool({ name: "ping", arguments: {} });

    const content = result.content as Array<{ type: string; text: string }>;
    expect(content).toHaveLength(1);
    expect(content[0].type).toBe("text");
  });

  it("deve conter a mensagem pong com nome do desenvolvedor", async () => {
    const result = await client.callTool({ name: "ping", arguments: {} });

    const content = result.content as Array<{ type: string; text: string }>;
    expect(content[0].text).toMatch(/pong - Senior Mind MCP ativo! Ola, .+!/);
  });
});
