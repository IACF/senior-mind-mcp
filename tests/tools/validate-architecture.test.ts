import { describe, it, expect, beforeEach } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createServer } from "../../src/server.js";

describe("tool validate_architecture", () => {
  let client: Client;

  beforeEach(async () => {
    const server = createServer();
    const [clientTransport, serverTransport] =
      InMemoryTransport.createLinkedPair();
    await server.connect(serverTransport);
    client = new Client({ name: "test-client", version: "1.0.0" });
    await client.connect(clientTransport);
  });

  it("deve estar listada nas tools disponiveis", async () => {
    const { tools } = await client.listTools();
    const tool = tools.find((t) => t.name === "validate_architecture");
    expect(tool).toBeDefined();
    expect(tool!.description).toMatch(/arquitetura|conformidade|Clean/i);
  });

  it("deve aceitar structure, technology e layer", async () => {
    const result = await client.callTool({
      name: "validate_architecture",
      arguments: {
        structure:
          "src/domain/User.ts\nimport { User } from './domain/User';\nsrc/application/CreateUser.ts",
        technology: "nestjs",
        layer: "entity",
      },
    });
    expect(result.content).toBeDefined();
    const text = (result.content as Array<{ type: string; text: string }>)[0]
      .text;
    expect(text.length).toBeGreaterThan(0);
  });

  it("deve retornar conformidade e sugestoes", async () => {
    const result = await client.callTool({
      name: "validate_architecture",
      arguments: {
        structure: `src/domain/User.ts
export class User {}
src/application/CreateUser.ts
import { User } from '../domain/User';
export class CreateUser {}`,
        technology: "generic",
        layer: "use-case",
      },
    });
    const text = (result.content as Array<{ type: string; text: string }>)[0]
      .text;
    expect(text).toMatch(/Conformidade|conformidade|Conforme/i);
    expect(text).toMatch(/Sugest|sugest|recomendac/i);
  });

  it("deve detectar import invalido quando entity importa de use-case", async () => {
    const result = await client.callTool({
      name: "validate_architecture",
      arguments: {
        structure: `src/domain/User.ts
import { CreateUser } from '../application/CreateUser';
export class User { id: string; }`,
        technology: "nestjs",
        layer: "entity",
      },
    });
    const text = (result.content as Array<{ type: string; text: string }>)[0]
      .text;
    expect(text).toMatch(/invalido|viola|nao deve|entity.*use-case|regra de dependencia/i);
  });

  it("deve considerar valido use-case importando entity", async () => {
    const result = await client.callTool({
      name: "validate_architecture",
      arguments: {
        structure: `src/application/CreateUser.ts
import { User } from '../domain/User';
export class CreateUser { execute() {} }`,
        technology: "generic",
        layer: "use-case",
      },
    });
    const text = (result.content as Array<{ type: string; text: string }>)[0]
      .text;
    expect(text).toMatch(/Conforme|valido|ok|nenhum import invalido/i);
  });

  it("deve incluir estrutura de pastas sugerida para a tecnologia", async () => {
    const result = await client.callTool({
      name: "validate_architecture",
      arguments: {
        structure: "app/Models/User.php",
        technology: "laravel",
        layer: "entity",
      },
    });
    const text = (result.content as Array<{ type: string; text: string }>)[0]
      .text;
    expect(text).toMatch(/laravel|Laravel|estrutura|pasta|pastas/i);
  });
});
