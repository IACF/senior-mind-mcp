import { describe, it, expect, beforeEach } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createServer } from "../../src/server.js";

describe("tool detect_code_smells", () => {
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
    const tool = tools.find((t) => t.name === "detect_code_smells");
    expect(tool).toBeDefined();
    expect(tool!.description).toMatch(/smell|odor/i);
  });

  it("deve aceitar code, language e category", async () => {
    const result = await client.callTool({
      name: "detect_code_smells",
      arguments: {
        code: "const x = 1;",
        language: "typescript",
        category: "all",
      },
    });
    expect(result.content).toBeDefined();
    const text = (result.content as Array<{ type: string; text: string }>)[0]
      .text;
    expect(text.length).toBeGreaterThan(0);
  });

  it("deve detectar magic numbers na categoria general ou all", async () => {
    const result = await client.callTool({
      name: "detect_code_smells",
      arguments: {
        code: "const timeout = 5000;\nconst retries = 3;",
        language: "typescript",
        category: "general",
      },
    });
    const text = (result.content as Array<{ type: string; text: string }>)[0]
      .text;
    expect(text).toMatch(/magic|5000|3|numero/i);
  });

  it("deve detectar flag arguments na categoria functions", async () => {
    const result = await client.callTool({
      name: "detect_code_smells",
      arguments: {
        code: "function fetch(verbose: boolean) { return null; }",
        language: "typescript",
        category: "functions",
      },
    });
    const text = (result.content as Array<{ type: string; text: string }>)[0]
      .text;
    expect(text).toMatch(/flag|boolean|argumento/i);
  });

  it("deve detectar nomes genericos na categoria names", async () => {
    const result = await client.callTool({
      name: "detect_code_smells",
      arguments: {
        code: "const data = getData();\nconst info = process(info);",
        language: "typescript",
        category: "names",
      },
    });
    const text = (result.content as Array<{ type: string; text: string }>)[0]
      .text;
    expect(text).toMatch(/generico|data|info|nome/i);
  });

  it("deve detectar God class na categoria general", async () => {
    const methods = Array.from(
      { length: 12 },
      (_, i) => `  m${i}() { return 0; }`
    ).join("\n");
    const result = await client.callTool({
      name: "detect_code_smells",
      arguments: {
        code: `class BigService {\n${methods}\n}`,
        language: "typescript",
        category: "general",
      },
    });
    const text = (result.content as Array<{ type: string; text: string }>)[0]
      .text;
    expect(text).toMatch(/God class|classe.*grande|muitos metodos/i);
  });

  it("deve detectar Long Method na categoria functions", async () => {
    const manyLines = Array.from(
      { length: 25 },
      (_, i) => `  const line${i} = ${i};`
    ).join("\n");
    const result = await client.callTool({
      name: "detect_code_smells",
      arguments: {
        code: `function longMethod() {\n${manyLines}\n  return 0;\n}`,
        language: "typescript",
        category: "functions",
      },
    });
    const text = (result.content as Array<{ type: string; text: string }>)[0]
      .text;
    expect(text).toMatch(/long method|funcao longa|linhas/i);
  });

  it("deve detectar codigo comentado na categoria comments", async () => {
    const result = await client.callTool({
      name: "detect_code_smells",
      arguments: {
        code: "// const old = 1;\n// function deprecated() {}\nconst x = 2;",
        language: "typescript",
        category: "comments",
      },
    });
    const text = (result.content as Array<{ type: string; text: string }>)[0]
      .text;
    expect(text).toMatch(/comentado|comentario/i);
  });

  it("deve retornar mensagem positiva quando nao ha smells na categoria", async () => {
    const result = await client.callTool({
      name: "detect_code_smells",
      arguments: {
        code: "function isEven(n: number): boolean { return n % 2 === 0; }",
        language: "typescript",
        category: "names",
      },
    });
    const text = (result.content as Array<{ type: string; text: string }>)[0]
      .text;
    expect(text).toMatch(/nenhum|nao encontrado|boa forma|0 smell/i);
  });
});
