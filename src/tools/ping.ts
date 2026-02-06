import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { config } from "../config.js";

export function register(server: McpServer): void {
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
}
