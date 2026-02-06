import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { config } from "../config.js";

const languageEnum = z.enum(["php", "typescript", "javascript"]);
type Language = z.infer<typeof languageEnum>;

const ALL_RULES = [
  "indentacao",
  "no-else",
  "encapsular-primitivos",
  "colecoes-primeira-classe",
  "um-ponto-por-linha",
  "nao-abrevie",
  "entidades-pequenas",
  "max-2-variaveis-instancia",
  "sem-getters-setters",
] as const;

interface RefactoringSuggestion {
  rule: string;
  ruleNumber: number;
  description: string;
  originalCode: string;
  refactoredCode: string;
  location: string;
}

function detectAndSuggest(
  code: string,
  language: Language,
  rules: string[]
): RefactoringSuggestion[] {
  const suggestions: RefactoringSuggestion[] = [];
  const lines = code.split("\n");
  const shouldCheck = (rule: string) =>
    rules.length === 0 || rules.includes(rule);

  // Regra 2: Nao use ELSE
  if (shouldCheck("no-else")) {
    for (let i = 0; i < lines.length; i++) {
      const trimmed = lines[i].trim();
      if (
        /\belse\b/.test(trimmed) &&
        !trimmed.startsWith("//") &&
        !trimmed.startsWith("*")
      ) {
        // Busca o bloco if-else para mostrar contexto
        let blockStart = i;
        for (let j = i - 1; j >= 0; j--) {
          if (lines[j].trim().startsWith("if")) {
            blockStart = j;
            break;
          }
        }

        const originalBlock = lines
          .slice(blockStart, Math.min(i + 4, lines.length))
          .join("\n");

        const refactored = language === "php"
          ? `// Use early return:\nif ($condicao) {\n    return $resultadoA;\n}\n\nreturn $resultadoB;`
          : `// Use early return:\nif (condicao) {\n  return resultadoA;\n}\n\nreturn resultadoB;`;

        suggestions.push({
          rule: "Nao use ELSE",
          ruleNumber: 2,
          description:
            "Elimine else usando early return, guard clauses ou polimorfismo. Isso torna o codigo mais linear e facil de acompanhar.",
          originalCode: originalBlock,
          refactoredCode: refactored,
          location: `Linha ${i + 1}`,
        });
        break; // Uma sugestao por regra para nao poluir
      }
    }
  }

  // Regra 1: Indentacao profunda
  if (shouldCheck("indentacao")) {
    let inFunc = false;
    let funcStart = -1;
    let funcName = "";
    let baseBraceDepth = 0;
    let braceDepth = 0;
    let maxIndent = 0;
    let deepestLine = -1;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const funcMatch = line.match(
        /(?:function|async function|(?:public|private|protected)\s+(?:async\s+)?(?:function\s+)?)\s*(\w+)\s*\(/
      );

      if (funcMatch && !inFunc) {
        inFunc = true;
        funcStart = i;
        funcName = funcMatch[1] || "anonimo";
        baseBraceDepth = braceDepth;
        maxIndent = 0;
        deepestLine = i;
      }

      braceDepth += (line.match(/{/g) || []).length;
      braceDepth -= (line.match(/}/g) || []).length;

      if (inFunc) {
        const relativeDepth = braceDepth - baseBraceDepth;
        if (relativeDepth > maxIndent) {
          maxIndent = relativeDepth;
          deepestLine = i;
        }

        if (braceDepth <= baseBraceDepth) {
          if (maxIndent > 2) {
            const originalBlock = lines
              .slice(funcStart, Math.min(i + 1, lines.length))
              .join("\n");

            const refactored =
              `// Extraia blocos internos para funcoes separadas:\n` +
              `function ${funcName}(params) {\n` +
              `  const filtered = filterValid(items);\n` +
              `  processItems(filtered);\n` +
              `}\n\n` +
              `function filterValid(items) { /* ... */ }\n` +
              `function processItems(items) { /* ... */ }`;

            suggestions.push({
              rule: "Um nivel de indentacao por metodo",
              ruleNumber: 1,
              description:
                "Cada metodo deve ter no maximo um nivel de indentacao. Extraia blocos profundos para metodos separados.",
              originalCode: originalBlock,
              refactoredCode: refactored,
              location: `Linhas ${funcStart + 1}-${i + 1} (metodo '${funcName}')`,
            });
          }
          inFunc = false;
        }
      }
    }
  }

  // Regra 3: Encapsular primitivos
  if (shouldCheck("encapsular-primitivos")) {
    const primitiveParams: Array<{ line: number; params: string[] }> = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // Detecta funcoes com muitos parametros primitivos (string, number, boolean)
      const funcMatch = line.match(
        /(?:function|async function)\s*(\w+)\s*\(([^)]+)\)/
      );
      if (funcMatch) {
        const params = funcMatch[2].split(",").map((p) => p.trim());
        const primitiveCount = params.filter((p) =>
          /:\s*(?:string|number|boolean|int|float|bool)\b/.test(p)
        ).length;

        if (primitiveCount >= 3) {
          const funcName = funcMatch[1];
          const refactored =
            language === "php"
              ? `// Crie um Value Object:\nclass ${funcName}Data {\n  public function __construct(\n    public readonly string $param1,\n    public readonly string $param2,\n    public readonly int $param3,\n  ) {}\n}\n\nfunction ${funcName}(${funcName}Data $data) { /* ... */ }`
              : `// Crie um Value Object/DTO:\ninterface ${funcName}Input {\n  param1: string;\n  param2: string;\n  param3: number;\n}\n\nfunction ${funcName}(input: ${funcName}Input) { /* ... */ }`;

          suggestions.push({
            rule: "Encapsule tipos primitivos",
            ruleNumber: 3,
            description:
              "Quando uma funcao recebe muitos primitivos, encapsule-os em um Value Object ou DTO. Isso melhora type safety e validacao.",
            originalCode: line.trim(),
            refactoredCode: refactored,
            location: `Linha ${i + 1} (funcao '${funcName}')`,
          });
        }
      }
    }
  }

  // Regra 5: Um ponto por linha
  if (shouldCheck("um-ponto-por-linha")) {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith("//") || line.startsWith("*") || line.startsWith("import")) continue;

      const dots = (line.match(/\.\w+\s*\(/g) || []).length;
      if (dots > 2) {
        const refactored =
          `// Quebre a cadeia em passos intermediarios:\n` +
          `const step1 = obj.firstMethod();\n` +
          `const step2 = step1.secondMethod();\n` +
          `const result = step2.thirdMethod();`;

        suggestions.push({
          rule: "Um ponto por linha",
          ruleNumber: 5,
          description:
            "Nao encadeie chamadas em objetos que nao sao seus (Lei de Demeter). Quebre em passos ou delegue ao objeto.",
          originalCode: line,
          refactoredCode: refactored,
          location: `Linha ${i + 1}`,
        });
        break;
      }
    }
  }

  // Regra 9: Sem getters/setters
  if (shouldCheck("sem-getters-setters")) {
    const getSetPattern =
      /\b(get|set)\s+(\w+)\s*\(|(?:public|protected)\s+(?:function\s+)?(get|set)(\w+)\s*\(/;

    for (let i = 0; i < lines.length; i++) {
      const match = lines[i].match(getSetPattern);
      if (match) {
        const type = match[1] || match[3];
        const name = match[2] || match[4];

        const refactored =
          type === "get"
            ? `// Em vez de expor dados, crie metodos com comportamento:\n// Antes: obj.getBalance() → decisao externa\n// Depois: obj.canAfford(amount) → decisao interna`
            : `// Em vez de permitir mudanca externa, encapsule a regra:\n// Antes: obj.setStatus(newStatus)\n// Depois: obj.activate() / obj.deactivate()`;

        suggestions.push({
          rule: "Sem getters/setters (Tell, Don't Ask)",
          ruleNumber: 9,
          description:
            "Nao peca dados ao objeto para tomar decisoes externas. Diga ao objeto o que fazer — ele decide internamente.",
          originalCode: lines[i].trim(),
          refactoredCode: refactored,
          location: `Linha ${i + 1} (${type} ${name})`,
        });
        break;
      }
    }
  }

  return suggestions;
}

function formatSuggestions(
  suggestions: RefactoringSuggestion[],
  language: Language
): string {
  let output = `# Sugestoes de Refatoracao — Object Calisthenics\n\n`;
  output += `**Linguagem**: ${language}\n`;
  output += `**Sugestoes encontradas**: ${suggestions.length}\n\n`;

  if (suggestions.length === 0) {
    output += `${config.developerName}, o codigo esta em conformidade com as regras de Object Calisthenics analisadas! Nenhuma sugestao de refatoracao no momento.\n`;
    return output;
  }

  output += `---\n\n`;

  for (const s of suggestions) {
    output += `## Regra ${s.ruleNumber}: ${s.rule}\n\n`;
    output += `${s.description}\n\n`;
    output += `**Local**: ${s.location}\n\n`;

    output += `### Antes:\n`;
    output += `\`\`\`${language}\n${s.originalCode}\n\`\`\`\n\n`;

    output += `### Depois:\n`;
    output += `\`\`\`${language}\n${s.refactoredCode}\n\`\`\`\n\n`;

    output += `> ${config.developerName}, deseja aplicar a regra ${s.ruleNumber} (${s.rule}) do Object Calisthenics aqui?\n\n`;
    output += `---\n\n`;
  }

  return output;
}

export function register(server: McpServer): void {
  server.tool(
    "suggest_refactoring",
    "Sugere refatoracoes baseadas nas 9 regras de Object Calisthenics com antes/depois",
    {
      code: z.string().describe("Codigo a ser refatorado"),
      language: languageEnum.describe("Linguagem do codigo"),
      rules: z
        .array(z.string())
        .optional()
        .describe(
          "Regras especificas a verificar (default: todas). Opcoes: indentacao, no-else, encapsular-primitivos, colecoes-primeira-classe, um-ponto-por-linha, nao-abrevie, entidades-pequenas, max-2-variaveis-instancia, sem-getters-setters"
        ),
    },
    async ({ code, language, rules }) => {
      const suggestions = detectAndSuggest(code, language, rules ?? []);
      const text = formatSuggestions(suggestions, language);

      return {
        content: [{ type: "text", text }],
      };
    }
  );
}
