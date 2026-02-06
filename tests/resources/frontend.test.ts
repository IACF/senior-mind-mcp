import { describe, it, expect, beforeEach } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createServer } from "../../src/server.js";

describe("Resources - Frontend", () => {
  let client: Client;

  beforeEach(async () => {
    const server = createServer();

    const [clientTransport, serverTransport] =
      InMemoryTransport.createLinkedPair();

    await server.connect(serverTransport);

    client = new Client({ name: "test-client", version: "1.0.0" });
    await client.connect(clientTransport);
  });

  describe("listagem de resources frontend", () => {
    it("deve listar os 2 resources de frontend", async () => {
      const { resources } = await client.listResources();
      const names = resources.map((r) => r.name);

      expect(names).toContain("vue-patterns");
      expect(names).toContain("react-patterns");
    });
  });

  describe("vue-patterns", () => {
    it("deve ter a URI correta", async () => {
      const { resources } = await client.listResources();
      const resource = resources.find((r) => r.name === "vue-patterns");

      expect(resource).toBeDefined();
      expect(resource!.uri).toBe("senior-mind://references/vue-patterns");
    });

    it("deve retornar conteudo nao vazio", async () => {
      const result = await client.readResource({
        uri: "senior-mind://references/vue-patterns",
      });

      expect(result.contents).toHaveLength(1);
      expect(result.contents[0].text).toBeTruthy();
    });

    it("deve conter termos-chave de Vue 3", async () => {
      const result = await client.readResource({
        uri: "senior-mind://references/vue-patterns",
      });

      const text = result.contents[0].text as string;
      expect(text).toContain("Composition API");
      expect(text).toContain("ref");
      expect(text).toContain("reactive");
      expect(text).toContain("computed");
      expect(text).toContain("watch");
      expect(text).toContain("script setup");
      expect(text).toContain("Composables");
      expect(text).toContain("provide");
      expect(text).toContain("inject");
    });
  });

  describe("react-patterns", () => {
    it("deve ter a URI correta", async () => {
      const { resources } = await client.listResources();
      const resource = resources.find((r) => r.name === "react-patterns");

      expect(resource).toBeDefined();
      expect(resource!.uri).toBe("senior-mind://references/react-patterns");
    });

    it("deve retornar conteudo nao vazio", async () => {
      const result = await client.readResource({
        uri: "senior-mind://references/react-patterns",
      });

      expect(result.contents).toHaveLength(1);
      expect(result.contents[0].text).toBeTruthy();
    });

    it("deve conter termos-chave de React 18", async () => {
      const result = await client.readResource({
        uri: "senior-mind://references/react-patterns",
      });

      const text = result.contents[0].text as string;
      expect(text).toContain("useState");
      expect(text).toContain("useEffect");
      expect(text).toContain("useCallback");
      expect(text).toContain("useMemo");
      expect(text).toContain("useRef");
      expect(text).toContain("Custom Hooks");
      expect(text).toContain("Compound Components");
      expect(text).toContain("Render Props");
      expect(text).toContain("React.memo");
    });
  });
});
