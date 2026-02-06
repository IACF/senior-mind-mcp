import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { register as ping } from "./ping.js";

export function registerAllTools(server: McpServer): void {
  ping(server);
}
