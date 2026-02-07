import { describe, it, expect, beforeEach } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createServer } from "../../src/server.js";

describe("Resources - Clean Architecture (Fase 3 expandido)", () => {
  let client: Client;

  beforeEach(async () => {
    const server = createServer();
    const [clientTransport, serverTransport] =
      InMemoryTransport.createLinkedPair();
    await server.connect(serverTransport);
    client = new Client({ name: "test-client", version: "1.0.0" });
    await client.connect(clientTransport);
  });

  describe("clean-architecture expandido (3A)", () => {
    it("deve conter Screaming Architecture", async () => {
      const result = await client.readResource({
        uri: "senior-mind://references/clean-architecture",
      });
      const text = result.contents[0].text as string;
      expect(text).toMatch(/Screaming Architecture/i);
      expect(text).toMatch(/proposito|pastas|framework/i);
    });

    it("deve conter Humble Object Pattern", async () => {
      const result = await client.readResource({
        uri: "senior-mind://references/clean-architecture",
      });
      const text = result.contents[0].text as string;
      expect(text).toMatch(/Humble Object/i);
      expect(text).toMatch(/testavel|testar/i);
    });

    it("deve conter Presenters e View Models", async () => {
      const result = await client.readResource({
        uri: "senior-mind://references/clean-architecture",
      });
      const text = result.contents[0].text as string;
      expect(text).toMatch(/Presenter|View Model/i);
      expect(text).toMatch(/formatac[aã]o|Use Case/i);
    });

    it("deve conter Main Component / Composition Root", async () => {
      const result = await client.readResource({
        uri: "senior-mind://references/clean-architecture",
      });
      const text = result.contents[0].text as string;
      expect(text).toMatch(/Composition Root|Main Component/i);
      expect(text).toMatch(/DI|dependencias|montad/i);
    });

    it("deve conter Anti-patterns (Entidade anemica, Use Case acoplado, Controller gordo)", async () => {
      const result = await client.readResource({
        uri: "senior-mind://references/clean-architecture",
      });
      const text = result.contents[0].text as string;
      expect(text).toMatch(/Anti-pattern|antipattern/i);
      expect(text).toMatch(/Entidade anemica|anemica/i);
      expect(text).toMatch(/Use Case acoplado|acoplado ao framework/i);
      expect(text).toMatch(/Controller gordo|gordo/i);
    });

    it("deve conter estruturas de pastas reais (NestJS e Laravel)", async () => {
      const result = await client.readResource({
        uri: "senior-mind://references/clean-architecture",
      });
      const text = result.contents[0].text as string;
      expect(text).toMatch(/NestJS|nest/i);
      expect(text).toMatch(/Laravel/i);
      expect(text).toMatch(/pastas?|estrutura|domain|application|infrastructure/i);
    });
  });

  describe("clean-architecture-patterns (3B)", () => {
    it("deve estar registrado e listado", async () => {
      const { resources } = await client.listResources();
      const resource = resources.find((r) => r.name === "clean-architecture-patterns");
      expect(resource).toBeDefined();
      expect(resource!.uri).toBe("senior-mind://references/clean-architecture-patterns");
    });

    it("deve retornar conteudo nao vazio", async () => {
      const result = await client.readResource({
        uri: "senior-mind://references/clean-architecture-patterns",
      });
      expect(result.contents).toHaveLength(1);
      expect(result.contents[0].text).toBeTruthy();
    });

    it("deve conter os padroes: Repository, Gateway, Presenter, DTOs, Interactor, Mapper, Domain Events", async () => {
      const result = await client.readResource({
        uri: "senior-mind://references/clean-architecture-patterns",
      });
      const text = result.contents[0].text as string;
      expect(text).toMatch(/Repository/i);
      expect(text).toMatch(/Gateway/i);
      expect(text).toMatch(/Presenter/i);
      expect(text).toMatch(/DTO|Input|Output/i);
      expect(text).toMatch(/Interactor|Use Case/i);
      expect(text).toMatch(/Mapper/i);
      expect(text).toMatch(/Domain Events?/i);
    });

    it("deve conter exemplos em TypeScript e PHP", async () => {
      const result = await client.readResource({
        uri: "senior-mind://references/clean-architecture-patterns",
      });
      const text = result.contents[0].text as string;
      expect(text).toMatch(/TypeScript|typescript/i);
      expect(text).toMatch(/PHP|Laravel/i);
    });
  });

  describe("design-patterns (3C)", () => {
    it("deve estar registrado e listado", async () => {
      const { resources } = await client.listResources();
      const resource = resources.find((r) => r.name === "design-patterns");
      expect(resource).toBeDefined();
      expect(resource!.uri).toBe("senior-mind://references/design-patterns");
    });

    it("deve retornar conteudo nao vazio", async () => {
      const result = await client.readResource({
        uri: "senior-mind://references/design-patterns",
      });
      expect(result.contents).toHaveLength(1);
      expect(result.contents[0].text).toBeTruthy();
    });

    it("deve conter padroes criacionais: Factory Method, Abstract Factory, Builder", async () => {
      const result = await client.readResource({
        uri: "senior-mind://references/design-patterns",
      });
      const text = result.contents[0].text as string;
      expect(text).toMatch(/Factory Method|Factory/i);
      expect(text).toMatch(/Abstract Factory/i);
      expect(text).toMatch(/Builder/i);
      expect(text).toMatch(/Criacionais?/i);
    });

    it("deve conter padroes estruturais: Adapter, Decorator, Facade", async () => {
      const result = await client.readResource({
        uri: "senior-mind://references/design-patterns",
      });
      const text = result.contents[0].text as string;
      expect(text).toMatch(/Adapter/i);
      expect(text).toMatch(/Decorator/i);
      expect(text).toMatch(/Facade/i);
      expect(text).toMatch(/Estruturais?/i);
    });

    it("deve conter padroes comportamentais: Strategy, Observer, Command", async () => {
      const result = await client.readResource({
        uri: "senior-mind://references/design-patterns",
      });
      const text = result.contents[0].text as string;
      expect(text).toMatch(/Strategy/i);
      expect(text).toMatch(/Observer/i);
      expect(text).toMatch(/Command/i);
      expect(text).toMatch(/Comportamentais?/i);
    });

    it("deve contextualizar GoF com Clean Architecture", async () => {
      const result = await client.readResource({
        uri: "senior-mind://references/design-patterns",
      });
      const text = result.contents[0].text as string;
      expect(text).toMatch(/Clean Architecture|GoF|Gang of Four/i);
    });

    it("deve conter exemplos em TypeScript e PHP", async () => {
      const result = await client.readResource({
        uri: "senior-mind://references/design-patterns",
      });
      const text = result.contents[0].text as string;
      expect(text).toMatch(/TypeScript|typescript/i);
      expect(text).toMatch(/PHP|Laravel/i);
    });
  });
});
