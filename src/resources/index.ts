import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { register as cleanCode } from "./clean-code.js";
import { register as cleanCodeSmells } from "./clean-code-smells.js";
import { register as solidPrinciples } from "./solid-principles.js";
import { register as cleanArchitecture } from "./clean-architecture.js";
import { register as objectCalisthenics } from "./object-calisthenics.js";
import { register as laravelConventions } from "./laravel-conventions.js";
import { register as nestjsPatterns } from "./nestjs-patterns.js";
import { register as tddReference } from "./tdd-reference.js";
import { register as vuePatterns } from "./vue-patterns.js";
import { register as reactPatterns } from "./react-patterns.js";

export function registerAllResources(server: McpServer): void {
  cleanCode(server);
  cleanCodeSmells(server);
  solidPrinciples(server);
  cleanArchitecture(server);
  objectCalisthenics(server);
  laravelConventions(server);
  nestjsPatterns(server);
  tddReference(server);
  vuePatterns(server);
  reactPatterns(server);
}
