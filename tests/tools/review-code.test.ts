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

  it("deve detectar magic number (Fase 4)", async () => {
    const result = await client.callTool({
      name: "review_code",
      arguments: {
        code: "const timeout = 5000;\nconst retries = 3;",
        language: "typescript",
        focus: "clean-code",
      },
    });
    const text = (result.content as Array<{ type: string; text: string }>)[0].text;
    expect(text).toContain("Magic Numbers");
  });

  it("deve detectar argumento booleano / flag (Fase 4)", async () => {
    const result = await client.callTool({
      name: "review_code",
      arguments: {
        code: "function fetchData(verbose: boolean) { return null; }",
        language: "typescript",
        focus: "clean-code",
      },
    });
    const text = (result.content as Array<{ type: string; text: string }>)[0].text;
    expect(text).toMatch(/Evitar Argumentos Booleanos|Flag|booleanos?/i);
  });

  it("deve detectar God class - muitos metodos (Fase 4)", async () => {
    const methods = Array.from({ length: 12 }, (_, i) => `  m${i}() { return 0; }`).join("\n");
    const result = await client.callTool({
      name: "review_code",
      arguments: {
        code: `class BigService {\n${methods}\n}`,
        language: "typescript",
        focus: "clean-code",
      },
    });
    const text = (result.content as Array<{ type: string; text: string }>)[0].text;
    expect(text).toContain("God Class");
  });

  it("deve detectar funcao sem tipo de retorno explicito (Fase 4)", async () => {
    const result = await client.callTool({
      name: "review_code",
      arguments: {
        code: "function getId() { return 1; }",
        language: "typescript",
        focus: "clean-code",
      },
    });
    const text = (result.content as Array<{ type: string; text: string }>)[0].text;
    expect(text).toMatch(/Tipos de Retorno|retorno explicito/i);
  });

  it("deve detectar nome generico data/info/manager (Fase 4)", async () => {
    const result = await client.callTool({
      name: "review_code",
      arguments: {
        code: "const data = fetchUsers();\nconst info = getConfig();",
        language: "typescript",
        focus: "clean-code",
      },
    });
    const text = (result.content as Array<{ type: string; text: string }>)[0].text;
    expect(text).toMatch(/generico|data|info|Nomes Significativos/i);
  });

  it("deve detectar retorno de null (Fase 4)", async () => {
    const result = await client.callTool({
      name: "review_code",
      arguments: {
        code: "function find(): User { return null; }",
        language: "typescript",
        focus: "clean-code",
      },
    });
    const text = (result.content as Array<{ type: string; text: string }>)[0].text;
    expect(text).toMatch(/Retorno de null|Evitar Retorno/i);
  });

  it("deve detectar Regra 4 - colecao exposta como array (Fase 4)", async () => {
    const result = await client.callTool({
      name: "review_code",
      arguments: {
        code: "function process(items: string[]) { return items.length; }",
        language: "typescript",
        focus: "object-calisthenics",
      },
    });
    const text = (result.content as Array<{ type: string; text: string }>)[0].text;
    expect(text).toMatch(/Regra 4|Colecoes|primeira classe/i);
  });

  it("deve detectar Regra 7 - classe com mais de 50 linhas (Fase 4)", async () => {
    const filler = Array.from({ length: 52 }, (_, i) => `  line${i}() { }`).join("\n");
    const result = await client.callTool({
      name: "review_code",
      arguments: {
        code: `class Huge {\n${filler}\n}`,
        language: "typescript",
        focus: "object-calisthenics",
      },
    });
    const text = (result.content as Array<{ type: string; text: string }>)[0].text;
    expect(text).toMatch(/Regra 7|50 linhas|Classe pequena/i);
  });

  it("deve detectar Regra 8 - classe com mais de 2 variaveis de instancia (Fase 4)", async () => {
    const result = await client.callTool({
      name: "review_code",
      arguments: {
        code: `class TooManyFields {
  private a: string = "";
  private b: number = 0;
  private c: boolean = false;
  method() { return this.a; }
}`,
        language: "typescript",
        focus: "object-calisthenics",
      },
    });
    const text = (result.content as Array<{ type: string; text: string }>)[0].text;
    expect(text).toMatch(/Regra 8|variaveis de instancia|Maximo 2/i);
  });
});
