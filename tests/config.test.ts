import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("dotenv", () => ({
  default: { config: vi.fn() },
}));

describe("config", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("deve retornar 'Desenvolvedor' quando DEVELOPER_NAME nao estiver definido", async () => {
    delete process.env.DEVELOPER_NAME;

    const { config } = await import("../src/config.js");

    expect(config.developerName).toBe("Desenvolvedor");
  });

  it("deve retornar o valor de DEVELOPER_NAME quando estiver definido", async () => {
    process.env.DEVELOPER_NAME = "TestDev";

    const { config } = await import("../src/config.js");

    expect(config.developerName).toBe("TestDev");
  });
});
