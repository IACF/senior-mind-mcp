import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { config } from "../config.js";

const languageEnum = z.enum([
  "php",
  "typescript",
  "javascript",
  "vue",
  "react",
]);
const focusEnum = z.enum(["clean-code", "object-calisthenics", "all"]);

type Language = z.infer<typeof languageEnum>;
type Focus = z.infer<typeof focusEnum>;

interface Violation {
  principle: string;
  category: "clean-code" | "object-calisthenics";
  severity: "alta" | "media" | "baixa";
  location: string;
  description: string;
  suggestion: string;
}

function detectCleanCodeViolations(
  code: string,
  language: Language
): Violation[] {
  const violations: Violation[] = [];
  const lines = code.split("\n");

  // Deteccao de funcoes/metodos longos (> 20 linhas)
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
          violations.push({
            principle: "Funcoes Pequenas",
            category: "clean-code",
            severity: funcLength > 40 ? "alta" : "media",
            location: `Linhas ${funcStart + 1}-${i + 1} (funcao '${funcName}', ${funcLength} linhas)`,
            description: `A funcao '${funcName}' tem ${funcLength} linhas. Funcoes devem ter menos de 20 linhas.`,
            suggestion: `Extraia blocos logicos em funcoes auxiliares com nomes descritivos. Cada funcao deve fazer apenas UMA coisa.`,
          });
        }
        inFunc = false;
        funcStart = -1;
      }
    }
  }

  // Deteccao de nomes curtos (variaveis de 1-2 caracteres)
  const shortVarPattern =
    /(?:const|let|var|int|string|float|bool|\$)\s+([a-zA-Z$_]{1,2})(?:\s*[=:;,)])/g;
  for (let i = 0; i < lines.length; i++) {
    let match;
    while ((match = shortVarPattern.exec(lines[i])) !== null) {
      const varName = match[1];
      if (!["id", "i", "j", "k", "e", "db", "fn"].includes(varName)) {
        violations.push({
          principle: "Nomes Significativos",
          category: "clean-code",
          severity: "media",
          location: `Linha ${i + 1} (variavel '${varName}')`,
          description: `A variavel '${varName}' tem nome muito curto e pouco descritivo.`,
          suggestion: `Use um nome que revele a intencao, ex.: em vez de '${varName}', use um nome descritivo do que a variavel representa.`,
        });
      }
    }
    shortVarPattern.lastIndex = 0;
  }

  // Deteccao de any (TypeScript/JavaScript)
  if (["typescript", "javascript", "vue", "react"].includes(language)) {
    for (let i = 0; i < lines.length; i++) {
      if (/:\s*any\b/.test(lines[i]) || /as\s+any\b/.test(lines[i])) {
        violations.push({
          principle: "Tipagem Forte",
          category: "clean-code",
          severity: "alta",
          location: `Linha ${i + 1}`,
          description: `Uso de 'any' detectado. Isso desabilita o type checking e pode esconder bugs.`,
          suggestion: `Substitua 'any' por um tipo especifico ou use 'unknown' se o tipo e realmente desconhecido.`,
        });
      }
    }
  }

  // Deteccao de console.log em codigo de producao
  for (let i = 0; i < lines.length; i++) {
    if (/console\.(log|warn|error|info)\s*\(/.test(lines[i])) {
      violations.push({
        principle: "Sem Efeitos Colaterais Ocultos",
        category: "clean-code",
        severity: "baixa",
        location: `Linha ${i + 1}`,
        description: `Uso de console.log detectado. Logs de debug nao devem ir para producao.`,
        suggestion: `Remova o console.log ou substitua por um logger estruturado (ex.: Winston, Pino).`,
      });
    }
  }

  // Deteccao de funcoes com muitos parametros (> 3)
  const paramPattern =
    /(?:function|async function)\s*\w*\s*\(([^)]{50,})\)|(?:\(([^)]{50,})\)\s*(?:=>|:))/g;
  for (let i = 0; i < lines.length; i++) {
    let match;
    while ((match = paramPattern.exec(lines[i])) !== null) {
      const params = (match[1] || match[2] || "").split(",");
      if (params.length > 3) {
        violations.push({
          principle: "Poucos Argumentos de Funcao",
          category: "clean-code",
          severity: "media",
          location: `Linha ${i + 1} (${params.length} parametros)`,
          description: `Funcao com ${params.length} parametros. O ideal e 0-2, maximo 3.`,
          suggestion: `Agrupe os parametros em um objeto (ex.: DTO, options object) para melhorar legibilidade.`,
        });
      }
    }
    paramPattern.lastIndex = 0;
  }

  // Deteccao de codigo comentado
  let commentBlock = 0;
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (
      trimmed.startsWith("//") &&
      /\/\/\s*(const|let|var|function|if|for|return|class|\$|import)/.test(
        trimmed
      )
    ) {
      commentBlock++;
    } else {
      if (commentBlock >= 2) {
        violations.push({
          principle: "Sem Codigo Comentado",
          category: "clean-code",
          severity: "baixa",
          location: `Linhas ${i - commentBlock + 1}-${i}`,
          description: `Bloco de codigo comentado detectado (${commentBlock} linhas). Codigo morto polui o codebase.`,
          suggestion: `Remova o codigo comentado. Use controle de versao (git) para recuperar codigo antigo se necessario.`,
        });
      }
      commentBlock = 0;
    }
  }

  return violations;
}

