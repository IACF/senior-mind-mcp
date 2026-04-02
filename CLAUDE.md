# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this project is

An MCP (Model Context Protocol) server that acts as a senior developer copilot. It exposes **Tools** (actions the AI agent calls), **Resources** (passive knowledge base), and **Prompts** (structured templates invoked by users) to guide AI agents with Clean Code, Clean Architecture, SOLID, Object Calisthenics, and TDD practices.

## Commands

```bash
# Development (hot reload)
npm run dev              # tsx watch src/index.ts

# Build for production
npm run build            # tsc → dist/

# Tests
npm test                 # vitest (watch mode)
npm run test:run         # vitest run (single pass)

# With Docker
docker compose up -d                          # start app + MCP Inspector at http://localhost:6274
docker compose exec app npm test              # run tests inside container
docker compose run --rm app npx tsc          # compile inside container
```

## Architecture

The server uses a modular `register(server)` pattern. `src/server.ts` creates the `McpServer` and delegates to three registrars:

```
src/
├── index.ts          # Entry point: StdioServerTransport + createServer()
├── server.ts         # createServer(): calls registerAllTools/Prompts/Resources
├── config.ts         # DEVELOPER_NAME from .env (defaults to "Desenvolvedor")
├── tools/
│   └── index.ts      # registerAllTools(server) — imports each tool's register()
├── resources/
│   └── index.ts      # registerAllResources(server)
└── prompts/
    └── index.ts      # registerAllPrompts(server)
```

Each component file exports a single `register(server: McpServer): void` function. Tests use `InMemoryTransport.createLinkedPair()` to spin up a real MCP client/server pair without network I/O.

## Adding a new component

**Tool** — create `src/tools/kebab-name.ts`, export `register(server)`, add to `src/tools/index.ts`, create `tests/tools/kebab-name.test.ts`.

**Resource** — same pattern under `src/resources/` and `tests/resources/`. URI format: `senior-mind://references/name`.

**Prompt** — same pattern under `src/prompts/` and `tests/prompts/`.

### Naming conventions

| Context | Convention | Example |
|---------|------------|---------|
| File names | kebab-case | `detect-code-smells.ts` |
| Tool names | snake_case | `detect_code_smells` |
| Resource/prompt names | kebab-case | `clean-architecture` |
| Resource URIs | `senior-mind://references/<name>` | `senior-mind://references/clean-code` |

## Test pattern

```typescript
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createServer } from "../../src/server.js";

beforeEach(async () => {
  const server = createServer();
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await server.connect(serverTransport);
  client = new Client({ name: "test-client", version: "1.0.0" });
  await client.connect(clientTransport);
});
```

Tests call `client.callTool()`, `client.readResource()`, or `client.getPrompt()` and assert on the returned content text.

## TypeScript notes

- Module system: `"module": "NodeNext"` — all internal imports must use `.js` extension (e.g. `import { config } from "../config.js"`).
- `strict: true` is enabled.
- `src/` compiles to `dist/`; production entry is `dist/index.js`.

## Workflow rules (from .cursor/rules/)

These rules apply when working on any feature in this repo:

1. **Ask complexity first**: Before implementing, ask the user: "Esta tarefa é complexa, mediana ou simples?" The user always classifies — never infer it.
2. **TDD + Mentor Mode**:
   - If **complex or medium**: run MCP prompt `mentor-mode` first (5 checkpoints), then strict Red→Green→Refactor using tool `tdd_guide`.
   - If **simple**: optional — ask if user wants TDD anyway.
3. **Use Senior Mind MCP tools** for architecture analysis, code review, refactoring suggestions, and implementation planning instead of relying only on chat context.

## .senior-mind/ workflows for Claude Code

Since Claude Code does not support Cursor skills natively, the `.senior-mind/workflows/` directory contains markdown workflows to paste at the start of a conversation:

- `CONDITIONAL-TDD-WORKFLOW.md` — for implementation tasks
- `CONDITIONAL-PLANNING.md` — for planning tasks (use in Plan mode)
- `code-review-workflow.md`, `architecture-workflow.md`, `sql-workflow.md` — optional, context-specific

## Replicating patterns to other projects

```bash
./copy-senior-mind-patterns.sh /path/to/target-project
```

Copies `.cursor/rules`, `.cursor/skills`, `.cursor/agents`, and `.senior-mind/` to the target project.
