import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { config } from "./config.js";

export function createServer(): McpServer {
  const server = new McpServer({
    name: "senior-mind",
    version: "1.0.0",
  });

  server.tool(
    "ping",
    "Testa a conexao com o Senior Mind MCP",
    {},
    async () => ({
      content: [
        {
          type: "text",
          text: `pong - Senior Mind MCP ativo! Ola, ${config.developerName}!`,
        },
      ],
    })
  );

  return server;
}
