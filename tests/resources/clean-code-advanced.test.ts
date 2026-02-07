import { describe, it, expect, beforeEach } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createServer } from "../../src/server.js";

describe("Resources - Clean Code (Fase 2 expandido)", () => {
  let client: Client;

  beforeEach(async () => {
    const server = createServer();
    const [clientTransport, serverTransport] =
      InMemoryTransport.createLinkedPair();
    await server.connect(serverTransport);
    client = new Client({ name: "test-client", version: "1.0.0" });
    await client.connect(clientTransport);
  });

  describe("clean-code expandido (2A)", () => {
    it("deve conter DRY com exemplos praticos", async () => {
      const result = await client.readResource({
        uri: "senior-mind://references/clean-code",
      });
      const text = result.contents[0].text as string;
      expect(text).toContain("DRY");
      expect(text).toMatch(/extrair|funcao|modulo|reutilizav/i);
    });

    it("deve conter KISS e YAGNI com exemplos", async () => {
      const result = await client.readResource({
        uri: "senior-mind://references/clean-code",
      });
      const text = result.contents[0].text as string;
      expect(text).toContain("KISS");
      expect(text).toContain("YAGNI");
      expect(text).toMatch(/simplicidade|over-engineering/i);
    });

    it("deve conter Tratamento de Erros (Result pattern, excecoes, sem null)", async () => {
      const result = await client.readResource({
        uri: "senior-mind://references/clean-code",
      });
      const text = result.contents[0].text as string;
      expect(text).toMatch(/Result pattern|excecoes? de dominio|sem null/i);
    });

    it("deve conter Testes Limpos com F.I.R.S.T.", async () => {
      const result = await client.readResource({
        uri: "senior-mind://references/clean-code",
      });
      const text = result.contents[0].text as string;
      expect(text).toMatch(/F\.I\.R\.S\.T\.|FIRST/i);
      expect(text).toMatch(/testes limpos|Arrange.*Act.*Assert|AAA/i);
    });

    it("deve conter Classes (coesao, SRP aplicado)", async () => {
      const result = await client.readResource({
        uri: "senior-mind://references/clean-code",
      });
      const text = result.contents[0].text as string;
      expect(text).toMatch(/Classes?|coesao|tamanho/i);
      expect(text).toMatch(/SRP.*classe|classe.*SRP/i);
    });

    it("deve conter Boundaries (Adapter, Facade, APIs externas)", async () => {
      const result = await client.readResource({
        uri: "senior-mind://references/clean-code",
      });
      const text = result.contents[0].text as string;
      expect(text).toMatch(/Boundaries?|Adapter|Facade|APIs? externas?|wrapping/i);
    });

    it("deve conter Niveis de Abstracao e step-down rule", async () => {
      const result = await client.readResource({
        uri: "senior-mind://references/clean-code",
      });
      const text = result.contents[0].text as string;
      expect(text).toMatch(/Niveis? de Abstracao|step-down|unico nivel/i);
    });

    it("deve conter Command Query Separation (CQS)", async () => {
      const result = await client.readResource({
        uri: "senior-mind://references/clean-code",
      });
      const text = result.contents[0].text as string;
      expect(text).toMatch(/Command Query Separation|CQS/i);
      expect(text).toMatch(/retornam|alteram|estado/i);
    });

    it("deve conter Emergence (Kent Beck, 4 regras)", async () => {
      const result = await client.readResource({
        uri: "senior-mind://references/clean-code",
      });
      const text = result.contents[0].text as string;
      expect(text).toMatch(/Emergence|Kent Beck|design simples/i);
    });
  });

  describe("clean-code-smells (2B)", () => {
    it("deve estar registrado e listado", async () => {
      const { resources } = await client.listResources();
      const resource = resources.find((r) => r.name === "clean-code-smells");
      expect(resource).toBeDefined();
      expect(resource!.uri).toBe("senior-mind://references/clean-code-smells");
    });

    it("deve retornar conteudo nao vazio", async () => {
      const result = await client.readResource({
        uri: "senior-mind://references/clean-code-smells",
      });
      expect(result.contents).toHaveLength(1);
      expect(result.contents[0].text).toBeTruthy();
    });

    it("deve conter as 6 categorias de code smells", async () => {
      const result = await client.readResource({
        uri: "senior-mind://references/clean-code-smells",
      });
      const text = result.contents[0].text as string;
      expect(text).toMatch(/Comentarios?/i);
      expect(text).toMatch(/Ambiente/i);
      expect(text).toMatch(/Funcoes?/i);
      expect(text).toMatch(/Gerais?/i);
      expect(text).toMatch(/Nomes?/i);
      expect(text).toMatch(/Testes?/i);
    });

    it("deve conter exemplo e correcao por categoria", async () => {
      const result = await client.readResource({
        uri: "senior-mind://references/clean-code-smells",
      });
      const text = result.contents[0].text as string;
      expect(text).toMatch(/exemplo|correcao|antes|depois/i);
      expect(text).toMatch(/codigo comentado|flag arguments?|magic numbers?|God class|feature envy/i);
    });
  });

  describe("solid-principles (2C)", () => {
    it("deve estar registrado e listado", async () => {
      const { resources } = await client.listResources();
      const resource = resources.find((r) => r.name === "solid-principles");
      expect(resource).toBeDefined();
      expect(resource!.uri).toBe("senior-mind://references/solid-principles");
    });

    it("deve retornar conteudo nao vazio", async () => {
      const result = await client.readResource({
        uri: "senior-mind://references/solid-principles",
      });
      expect(result.contents).toHaveLength(1);
      expect(result.contents[0].text).toBeTruthy();
    });

    it("deve conter os 5 principios SOLID", async () => {
      const result = await client.readResource({
        uri: "senior-mind://references/solid-principles",
      });
      const text = result.contents[0].text as string;
      expect(text).toMatch(/SRP|Single Responsibility/i);
      expect(text).toMatch(/OCP|Open\/Closed/i);
      expect(text).toMatch(/LSP|Liskov/i);
      expect(text).toMatch(/ISP|Interface Segregation/i);
      expect(text).toMatch(/DIP|Dependency Inversion/i);
    });

    it("deve conter exemplos em TypeScript e PHP", async () => {
      const result = await client.readResource({
        uri: "senior-mind://references/solid-principles",
      });
      const text = result.contents[0].text as string;
      expect(text).toMatch(/TypeScript|typescript/i);
      expect(text).toMatch(/PHP|Laravel/i);
    });

    it("deve conter violacao e correcao", async () => {
      const result = await client.readResource({
        uri: "senior-mind://references/solid-principles",
      });
      const text = result.contents[0].text as string;
      expect(text).toMatch(/viola[cç]ao|corre[cç]ao|antecipado|refatorado/i);
    });

    it("deve mencionar quando e aceitavel violar e relacao entre principios", async () => {
      const result = await client.readResource({
        uri: "senior-mind://references/solid-principles",
      });
      const text = result.contents[0].text as string;
      expect(text).toMatch(/aceitavel violar|quando violar|trade-off|rela[cç]ao/i);
    });
  });
});
