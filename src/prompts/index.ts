import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { register as architectureDecision } from "./architecture-decision.js";
import { register as tddCycle } from "./tdd-cycle.js";
import { register as codeReviewBackend } from "./code-review-backend.js";
import { register as codeReviewFrontend } from "./code-review-frontend.js";
import { register as implementationPlan } from "./implementation-plan.js";
import { register as sqlAnalysis } from "./sql-analysis.js";
import { register as mentorMode } from "./mentor-mode.js";
import { register as task } from "./task.js";

export function registerAllPrompts(server: McpServer): void {
  architectureDecision(server);
  tddCycle(server);
  codeReviewBackend(server);
  codeReviewFrontend(server);
  implementationPlan(server);
  sqlAnalysis(server);
  mentorMode(server);
  task(server);
}
