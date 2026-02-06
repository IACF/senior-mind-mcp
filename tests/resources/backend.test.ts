import { describe, it, expect, beforeEach } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createServer } from "../../src/server.js";

describe("Resources - Backend", () => {
  let client: Client;

  beforeEach(async () => {
    const server = createServer();

    const [clientTransport, serverTransport] =
      InMemoryTransport.createLinkedPair();

    await server.connect(serverTransport);

    client = new Client({ name: "test-client", version: "1.0.0" });
    await client.connect(clientTransport);
  });

  describe("listagem de resources backend", () => {
    it("deve listar os 3 resources de backend", async () => {
      const { resources } = await client.listResources();
      const names = resources.map((r) => r.name);

      expect(names).toContain("laravel-conventions");
      expect(names).toContain("nestjs-patterns");
      expect(names).toContain("tdd-reference");
    });
  });

  describe("laravel-conventions", () => {
    it("deve ter a URI correta", async () => {
      const { resources } = await client.listResources();
      const resource = resources.find(
        (r) => r.name === "laravel-conventions"
      );

      expect(resource).toBeDefined();
      expect(resource!.uri).toBe(
        "senior-mind://references/laravel-conventions"
      );
    });

    it("deve retornar conteudo nao vazio", async () => {
      const result = await client.readResource({
        uri: "senior-mind://references/laravel-conventions",
      });

      expect(result.contents).toHaveLength(1);
      expect(result.contents[0].text).toBeTruthy();
    });

    it("deve conter termos-chave de Laravel", async () => {
      const result = await client.readResource({
        uri: "senior-mind://references/laravel-conventions",
      });

      const text = result.contents[0].text as string;
      expect(text).toContain("Nomenclatura");
      expect(text).toContain("Eloquent");
      expect(text).toContain("Service Pattern");
      expect(text).toContain("Repository Pattern");
      expect(text).toContain("FormRequest");
    });
  });

  describe("nestjs-patterns", () => {
    it("deve ter a URI correta", async () => {
      const { resources } = await client.listResources();
      const resource = resources.find((r) => r.name === "nestjs-patterns");

      expect(resource).toBeDefined();
      expect(resource!.uri).toBe("senior-mind://references/nestjs-patterns");
    });

    it("deve retornar conteudo nao vazio", async () => {
      const result = await client.readResource({
        uri: "senior-mind://references/nestjs-patterns",
      });

      expect(result.contents).toHaveLength(1);
      expect(result.contents[0].text).toBeTruthy();
    });

    it("deve conter termos-chave de NestJS", async () => {
      const result = await client.readResource({
        uri: "senior-mind://references/nestjs-patterns",
      });

      const text = result.contents[0].text as string;
      expect(text).toContain("Modules");
      expect(text).toContain("Controllers");
      expect(text).toContain("Providers");
      expect(text).toContain("class-validator");
      expect(text).toContain("Pipes");
      expect(text).toContain("Guards");
      expect(text).toContain("Interceptors");
    });
  });

  describe("tdd-reference", () => {
    it("deve ter a URI correta", async () => {
      const { resources } = await client.listResources();
      const resource = resources.find((r) => r.name === "tdd-reference");

      expect(resource).toBeDefined();
      expect(resource!.uri).toBe("senior-mind://references/tdd-reference");
    });

    it("deve retornar conteudo nao vazio", async () => {
      const result = await client.readResource({
        uri: "senior-mind://references/tdd-reference",
      });

      expect(result.contents).toHaveLength(1);
      expect(result.contents[0].text).toBeTruthy();
    });

    it("deve conter termos-chave de TDD", async () => {
      const result = await client.readResource({
        uri: "senior-mind://references/tdd-reference",
      });

      const text = result.contents[0].text as string;
      expect(text).toContain("Red-Green-Refactor");
      expect(text).toContain("Fake It");
      expect(text).toContain("Triangulation");
      expect(text).toContain("Obvious Implementation");
      expect(text).toContain("AAA");
      expect(text).toContain("Arrange-Act-Assert");
    });
  });
});
