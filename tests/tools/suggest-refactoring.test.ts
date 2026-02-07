import { describe, it, expect, beforeEach } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createServer } from "../../src/server.js";

describe("tool suggest_refactoring", () => {
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
    const tool = tools.find((t) => t.name === "suggest_refactoring");

    expect(tool).toBeDefined();
    expect(tool!.description).toContain("Object Calisthenics");
  });

  it("deve sugerir refatoracao para else (regra 2)", async () => {
    const result = await client.callTool({
      name: "suggest_refactoring",
      arguments: {
        code: `function check(x: number): string {\n  if (x > 0) {\n    return "positivo";\n  } else {\n    return "negativo";\n  }\n}`,
        language: "typescript",
        rules: ["no-else"],
      },
    });

    const text = (result.content as Array<{ type: string; text: string }>)[0]
      .text;

    expect(text).toContain("Nao use ELSE");
    expect(text).toContain("Antes:");
    expect(text).toContain("Depois:");
    expect(text).toContain("early return");
  });

  it("deve conter pergunta interativa com nome do desenvolvedor", async () => {
    const result = await client.callTool({
      name: "suggest_refactoring",
      arguments: {
        code: `function test(x: number) {\n  if (x > 0) {\n    return true;\n  } else {\n    return false;\n  }\n}`,
        language: "typescript",
        rules: ["no-else"],
      },
    });

    const text = (result.content as Array<{ type: string; text: string }>)[0]
      .text;

    expect(text).toContain("deseja aplicar a regra");
    expect(text).toContain("Object Calisthenics");
  });

  it("deve sugerir refatoracao para cadeia de chamadas (regra 5)", async () => {
    const result = await client.callTool({
      name: "suggest_refactoring",
      arguments: {
        code: `const city = order.getCustomer().getAddress().getCity();`,
        language: "typescript",
        rules: ["um-ponto-por-linha"],
      },
    });

    const text = (result.content as Array<{ type: string; text: string }>)[0]
      .text;

    expect(text).toContain("Um ponto por linha");
    expect(text).toContain("Antes:");
    expect(text).toContain("Depois:");
  });

  it("deve retornar mensagem positiva quando nao ha sugestoes", async () => {
    const result = await client.callTool({
      name: "suggest_refactoring",
      arguments: {
        code: `function isValid(value: number): boolean {\n  return value > 0;\n}`,
        language: "typescript",
      },
    });

    const text = (result.content as Array<{ type: string; text: string }>)[0]
      .text;

    expect(text).toContain("conformidade");
  });

  it("deve sugerir refatoracao para getter (regra 9)", async () => {
    const result = await client.callTool({
      name: "suggest_refactoring",
      arguments: {
        code: `class Account {\n  private balance: number;\n  get Balance() {\n    return this.balance;\n  }\n}`,
        language: "typescript",
        rules: ["sem-getters-setters"],
      },
    });

    const text = (result.content as Array<{ type: string; text: string }>)[0]
      .text;

    expect(text).toContain("getters/setters");
    expect(text).toContain("Tell, Don't Ask");
  });

  it("deve verificar todas as regras quando nenhuma e especificada", async () => {
    const codeWithMultipleViolations = [
      `function processOrders(orders: any[]) {`,
      `  for (const order of orders) {`,
      `    if (order.isValid()) {`,
      `      for (const item of order.items) {`,
      `        if (item.inStock()) {`,
      `          item.reserve();`,
      `        }`,
      `      }`,
      `    } else {`,
      `      console.log("invalido");`,
      `    }`,
      `  }`,
      `}`,
    ].join("\n");

    const result = await client.callTool({
      name: "suggest_refactoring",
      arguments: {
        code: codeWithMultipleViolations,
        language: "typescript",
      },
    });

    const text = (result.content as Array<{ type: string; text: string }>)[0]
      .text;

    expect(text).toContain("Sugestoes de Refatoracao");
    // Deve detectar pelo menos else e indentacao profunda
    expect(text).toContain("Sugestoes encontradas");
  });

  it("deve sugerir refatoracao para colecao exposta (regra 4)", async () => {
    const result = await client.callTool({
      name: "suggest_refactoring",
      arguments: {
        code: "function process(items: string[]) { return items.length; }",
        language: "typescript",
        rules: ["colecoes-primeira-classe"],
      },
    });
    const text = (result.content as Array<{ type: string; text: string }>)[0].text;
    expect(text).toMatch(/Colecoes|primeira classe|Regra 4/i);
    expect(text).toContain("Antes:");
    expect(text).toContain("Depois:");
  });

  it("deve sugerir refatoracao para abreviacao (regra 6)", async () => {
    const result = await client.callTool({
      name: "suggest_refactoring",
      arguments: {
        code: "class UserMgr { getUsers() {} }",
        language: "typescript",
        rules: ["nao-abrevie"],
      },
    });
    const text = (result.content as Array<{ type: string; text: string }>)[0].text;
    expect(text).toMatch(/Nao abrevie|Regra 6|Manager/i);
  });

  it("deve incluir codigo refatorado especifico no no-else (condicao do usuario)", async () => {
    const result = await client.callTool({
      name: "suggest_refactoring",
      arguments: {
        code: "function check(x: number) {\n  if (x > 0) {\n    return \"positivo\";\n  } else {\n    return \"negativo\";\n  }\n}",
        language: "typescript",
        rules: ["no-else"],
      },
    });
    const text = (result.content as Array<{ type: string; text: string }>)[0].text;
    expect(text).toContain("x > 0");
    expect(text).toMatch(/!\(x > 0\)|early return/i);
  });

  it("deve funcionar com PHP", async () => {
    const result = await client.callTool({
      name: "suggest_refactoring",
      arguments: {
        code: `function check($x) {\n  if ($x > 0) {\n    return true;\n  } else {\n    return false;\n  }\n}`,
        language: "php",
        rules: ["no-else"],
      },
    });

    const text = (result.content as Array<{ type: string; text: string }>)[0]
      .text;

    expect(text).toContain("Nao use ELSE");
    expect(text).toContain("php");
  });
});
