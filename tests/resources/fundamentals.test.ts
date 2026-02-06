import { describe, it, expect, beforeEach } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createServer } from "../../src/server.js";

describe("Resources - Fundamentos", () => {
  let client: Client;

  beforeEach(async () => {
    const server = createServer();

    const [clientTransport, serverTransport] =
      InMemoryTransport.createLinkedPair();

    await server.connect(serverTransport);

    client = new Client({ name: "test-client", version: "1.0.0" });
    await client.connect(clientTransport);
  });

  describe("listagem de resources", () => {
    it("deve listar os 3 resources fundamentais", async () => {
      const { resources } = await client.listResources();
      const names = resources.map((r) => r.name);

      expect(names).toContain("clean-code");
      expect(names).toContain("clean-architecture");
      expect(names).toContain("object-calisthenics");
    });
  });

  describe("clean-code", () => {
    it("deve ter a URI correta", async () => {
      const { resources } = await client.listResources();
      const resource = resources.find((r) => r.name === "clean-code");

      expect(resource).toBeDefined();
      expect(resource!.uri).toBe("senior-mind://references/clean-code");
    });

    it("deve retornar conteudo nao vazio", async () => {
      const result = await client.readResource({
        uri: "senior-mind://references/clean-code",
      });

      expect(result.contents).toHaveLength(1);
      expect(result.contents[0].text).toBeTruthy();
    });

    it("deve conter termos-chave de Clean Code", async () => {
      const result = await client.readResource({
        uri: "senior-mind://references/clean-code",
      });

      const text = result.contents[0].text as string;
      expect(text).toContain("Nomes Significativos");
      expect(text).toContain("DRY");
      expect(text).toContain("KISS");
      expect(text).toContain("SOLID");
      expect(text).toContain("SRP");
      expect(text).toContain("OCP");
    });
  });

  describe("clean-architecture", () => {
    it("deve ter a URI correta", async () => {
      const { resources } = await client.listResources();
      const resource = resources.find((r) => r.name === "clean-architecture");

      expect(resource).toBeDefined();
      expect(resource!.uri).toBe(
        "senior-mind://references/clean-architecture"
      );
    });

    it("deve retornar conteudo nao vazio", async () => {
      const result = await client.readResource({
        uri: "senior-mind://references/clean-architecture",
      });

      expect(result.contents).toHaveLength(1);
      expect(result.contents[0].text).toBeTruthy();
    });

    it("deve conter as 4 camadas da Clean Architecture", async () => {
      const result = await client.readResource({
        uri: "senior-mind://references/clean-architecture",
      });

      const text = result.contents[0].text as string;
      expect(text).toContain("Entities");
      expect(text).toContain("Use Cases");
      expect(text).toContain("Interface Adapters");
      expect(text).toContain("Frameworks");
    });

    it("deve conter conceitos fundamentais", async () => {
      const result = await client.readResource({
        uri: "senior-mind://references/clean-architecture",
      });

      const text = result.contents[0].text as string;
      expect(text).toContain("Regra de Dependencia");
      expect(text).toContain("Boundary Crossing");
      expect(text).toContain("Inversao de Dependencia");
    });
  });

  describe("object-calisthenics", () => {
    it("deve ter a URI correta", async () => {
      const { resources } = await client.listResources();
      const resource = resources.find(
        (r) => r.name === "object-calisthenics"
      );

      expect(resource).toBeDefined();
      expect(resource!.uri).toBe(
        "senior-mind://references/object-calisthenics"
      );
    });

    it("deve retornar conteudo nao vazio", async () => {
      const result = await client.readResource({
        uri: "senior-mind://references/object-calisthenics",
      });

      expect(result.contents).toHaveLength(1);
      expect(result.contents[0].text).toBeTruthy();
    });

    it("deve conter as 9 regras de Jeff Bay", async () => {
      const result = await client.readResource({
        uri: "senior-mind://references/object-calisthenics",
      });

      const text = result.contents[0].text as string;
      expect(text).toContain("Um Nivel de Indentacao");
      expect(text).toContain("Nao Use ELSE");
      expect(text).toContain("Encapsule Tipos Primitivos");
      expect(text).toContain("Colecoes de Primeira Classe");
      expect(text).toContain("Um Ponto por Linha");
      expect(text).toContain("Nao Abrevie");
      expect(text).toContain("Mantenha Entidades Pequenas");
      expect(text).toContain("2 Variaveis de Instancia");
      expect(text).toContain("Sem Getters/Setters");
    });
  });
});
