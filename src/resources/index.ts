import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { register as cleanCode } from "./clean-code.js";
import { register as cleanArchitecture } from "./clean-architecture.js";
import { register as objectCalisthenics } from "./object-calisthenics.js";

export function registerAllResources(server: McpServer): void {
  cleanCode(server);
  cleanArchitecture(server);
  objectCalisthenics(server);
}
