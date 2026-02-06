import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { register as ping } from "./ping.js";
import { register as analyzeArchitecture } from "./analyze-architecture.js";
import { register as reviewCode } from "./review-code.js";
import { register as suggestRefactoring } from "./suggest-refactoring.js";

export function registerAllTools(server: McpServer): void {
  ping(server);
  analyzeArchitecture(server);
  reviewCode(server);
  suggestRefactoring(server);
}
