import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

const languageEnum = z.enum(["php", "typescript", "javascript"]);
const categoryEnum = z.enum([
  "comments",
  "functions",
  "general",
  "names",
  "all",
]);

type Language = z.infer<typeof languageEnum>;
type Category = z.infer<typeof categoryEnum>;

interface Smell {
  name: string;
  category: Category;
  location: string;
  description: string;
  suggestion: string;
}

function detectCommentsSmells(code: string, _language: Language): Smell[] {
  const smells: Smell[] = [];
  const lines = code.split("\n");
  let commentBlock = 0;

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    const isCommentedCode =
      trimmed.startsWith("//") &&
      /\/\/\s*(const|let|var|function|if|for|return|class|\$|import|public|private)/.test(
        trimmed
      );
    if (isCommentedCode) {
      commentBlock++;
    } else {
      if (commentBlock >= 1) {
        smells.push({
          name: "Codigo comentado",
          category: "comments",
          location: `Linhas ${i - commentBlock + 1}-${i}`,
          description: `Bloco de codigo comentado (${commentBlock} linhas). Codigo morto polui o codebase.`,
          suggestion:
            "Remova o codigo comentado. Use controle de versao (git) para historico.",
        });
      }
      commentBlock = 0;
    }
  }
  if (commentBlock >= 1) {
    smells.push({
      name: "Codigo comentado",
      category: "comments",
      location: `Linhas ${lines.length - commentBlock + 1}-${lines.length}`,
      description: `Bloco de codigo comentado (${commentBlock} linhas).`,
      suggestion: "Remova o codigo comentado.",
    });
  }
  return smells;
}

function detectFunctionsSmells(code: string, language: Language): Smell[] {
  const smells: Smell[] = [];
  const lines = code.split("\n");

  // Long Method (> 20 linhas)
  let funcStart = -1;
  let funcName = "";
  let braceDepth = 0;
  let inFunc = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const funcMatch = line.match(
      /(?:function|async function|(?:public|private|protected)?\s*(?:async\s+)?)\s*(\w+)\s*\(/
    );
    if (funcMatch && !inFunc) {
      funcStart = i;
      funcName = funcMatch[1] || "anonima";
      braceDepth = 0;
      inFunc = true;
    }
    if (inFunc) {
      braceDepth += (line.match(/{/g) || []).length;
      braceDepth -= (line.match(/}/g) || []).length;
      if (braceDepth <= 0 && funcStart >= 0 && i > funcStart) {
        const funcLength = i - funcStart + 1;
        if (funcLength > 20) {
          smells.push({
            name: "Long Method",
            category: "functions",
            location: `Linhas ${funcStart + 1}-${i + 1} (${funcName}, ${funcLength} linhas)`,
            description: `Funcao '${funcName}' tem ${funcLength} linhas. Prefira funcoes curtas.`,
            suggestion:
              "Extraia blocos logicos em funcoes auxiliares com nomes descritivos.",
          });
        }
        inFunc = false;
      }
    }
  }

  // Flag arguments
  const boolParamPattern =
    /(?:function|async function)\s*\w*\s*\([^)]*\b(flag|enabled|verbose|strict|force|skip)\s*(?::\s*bool(ean)?\s*)?[,)]/gi;
  for (let i = 0; i < lines.length; i++) {
    if (boolParamPattern.test(lines[i])) {
      smells.push({
        name: "Flag argument",
        category: "functions",
        location: `Linha ${i + 1}`,
        description: "Parametro booleano que altera comportamento da funcao.",
        suggestion:
          "Prefira duas funcoes com nomes claros ou objeto de opcoes.",
      });
    }
    boolParamPattern.lastIndex = 0;
  }

  // Dead code: codigo apos return no mesmo bloco (heuristica simples)
  let depth = 0;
  let seenReturn = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    depth += (line.match(/{/g) || []).length;
    depth -= (line.match(/}/g) || []).length;
    if (/^\s*return\s+/.test(line) && depth > 0) seenReturn = true;
    if (seenReturn && depth > 0 && /^\s*(const|let|var|\w+)\s*=/.test(line)) {
      smells.push({
        name: "Possivel dead code",
        category: "functions",
        location: `Linha ${i + 1}`,
        description: "Codigo apos return no mesmo bloco pode ser inalcancavel.",
        suggestion: "Remova ou mova o codigo para antes do return.",
      });
      seenReturn = false;
    }
    if (depth <= 0) seenReturn = false;
  }

  return smells;
}

