import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { register as ping } from "./ping.js";
import { register as analyzeArchitecture } from "./analyze-architecture.js";

export function registerAllTools(server: McpServer): void {
  ping(server);
  analyzeArchitecture(server);
}
