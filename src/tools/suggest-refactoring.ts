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

  // Regra 2: Nao use ELSE — refatoracao ESPECIFICA baseada no codigo do usuario
  if (shouldCheck("no-else")) {
    for (let i = 0; i < lines.length; i++) {
      const trimmed = lines[i].trim();
      if (
        /\belse\b/.test(trimmed) &&
        !trimmed.startsWith("//") &&
        !trimmed.startsWith("*")
      ) {
        let blockStart = i;
        for (let j = i - 1; j >= 0; j--) {
          if (lines[j].trim().startsWith("if")) {
            blockStart = j;
            break;
          }
        }
        const blockLines = lines.slice(
          blockStart,
          Math.min(i + 6, lines.length)
        );
        const originalBlock = blockLines.join("\n");

        // Extrai condicao do if (primeira linha do bloco)
        const ifLine = blockLines[0];
        const condMatch = ifLine.match(/if\s*\(\s*([^)]+)\s*\)/);
        const condition = condMatch ? condMatch[1].trim() : "condicao";

        // Extrai corpo do else (linhas apos "else")
        const elseStart = blockLines.findIndex((l) => /\belse\b/.test(l));
        const elseBodyLines =
          elseStart >= 0
            ? blockLines.slice(elseStart + 1).filter((l) => l.trim() !== "{")
            : [];
        const elseBody = elseBodyLines
          .map((l) => l.trim())
          .filter((s) => s && s !== "}")
          .join("\n  ");

        // Corpo do if (entre if e else)
        const ifBodyLines = blockLines
          .slice(1, elseStart >= 0 ? elseStart : blockLines.length)
          .filter((l) => l.trim() !== "{" && l.trim() !== "}");
        const ifBody = ifBodyLines
          .map((l) => l.trim())
          .filter((s) => s && s !== "}")
          .join("\n  ");

        const indent = language === "php" ? "    " : "  ";
        const refactored =
          language === "php"
            ? `// Early return (invertido):\nif (!(${condition})) {\n${indent}${elseBody.replace(/\n/g, "\n" + indent)}\n}\n\n${ifBody.replace(/\n/g, "\n" + indent)}`
            : `// Early return (invertido):\nif (!(${condition})) {\n${indent}${elseBody.replace(/\n/g, "\n" + indent)}\n}\n\n${ifBody.replace(/\n/g, "\n" + indent)}`;

        suggestions.push({
          rule: "Nao use ELSE",
          ruleNumber: 2,
          description:
            "Elimine else usando early return, guard clauses ou polimorfismo. Isso torna o codigo mais linear e facil de acompanhar.",
          originalCode: originalBlock,
          refactoredCode: refactored,
          location: `Linha ${i + 1}`,
        });
        break;
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

  // Regra 4: Colecoes em primeira classe
  if (shouldCheck("colecoes-primeira-classe")) {
    const collectionPattern =
      /\b(items|list|array|collection)\s*:\s*(?:\w+\[\]|Array\s*<[\w\s,]+>)/g;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim().startsWith("//")) continue;
      const match = collectionPattern.exec(lines[i]);
      collectionPattern.lastIndex = 0;
      if (match) {
        const name = match[1];
        const suggestedClassName =
          name === "items"
            ? "OrderItems"
            : name === "list"
              ? "UserList"
              : name === "array"
                ? "ItemCollection"
                : "Collection";
        const refactored =
          language === "php"
            ? `// Encapsule em classe:\nclass ${suggestedClassName} {\n  public function __construct(private array $items) {}\n  public function count(): int { return count($this->items); }\n  public function add($item): void { $this->items[] = $item; }\n}\n\nfunction process(${suggestedClassName} $${name}) { /* ... */ }`
            : `// Encapsule em classe:\nclass ${suggestedClassName} {\n  constructor(private items: unknown[]) {}\n  get count(): number { return this.items.length; }\n  add(item: unknown): void { this.items.push(item); }\n}\n\nfunction process(${name}: ${suggestedClassName}) { /* ... */ }`;

        suggestions.push({
          rule: "Colecoes em primeira classe",
          ruleNumber: 4,
          description:
            "Em vez de expor array/lista crua, crie uma classe que encapsule a colecao e exponha comportamento.",
          originalCode: lines[i].trim(),
          refactoredCode: refactored,
          location: `Linha ${i + 1} ('${name}')`,
        });
        break;
      }
    }
  }

  // Regra 5: Um ponto por linha — codigo refatorado mais especifico quando possivel
  if (shouldCheck("um-ponto-por-linha")) {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith("//") || line.startsWith("*") || line.startsWith("import")) continue;

      const dots = (line.match(/\.\w+\s*\(/g) || []).length;
      if (dots > 2) {
        const parts = line.split(/\s*=\s*/);
        const chain = parts.length > 1 ? parts[1].trim() : line;
        const refactored =
          language === "php"
            ? `// Quebre a cadeia em passos:\n$step1 = ${chain.split(".")[0]};\n$step2 = $step1->${chain.split(".")[1]?.replace(/\(\)$/, "()") ?? "nextMethod"}();\n$result = $step2->${chain.split(".")[2]?.replace(/\(\)$/, "()") ?? "finalMethod"}();`
            : `// Quebre a cadeia em passos:\nconst step1 = ${chain.split(".")[0]};\nconst step2 = step1.${chain.split(".")[1] ?? "nextMethod"}();\nconst result = step2.${chain.split(".")[2] ?? "finalMethod"}();`;

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

  // Regra 6: Nao abrevie
  if (shouldCheck("nao-abrevie")) {
    const abbreviationPattern =
      /\b([a-zA-Z]+(?:Mgr|Ctrl|Svc|Impl|Tmp|Buf|Cnt|Idx|Srv|Proc|Cfg|Dlg|Btn|Lbl|Msg))\b/g;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim().startsWith("//")) continue;
      const match = abbreviationPattern.exec(lines[i]);
      abbreviationPattern.lastIndex = 0;
      if (match) {
        const abbr = match[1];
        const full =
          abbr.includes("Mgr")
            ? abbr.replace("Mgr", "Manager")
            : abbr.includes("Svc")
              ? abbr.replace("Svc", "Service")
              : abbr.includes("Ctrl")
                ? abbr.replace("Ctrl", "Controller")
                : abbr + " (nome completo)";

        suggestions.push({
          rule: "Nao abrevie",
          ruleNumber: 6,
          description:
            "Use nomes completos e descritivos. Abreviacoes prejudicam a leitura e o dominio.",
          originalCode: lines[i].trim(),
          refactoredCode: `// Renomeie '${abbr}' para '${full}' em toda a base de codigo.`,
          location: `Linha ${i + 1} ('${abbr}')`,
        });
        break;
      }
    }
  }

  // Regra 7: Entidades pequenas (classe max 50 linhas)
  if (shouldCheck("entidades-pequenas")) {
    let inClass = false;
    let classStart = -1;
    let className = "";
    let classDepth = 0;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const classMatch = line.match(/^\s*class\s+(\w+)/);
      if (classMatch) {
        inClass = true;
        classStart = i;
        className = classMatch[1];
        classDepth = 0;
      }
      if (inClass) {
        classDepth += (line.match(/{/g) || []).length;
        classDepth -= (line.match(/}/g) || []).length;
        if (classDepth <= 0 && classStart >= 0) {
          const classLines = i - classStart + 1;
          if (classLines > 50) {
            const originalBlock = lines
              .slice(classStart, Math.min(classStart + 5, i + 1))
              .join("\n");
            const refactored =
              `// Classe '${className}' tem ${classLines} linhas. Extraia responsabilidades:\n` +
              `// Ex.: class ${className}Validation { ... }\n` +
              `// Ex.: class ${className}Formatter { ... }\n` +
              `// Mantenha ${className} como orquestrador fino.`;

            suggestions.push({
              rule: "Entidades pequenas (max 50 linhas)",
              ruleNumber: 7,
              description:
                "Classes devem ter no maximo 50 linhas. Extraia blocos em classes auxiliares.",
              originalCode: originalBlock + "\n// ... (" + classLines + " linhas no total)",
              refactoredCode: refactored,
              location: `Linhas ${classStart + 1}-${i + 1} (classe '${className}')`,
            });
          }
          inClass = false;
        }
      }
    }
  }

  // Regra 8: Maximo 2 variaveis de instancia
  if (shouldCheck("max-2-variaveis-instancia")) {
    let inClass = false;
    let classStart = -1;
    let classDepth = 0;
    let instanceVarCount = 0;
    const varNames: string[] = [];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const classMatch = line.match(/^\s*class\s+(\w+)/);
      if (classMatch) {
        inClass = true;
        classStart = i;
        classDepth = 0;
        instanceVarCount = 0;
        varNames.length = 0;
      }
      if (inClass) {
        classDepth += (line.match(/{/g) || []).length;
        classDepth -= (line.match(/}/g) || []).length;
        const propMatch = line.match(
          /^\s*(?:readonly\s+)?(?:public|private|protected)\s+(?:readonly\s+)?(\w+)\s*[:=]|^\s*(?:private|protected|public)\s+\$(\w+)/
        );
        if (propMatch) {
          instanceVarCount++;
          varNames.push(propMatch[1] || propMatch[2] || "");
        }
        if (classDepth <= 0 && classStart >= 0 && instanceVarCount > 2) {
          const refactored =
            `// Agrupe as ${instanceVarCount} variaveis (${varNames.slice(0, 5).join(", ")}${varNames.length > 5 ? "..." : ""}) em um ou dois objetos de valor:\n` +
            `// Ex.: private readonly config: ConfigCompleto; // agrupa varias props\n` +
            `// Ou extraia uma classe relacionada que carregue parte das responsabilidades.`;

          suggestions.push({
            rule: "Maximo 2 variaveis de instancia",
            ruleNumber: 8,
            description:
              "Object Calisthenics: cada classe no maximo 2 variaveis de instancia. Agrupe em value objects.",
            originalCode: lines.slice(classStart, Math.min(classStart + 8, i + 1)).join("\n"),
            refactoredCode: refactored,
            location: `Linhas ${classStart + 1}-${i + 1} (${instanceVarCount} variaveis)`,
          });
          inClass = false;
        } else if (classDepth <= 0) {
          inClass = false;
        }
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