function detectGeneralSmells(code: string, _language: Language): Smell[] {
  const smells: Smell[] = [];
  const lines = code.split("\n");

  // God class: > 200 linhas ou > 10 metodos
  let inClass = false;
  let classStart = -1;
  let classBraceDepth = 0;
  let methodCount = 0;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^\s*class\s+\w+/.test(line)) {
      inClass = true;
      classStart = i;
      classBraceDepth = 0;
      methodCount = 0;
    }
    if (inClass) {
      classBraceDepth += (line.match(/{/g) || []).length;
      classBraceDepth -= (line.match(/}/g) || []).length;
      if (
        /^\s*(?:async\s+)?(?:public|private|protected)?\s*(?:async\s+)?\w+\s*\([^)]*\)\s*(?::\s*\w+)?\s*[{\{]/.test(
          line
        ) ||
        /^\s*(?:get|set)\s+\w+/.test(line)
      ) {
        methodCount++;
      }
      if (classBraceDepth <= 0 && classStart >= 0) {
        const classLines = i - classStart + 1;
        if (classLines > 200) {
          smells.push({
            name: "God class (classe muito longa)",
            category: "general",
            location: `Linhas ${classStart + 1}-${i + 1} (${classLines} linhas)`,
            description: `Classe com ${classLines} linhas.`,
            suggestion: "Extraia responsabilidades em classes menores (SRP).",
          });
        }
        if (methodCount > 10) {
          smells.push({
            name: "God class (muitos metodos)",
            category: "general",
            location: `Linhas ${classStart + 1}-${i + 1} (${methodCount} metodos)`,
            description: `Classe com ${methodCount} metodos.`,
            suggestion: "Divida a classe em classes menores (SRP).",
          });
        }
        inClass = false;
      }
    }
  }

  // Magic numbers (exceto 0, 1, -1) — categoria general
  const magicNumberPattern = /\b(?:[2-9]\d*|\d{2,}|-\s*[2-9]\d*|-\s*\d{2,})\b/g;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim().startsWith("//") || line.trim().startsWith("*")) continue;
    const match = magicNumberPattern.exec(line);
    magicNumberPattern.lastIndex = 0;
    if (match) {
      const num = match[0].replace(/\s/g, "");
      if (num !== "0" && num !== "1" && num !== "-1") {
        smells.push({
          name: "Magic number",
          category: "general",
          location: `Linha ${i + 1} (valor ${num})`,
          description: `Numero literal '${num}' sem constante nomeada.`,
          suggestion: "Extraia para constante com nome descritivo.",
        });
      }
    }
  }

  // Feature envy (heuristica): linha com multiplas chamadas a mesmo objeto (ex: order.getX().getY())
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim().startsWith("//")) continue;
    const chained = (line.match(/\b\w+\.\w+\s*\(/g) || []).length;
    if (chained >= 3) {
      smells.push({
        name: "Feature envy",
        category: "general",
        location: `Linha ${i + 1}`,
        description:
          "Metodo que usa muitos dados de outro objeto (cadeia de chamadas longa).",
        suggestion:
          "Mova o comportamento para o objeto que possui os dados (Lei de Demeter).",
      });
    }
  }

  // Data clumps (heuristica): mesmo grupo de params repetido em 2+ funcoes
  const paramLists: string[] = [];
  const paramRegex =
    /(?:function|async function)\s*\w*\s*\(([^)]*)\)|(?:public|private|protected)\s+function\s+\w+\s*\(([^)]*)\)/g;
  let m;
  while ((m = paramRegex.exec(code)) !== null) {
    const params = (m[1] || m[2] || "")
      .split(",")
      .map((p) => p.trim().split(/\s+/).pop() || "")
      .filter(Boolean)
      .sort()
      .join(",");
    if (params.length >= 2) paramLists.push(params);
  }
  const hasRepeated =
    paramLists.length >= 2 &&
    paramLists.some((p, i) => paramLists.indexOf(p) !== i);
  if (hasRepeated) {
    smells.push({
      name: "Data clumps",
      category: "general",
      location: "Multiplas funcoes",
      description:
        "Grupos de parametros repetidos em varias funcoes. Indica falta de objeto de valor.",
      suggestion:
        "Extraia o grupo de parametros para um objeto/DTO e passe o objeto.",
    });
  }

  return smells;
}

