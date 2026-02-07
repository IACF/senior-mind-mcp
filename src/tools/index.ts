import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { register as ping } from "./ping.js";
import { register as analyzeArchitecture } from "./analyze-architecture.js";
import { register as reviewCode } from "./review-code.js";
import { register as suggestRefactoring } from "./suggest-refactoring.js";
import { register as tddGuide } from "./tdd-guide.js";
import { register as compareSql } from "./compare-sql.js";
import { register as planImplementation } from "./plan-implementation.js";
import { register as detectCodeSmells } from "./detect-code-smells.js";
import { register as validateArchitecture } from "./validate-architecture.js";
import { register as explainPrinciple } from "./explain-principle.js";

export function registerAllTools(server: McpServer): void {
  ping(server);
  analyzeArchitecture(server);
  reviewCode(server);
  suggestRefactoring(server);
  tddGuide(server);
  compareSql(server);
  planImplementation(server);
  detectCodeSmells(server);
  validateArchitecture(server);
  explainPrinciple(server);
}
