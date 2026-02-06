import { describe, it, expect, beforeEach } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createServer } from "../../src/server.js";

describe("tool review_code", () => {
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
    const tool = tools.find((t) => t.name === "review_code");

    expect(tool).toBeDefined();
    expect(tool!.description).toContain("Revisa codigo");
  });

  it("deve detectar uso de any em TypeScript", async () => {
    const result = await client.callTool({
      name: "review_code",
      arguments: {
        code: `const data: any = fetchData();\nconst items: any[] = [];`,
        language: "typescript",
        focus: "clean-code",
      },
    });

    const text = (result.content as Array<{ type: string; text: string }>)[0]
      .text;

    expect(text).toContain("any");
    expect(text).toContain("Severidade Alta");
  });

  it("deve detectar console.log", async () => {
    const result = await client.callTool({
      name: "review_code",
      arguments: {
        code: `function process() {\n  console.log("debug");\n  return 42;\n}`,
        language: "javascript",
        focus: "clean-code",
      },
    });

    const text = (result.content as Array<{ type: string; text: string }>)[0]
      .text;

    expect(text).toContain("console.log");
    expect(text).toContain("Severidade Baixa");
  });

  it("deve detectar else (Object Calisthenics regra 2)", async () => {
    const result = await client.callTool({
      name: "review_code",
      arguments: {
        code: `function check(x: number) {\n  if (x > 0) {\n    return "positivo";\n  } else {\n    return "negativo";\n  }\n}`,
        language: "typescript",
        focus: "object-calisthenics",
      },
    });

    const text = (result.content as Array<{ type: string; text: string }>)[0]
      .text;

    expect(text).toContain("Nao use ELSE");
  });

  it("deve retornar mensagem positiva quando nao ha violacoes", async () => {
    const result = await client.callTool({
      name: "review_code",
      arguments: {
        code: `function isPositive(value: number): boolean {\n  return value > 0;\n}`,
        language: "typescript",
        focus: "clean-code",
      },
    });

    const text = (result.content as Array<{ type: string; text: string }>)[0]
      .text;

    expect(text).toContain("boa forma");
  });

  it("deve incluir nome do desenvolvedor na resposta com violacoes", async () => {
    const result = await client.callTool({
      name: "review_code",
      arguments: {
        code: `const x: any = 1;`,
        language: "typescript",
        focus: "clean-code",
      },
    });

    const text = (result.content as Array<{ type: string; text: string }>)[0]
      .text;

    expect(text).toContain("revise as violacoes");
  });

  it("deve funcionar com foco all (clean-code + calisthenics)", async () => {
    const result = await client.callTool({
      name: "review_code",
      arguments: {
        code: `const d: any = getData();\nif (d) {\n  console.log(d);\n} else {\n  console.log("nada");\n}`,
        language: "typescript",
      },
    });

    const text = (result.content as Array<{ type: string; text: string }>)[0]
      .text;

    expect(text).toContain("Clean Code + Object Calisthenics");
    // Deve ter violacoes de ambos
    expect(text).toContain("any");
    expect(text).toContain("ELSE");
  });

  it("deve mostrar localizacao e sugestao para cada violacao", async () => {
    const result = await client.callTool({
      name: "review_code",
      arguments: {
        code: `const x: any = 1;\nconsole.log(x);`,
        language: "typescript",
        focus: "clean-code",
      },
    });

    const text = (result.content as Array<{ type: string; text: string }>)[0]
      .text;

    expect(text).toContain("Local");
    expect(text).toContain("Problema");
    expect(text).toContain("Sugestao");
  });

  it("deve detectar cadeia de chamadas longa (regra 5)", async () => {
    const result = await client.callTool({
      name: "review_code",
      arguments: {
        code: `const city = order.getCustomer().getAddress().getCity();`,
        language: "typescript",
        focus: "object-calisthenics",
      },
    });

    const text = (result.content as Array<{ type: string; text: string }>)[0]
      .text;

    expect(text).toContain("Um ponto por linha");
  });
});