function detectNamesSmells(code: string, _language: Language): Smell[] {
  const smells: Smell[] = [];
  const lines = code.split("\n");
  const genericPattern =
    /\b(const|let|var|function\s+\w*\([^)]*)\s+(data|info|temp|manager|processor|helper|utils)\b/g;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim().startsWith("//")) continue;
    let match;
    while ((match = genericPattern.exec(lines[i])) !== null) {
      smells.push({
        name: "Nome generico",
        category: "names",
        location: `Linha ${i + 1} ('${match[2]}')`,
        description: `Nome generico '${match[2]}' pouco descritivo.`,
        suggestion:
          "Use nome que revele o proposito (ex.: userList, orderTotal).",
      });
    }
    genericPattern.lastIndex = 0;
  }
  return smells;
}

function filterByCategory(smells: Smell[], category: Category): Smell[] {
  if (category === "all") return smells;
  return smells.filter((s) => s.category === category);
}

function formatOutput(
  code: string,
  language: Language,
  category: Category,
  smells: Smell[]
): string {
  let output = `# Deteccao de Code Smells\n\n`;
  output += `**Linguagem**: ${language}\n`;
  output += `**Categoria**: ${category}\n`;
  output += `**Smells encontrados**: ${smells.length}\n\n`;

  if (smells.length === 0) {
    output +=
      "Nenhum code smell encontrado nesta categoria. O codigo esta em boa forma para os criterios analisados.\n";
    return output;
  }

  output += "---\n\n";
  for (const s of smells) {
    output += `### ${s.name}\n`;
    output += `- **Local**: ${s.location}\n`;
    output += `- **Problema**: ${s.description}\n`;
    output += `- **Sugestao**: ${s.suggestion}\n\n`;
  }
  return output;
}

export function register(server: McpServer): void {
  server.tool(
    "detect_code_smells",
    "Complementa review_code com deteccao de code smells por categoria (comments, functions, general, names, all): magic numbers, flag arguments, feature envy, dead code, God class, nomes genericos, Long Method, Data Clumps",
    {
      code: z.string().describe("Codigo a ser analisado"),
      language: languageEnum.describe("Linguagem do codigo"),
      category: categoryEnum
        .default("all")
        .describe(
          "Categoria de smells: comments, functions, general, names ou all (padrao)"
        ),
    },
    async ({ code, language, category }) => {
      const allSmells: Smell[] = [];
      if (category === "comments" || category === "all") {
        allSmells.push(...detectCommentsSmells(code, language));
      }
      if (category === "functions" || category === "all") {
        allSmells.push(...detectFunctionsSmells(code, language));
      }
      if (category === "general" || category === "all") {
        allSmells.push(...detectGeneralSmells(code, language));
      }
      if (category === "names" || category === "all") {
        allSmells.push(...detectNamesSmells(code, language));
      }
      const filtered = filterByCategory(allSmells, category);
      const text = formatOutput(code, language, category, filtered);
      return {
        content: [{ type: "text", text }],
      };
    }
  );
}
