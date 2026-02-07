import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

const technologyEnum = z.enum(["laravel", "nestjs", "generic"]);
const layerEnum = z.enum([
  "entity",
  "use-case",
  "adapter",
  "framework",
  "all",
]);

type Technology = z.infer<typeof technologyEnum>;
type Layer = z.infer<typeof layerEnum>;

type LayerName = "entity" | "use-case" | "adapter" | "framework";

interface InvalidImport {
  fromLayer: LayerName;
  toLayer: LayerName;
  description: string;
}

// Regra de dependencia: so pode importar das camadas mais internas
const ALLOWED_DEPS: Record<LayerName, LayerName[]> = {
  entity: [],
  "use-case": ["entity"],
  adapter: ["entity", "use-case"],
  framework: ["entity", "use-case", "adapter"],
};

function detectLayerFromPath(path: string): LayerName | null {
  const lower = path.toLowerCase().replace(/\\/g, "/");
  if (
    lower.includes("/domain/") ||
    lower.includes("/entities/") ||
    lower.includes("/entity/") ||
    lower.includes("/model/") ||
    lower.includes("app/models/") ||
    lower.includes("domain/")
  ) {
    return "entity";
  }
  if (
    lower.includes("/application/") ||
    lower.includes("/use-case") ||
    lower.includes("/usecase") ||
    lower.includes("/services/") ||
    lower.includes("application/")
  ) {
    return "use-case";
  }
  if (
    lower.includes("/infrastructure/") ||
    lower.includes("/adapters/") ||
    lower.includes("/controllers/") ||
    lower.includes("/repositories/") ||
    lower.includes("/persistence/") ||
    lower.includes("http/controllers/") ||
    lower.includes("infrastructure/")
  ) {
    return "adapter";
  }
  if (
    lower.includes("main.") ||
    lower.includes("index.") ||
    lower.includes("/app.module") ||
    lower.includes("routes/") ||
    lower.includes("bootstrap/")
  ) {
    return "framework";
  }
  return null;
}

