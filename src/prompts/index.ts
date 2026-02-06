import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { register as architectureDecision } from "./architecture-decision.js";
import { register as tddCycle } from "./tdd-cycle.js";

export function registerAllPrompts(server: McpServer): void {
  architectureDecision(server);
  tddCycle(server);
}