function detectCalisthenicsViolations(
  code: string,
  _language: Language
): Violation[] {
  const violations: Violation[] = [];
  const lines = code.split("\n");

  // Regra 1: Um nivel de indentacao por metodo
  let inMethod = false;
  let methodStart = -1;
  let methodName = "";
  let maxIndent = 0;
  let baseBraceDepth = 0;
  let braceDepth = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const funcMatch = line.match(
      /(?:function|async function|(?:public|private|protected)\s+(?:async\s+)?(?:function\s+)?)\s*(\w+)\s*\(/
    );

    if (funcMatch && !inMethod) {
      inMethod = true;
      methodStart = i;
      methodName = funcMatch[1] || "anonimo";
      baseBraceDepth = braceDepth;
      maxIndent = 0;
    }

    braceDepth += (line.match(/{/g) || []).length;
    braceDepth -= (line.match(/}/g) || []).length;

    if (inMethod) {
      const relativeDepth = braceDepth - baseBraceDepth;
      if (relativeDepth > maxIndent) {
        maxIndent = relativeDepth;
      }

      if (braceDepth <= baseBraceDepth) {
        if (maxIndent > 2) {
          violations.push({
            principle:
              "Regra 1: Um nivel de indentacao por metodo",
            category: "object-calisthenics",
            severity: "media",
            location: `Linhas ${methodStart + 1}-${i + 1} (metodo '${methodName}')`,
            description: `O metodo '${methodName}' tem ${maxIndent - 1} niveis de indentacao. O ideal e no maximo 1.`,
            suggestion: `Extraia blocos internos (loops, ifs aninhados) para metodos separados.`,
          });
        }
        inMethod = false;
      }
    }
  }

  // Regra 2: Nao use ELSE
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (
      /\belse\b/.test(trimmed) &&
      !trimmed.startsWith("//") &&
      !trimmed.startsWith("*")
    ) {
      violations.push({
        principle: "Regra 2: Nao use ELSE",
        category: "object-calisthenics",
        severity: "media",
        location: `Linha ${i + 1}`,
        description: `Uso de 'else' detectado. Object Calisthenics recomenda eliminar else.`,
        suggestion: `Use early return, guard clauses ou polimorfismo em vez de else.`,
      });
    }
  }

  // Regra 5: Um ponto por linha (cadeias de chamadas)
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith("//") || line.startsWith("*") || line.startsWith("import")) continue;

    const dots = (line.match(/\.\w+\s*\(/g) || []).length;
    if (dots > 2) {
      violations.push({
        principle: "Regra 5: Um ponto por linha",
        category: "object-calisthenics",
        severity: "baixa",
        location: `Linha ${i + 1}`,
        description: `${dots} chamadas encadeadas detectadas. Isso pode violar a Lei de Demeter.`,
        suggestion: `Quebre a cadeia em variaveis intermediarias ou delegue a responsabilidade ao objeto.`,
      });
    }
  }

  // Regra 6: Nao abrevie
  const abbreviationPattern =
    /\b([a-z]{1,3}(?:Mgr|Ctrl|Svc|Impl|Tmp|Buf|Cnt|Idx|Srv|Proc|Cfg|Dlg|Btn|Lbl|Msg))\b/g;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim().startsWith("//") || lines[i].trim().startsWith("*"))
      continue;
    let match;
    while ((match = abbreviationPattern.exec(lines[i])) !== null) {
      violations.push({
        principle: "Regra 6: Nao abrevie",
        category: "object-calisthenics",
        severity: "baixa",
        location: `Linha ${i + 1} ('${match[1]}')`,
        description: `Nome abreviado '${match[1]}' detectado. Use nomes completos e descritivos.`,
        suggestion: `Renomeie para o nome completo (ex.: 'Mgr' → 'Manager', 'Ctrl' → 'Controller', 'Svc' → 'Service').`,
      });
    }
    abbreviationPattern.lastIndex = 0;
  }

  // Regra 9: Sem getters/setters
  const getSetPattern =
    /\b(get|set)\s+(\w+)\s*\(|(?:public|protected)\s+(?:function\s+)?(get|set)(\w+)\s*\(/;
  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(getSetPattern);
    if (match) {
      const type = match[1] || match[3];
      const name = match[2] || match[4];
      violations.push({
        principle: "Regra 9: Sem getters/setters (Tell, Don't Ask)",
        category: "object-calisthenics",
        severity: "media",
        location: `Linha ${i + 1} (${type} ${name})`,
        description: `${type === "get" ? "Getter" : "Setter"} '${name}' detectado. Prefira dizer ao objeto o que fazer em vez de pedir dados.`,
        suggestion: `Em vez de expor dados com ${type}ters, crie metodos que executem a acao desejada no proprio objeto.`,
      });
    }
  }

  return violations;
}

