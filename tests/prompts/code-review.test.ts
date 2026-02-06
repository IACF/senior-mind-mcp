import { describe, it, expect, beforeEach } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createServer } from "../../src/server.js";

describe("Prompts - Code Review", () => {
  let client: Client;

  beforeEach(async () => {
    const server = createServer();
    const [clientTransport, serverTransport] =
      InMemoryTransport.createLinkedPair();
    await server.connect(serverTransport);
    client = new Client({ name: "test-client", version: "1.0.0" });
    await client.connect(clientTransport);
  });

  describe("listagem", () => {
    it("deve listar os 2 prompts de code review", async () => {
      const { prompts } = await client.listPrompts();
      const names = prompts.map((p) => p.name);

      expect(names).toContain("code-review-backend");
      expect(names).toContain("code-review-frontend");
    });
  });

  describe("code-review-backend", () => {
    it("deve gerar template com codigo e framework Laravel", async () => {
      const result = await client.getPrompt({
        name: "code-review-backend",
        arguments: {
          code: "class UserController extends Controller { }",
          framework: "laravel",
        },
      });

      const text = result.messages[0].content.text as string;

      expect(text).toContain("UserController");
      expect(text).toContain("Laravel");
    });

    it("deve conter secoes Clean Code e SOLID", async () => {
      const result = await client.getPrompt({
        name: "code-review-backend",
        arguments: {
          code: "function test() {}",
          framework: "nestjs",
        },
      });

      const text = result.messages[0].content.text as string;

      expect(text).toContain("Clean Code");
      expect(text).toContain("SOLID");
      expect(text).toContain("SRP");
    });

    it("deve conter convencoes especificas de Laravel", async () => {
      const result = await client.getPrompt({
        name: "code-review-backend",
        arguments: {
          code: "$user = User::find(1);",
          framework: "laravel",
        },
      });

      const text = result.messages[0].content.text as string;

      expect(text).toContain("FormRequest");
      expect(text).toContain("Eloquent");
      expect(text).toContain("Eager Loading");
    });

    it("deve conter convencoes especificas de NestJS", async () => {
      const result = await client.getPrompt({
        name: "code-review-backend",
        arguments: {
          code: "@Injectable() class UserService {}",
          framework: "nestjs",
        },
      });

      const text = result.messages[0].content.text as string;

      expect(text).toContain("Module");
      expect(text).toContain("DTOs");
      expect(text).toContain("class-validator");
      expect(text).toContain("Guards");
    });

    it("deve conter secao de performance SQL", async () => {
      const result = await client.getPrompt({
        name: "code-review-backend",
        arguments: {
          code: "SELECT * FROM users",
          framework: "laravel",
        },
      });

      const text = result.messages[0].content.text as string;

      expect(text).toContain("Performance SQL");
      expect(text).toContain("N+1");
      expect(text).toContain("Indices");
    });
  });

  describe("code-review-frontend", () => {
    it("deve gerar template com codigo e framework Vue", async () => {
      const result = await client.getPrompt({
        name: "code-review-frontend",
        arguments: {
          code: "<script setup>const count = ref(0)</script>",
          framework: "vue",
        },
      });

      const text = result.messages[0].content.text as string;

      expect(text).toContain("ref(0)");
      expect(text).toContain("Vue 3");
    });

    it("deve conter checklist Composition API para Vue", async () => {
      const result = await client.getPrompt({
        name: "code-review-frontend",
        arguments: {
          code: "const items = ref([])",
          framework: "vue",
        },
      });

      const text = result.messages[0].content.text as string;

      expect(text).toContain("Composition API");
      expect(text).toContain("script setup");
      expect(text).toContain("computed");
      expect(text).toContain("Composables");
    });

    it("deve conter checklist Hooks para React", async () => {
      const result = await client.getPrompt({
        name: "code-review-frontend",
        arguments: {
          code: "const [count, setCount] = useState(0)",
          framework: "react",
        },
      });

      const text = result.messages[0].content.text as string;

      expect(text).toContain("Hooks");
      expect(text).toContain("useState");
      expect(text).toContain("useEffect");
      expect(text).toContain("React 18");
    });

    it("deve conter secoes de componentizacao e performance", async () => {
      const result = await client.getPrompt({
        name: "code-review-frontend",
        arguments: {
          code: "function App() { return <div /> }",
          framework: "react",
        },
      });

      const text = result.messages[0].content.text as string;

      expect(text).toContain("Componentizacao");
      expect(text).toContain("Performance");
      expect(text).toContain("TypeScript");
    });
  });
});