function extractImports(structure: string): { from: string; to: string }[] {
  const imports: { from: string; to: string }[] = [];
  const lines = structure.split("\n");
  let currentFile = "";

  const pathFromImport = (imp: string): string => {
    const match = imp.match(
      /from\s+['"](.+?)['"]|require\s*\(\s*['"](.+?)['"]\s*\)|use\s+(.+?)\s*;/
    );
    if (match) return (match[1] || match[2] || match[3] || "").trim();
    return "";
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("//") || trimmed.startsWith("*")) continue;

    const fileMatch = trimmed.match(/^([^\s]+\.(ts|js|php|vue))(\s|$)/);
    if (fileMatch) {
      currentFile = fileMatch[1];
      continue;
    }

    if (
      /(?:import\s+.+\s+from\s+['"]|require\s*\(\s*['"]|use\s+)/.test(trimmed)
    ) {
      const path = pathFromImport(trimmed);
      if (path && currentFile) {
        imports.push({ from: currentFile, to: path });
      } else if (path) {
        imports.push({ from: currentFile || "structure", to: path });
      }
    }
  }

  if (imports.length === 0) {
    const importRegex =
      /(?:import\s+.+\s+from\s+['"]([^'"]+)['"]|require\s*\(\s*['"]([^'"]+)['"]\s*\)|use\s+([^;]+);)/g;
    let m;
    while ((m = importRegex.exec(structure)) !== null) {
      const toPath = (m[1] || m[2] || m[3] || "").trim();
      if (toPath) {
        const fromPath =
          structure.match(/(\S+\.(?:ts|js|php|vue))/)?.[1] || "structure";
        imports.push({ from: fromPath, to: toPath });
      }
    }
  }

  return imports;
}

function validateImports(
  structure: string,
  layerFilter: Layer | null
): InvalidImport[] {
  const invalid: InvalidImport[] = [];
  const imports = extractImports(structure);

  for (const imp of imports) {
    const fromLayer = detectLayerFromPath(imp.from) || "entity";
    const toLayer = detectLayerFromPath(imp.to);
    if (!toLayer) continue;

    const allowed = ALLOWED_DEPS[fromLayer];
    if (allowed && !allowed.includes(toLayer)) {
      if (layerFilter && layerFilter !== "all" && fromLayer !== layerFilter)
        continue;
      invalid.push({
        fromLayer,
        toLayer,
        description: `Camada '${fromLayer}' nao deve importar de '${toLayer}'. Regra de dependencia: dependencias apontam para dentro.`,
      });
    }
  }

  if (invalid.length === 0 && structure.includes("import") && imports.length === 0) {
    const fromBlock = detectLayerFromPath(structure) || "entity";
    const toMatches = structure.match(
      /(?:from|require)\s+['"]([^'"]+)['"]|use\s+([^;]+);/g
    );
    if (toMatches) {
      for (const toMatch of toMatches) {
        const pathMatch = toMatch.match(/['"]([^'"]+)['"]|use\s+([^;]+)/);
        const toPath = pathMatch ? (pathMatch[1] || pathMatch[2]).trim() : "";
        const toLayer = detectLayerFromPath(toPath);
        if (toLayer && fromBlock) {
          const allowed = ALLOWED_DEPS[fromBlock];
          if (allowed && !allowed.includes(toLayer)) {
            invalid.push({
              fromLayer: fromBlock,
              toLayer,
              description: `Camada '${fromBlock}' nao deve importar de '${toLayer}'.`,
            });
          }
        }
      }
    }
  }

  return invalid;
}

function getSuggestedStructure(technology: Technology): string {
  if (technology === "nestjs") {
    return `src/
  domain/
    entities/
  application/
    use-cases/
  infrastructure/
    controllers/
    persistence/
  main.ts (framework)`;
  }
  if (technology === "laravel") {
    return `app/
  Domain/
    Entities/
  Application/
    UseCases/
  Infrastructure/
    Http/Controllers/
    Persistence/
  (framework: routes/, bootstrap/)`;
  }
  return `src/
  domain/     (entities)
  application/ (use-cases)
  infrastructure/ (adapters)
  (framework: main, wiring)`;
}

function formatOutput(
  structure: string,
  technology: Technology,
  layer: Layer,
  invalid: InvalidImport[]
): string {
  const techLabel =
    technology === "laravel"
      ? "Laravel"
      : technology === "nestjs"
        ? "NestJS"
        : "Generico";

  let output = `# Validacao de Arquitetura (Clean Architecture)\n\n`;
  output += `**Stack**: ${techLabel}\n`;
  output += `**Camada validada**: ${layer}\n`;
  output += `**Conformidade**: ${
    invalid.length === 0
      ? "Conforme — nenhum import invalido detectado."
      : `Nao conforme — ${invalid.length} import(s) que violam a regra de dependencia.`
  }\n\n`;

  if (invalid.length > 0) {
    output += "## Imports invalidos\n\n";
    for (const inv of invalid) {
      output += `- **${inv.fromLayer}** → **${inv.toLayer}**: ${inv.description}\n`;
    }
    output += "\n";
  }

  output += "## Sugestoes\n\n";
  output +=
    "- Entities nao devem importar Use Cases, Adapters ou Framework.\n";
  output +=
    "- Use Cases podem importar apenas Entities (e interfaces/ports).\n";
  output +=
    "- Adapters podem importar Use Cases e Entities.\n";
  output +=
    "- Framework (main, rotas) pode importar Adapters, Use Cases e Entities.\n\n";
  output += "### Estrutura de pastas sugerida\n\n";
  output += "```\n" + getSuggestedStructure(technology) + "\n```\n";

  return output;
}

export function register(server: McpServer): void {
  server.tool(
    "validate_architecture",
    "Valida conformidade com camadas do Clean Architecture: analisa structure (pastas/imports) e reporta imports invalidos e sugestoes",
    {
      structure: z
        .string()
        .describe(
          "Estrutura do projeto: arvore de pastas, listagem de arquivos com imports, ou trecho de codigo com import/use"
        ),
      technology: technologyEnum.describe(
        "Stack: laravel, nestjs ou generic"
      ),
      layer: layerEnum
        .default("all")
        .describe(
          "Camada a validar: entity, use-case, adapter, framework ou all (padrao)"
        ),
    },
    async ({ structure, technology, layer }) => {
      const invalid = validateImports(
        structure,
        layer === "all" ? null : layer
      );
      const text = formatOutput(structure, technology, layer, invalid);
      return {
        content: [{ type: "text", text }],
      };
    }
  );
}