function formatViolations(
  code: string,
  language: Language,
  focus: Focus,
  violations: Violation[]
): string {
  let output = `# Review de Codigo\n\n`;
  output += `**Linguagem**: ${language}\n`;
  output += `**Foco**: ${focus === "all" ? "Clean Code + Object Calisthenics" : focus}\n`;
  output += `**Violacoes encontradas**: ${violations.length}\n\n`;

  if (violations.length === 0) {
    output += `${config.developerName}, o codigo esta em boa forma! Nenhuma violacao significativa encontrada nos criterios analisados.\n`;
    return output;
  }

  output += `---\n\n`;

  const highViolations = violations.filter((v) => v.severity === "alta");
  const medViolations = violations.filter((v) => v.severity === "media");
  const lowViolations = violations.filter((v) => v.severity === "baixa");

  if (highViolations.length > 0) {
    output += `## 🔴 Severidade Alta (${highViolations.length})\n\n`;
    for (const v of highViolations) {
      output += `### ${v.principle}\n`;
      output += `- **Local**: ${v.location}\n`;
      output += `- **Problema**: ${v.description}\n`;
      output += `- **Sugestao**: ${v.suggestion}\n\n`;
    }
  }

  if (medViolations.length > 0) {
    output += `## 🟡 Severidade Media (${medViolations.length})\n\n`;
    for (const v of medViolations) {
      output += `### ${v.principle}\n`;
      output += `- **Local**: ${v.location}\n`;
      output += `- **Problema**: ${v.description}\n`;
      output += `- **Sugestao**: ${v.suggestion}\n\n`;
    }
  }

  if (lowViolations.length > 0) {
    output += `## 🟢 Severidade Baixa (${lowViolations.length})\n\n`;
    for (const v of lowViolations) {
      output += `### ${v.principle}\n`;
      output += `- **Local**: ${v.location}\n`;
      output += `- **Problema**: ${v.description}\n`;
      output += `- **Sugestao**: ${v.suggestion}\n\n`;
    }
  }

  output += `---\n\n`;
  output += `${config.developerName}, revise as violacoes acima priorizando as de severidade alta. Cada correcao melhora a qualidade e manutencibilidade do codigo.\n`;

  return output;
}

export function register(server: McpServer): void {
  server.tool(
    "review_code",
    "Revisa codigo contra principios de Clean Code e Object Calisthenics, identificando violacoes",
    {
      code: z.string().describe("Codigo a ser revisado"),
      language: languageEnum.describe("Linguagem do codigo"),
      focus: focusEnum
        .default("all")
        .describe(
          "Foco da revisao: clean-code, object-calisthenics ou all (padrao)"
        ),
    },
    async ({ code, language, focus }) => {
      let violations: Violation[] = [];

      if (focus === "clean-code" || focus === "all") {
        violations.push(...detectCleanCodeViolations(code, language));
      }

      if (focus === "object-calisthenics" || focus === "all") {
        violations.push(...detectCalisthenicsViolations(code, language));
      }

      const text = formatViolations(code, language, focus, violations);

      return {
        content: [{ type: "text", text }],
      };
    }
  );
}
