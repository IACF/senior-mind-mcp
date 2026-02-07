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

  // Magic numbers (exceto 0, 1, -1) — uma violacao por linha para evitar ruido
  const magicNumberPattern = /\b(?:[2-9]\d*|\d{2,}|-\s*[2-9]\d*|-\s*\d{2,})\b/g;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim().startsWith("//") || line.trim().startsWith("*")) continue;
    const match = magicNumberPattern.exec(line);
    magicNumberPattern.lastIndex = 0;
    if (match) {
      const num = match[0].replace(/\s/g, "");
      if (num !== "0" && num !== "1" && num !== "-1") {
        violations.push({
          principle: "Sem Magic Numbers",
          category: "clean-code",
          severity: "media",
          location: `Linha ${i + 1} (valor ${num})`,
          description: `Numero literal '${num}' sem constante nomeada. Dificulta manutencao e significado.`,
          suggestion: `Extraia para uma constante ou variavel com nome descritivo (ex.: MAX_RETRIES, TIMEOUT_MS).`,
        });
      }
    }
  }

  // Boolean/flag arguments
  const boolParamPattern =
    /(?:function|async function)\s*\w*\s*\([^)]*\b(flag|enabled|verbose|strict|force|skip)\s*(?::\s*bool(ean)?\s*)?[,)]/gi;
  for (let i = 0; i < lines.length; i++) {
    if (boolParamPattern.test(lines[i])) {
      violations.push({
        principle: "Evitar Argumentos Booleanos (Flag)",
        category: "clean-code",
        severity: "media",
        location: `Linha ${i + 1}`,
        description: `Parametro booleano que altera comportamento da funcao detectado.`,
        suggestion: `Prefira duas funcoes com nomes claros ou um objeto de opcoes em vez de um parametro booleano.`,
      });
    }
    boolParamPattern.lastIndex = 0;
  }

  // God class: mais de 200 linhas ou mais de 10 metodos
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
          violations.push({
            principle: "God Class (classe muito longa)",
            category: "clean-code",
            severity: "alta",
            location: `Linhas ${classStart + 1}-${i + 1} (${classLines} linhas)`,
            description: `Classe com ${classLines} linhas. Classes devem ser pequenas e coesas.`,
            suggestion: `Extraia responsabilidades em classes menores (SRP). Considere composicao.`,
          });
        }
        if (methodCount > 10) {
          violations.push({
            principle: "God Class (muitos metodos)",
            category: "clean-code",
            severity: "alta",
            location: `Linhas ${classStart + 1}-${i + 1} (${methodCount} metodos)`,
            description: `Classe com ${methodCount} metodos. Indica excesso de responsabilidades.`,
            suggestion: `Divida a classe em classes menores com responsabilidade unica (SRP).`,
          });
        }
        inClass = false;
      }
    }
  }

  // Missing return types (TypeScript/JavaScript)
  if (["typescript", "javascript", "vue", "react"].includes(language)) {
    const noReturnType =
      /(?:function|async function)\s+(\w+)\s*\([^)]*\)\s*(?!\s*:)\s*\{/;
    for (let i = 0; i < lines.length; i++) {
      const match = lines[i].match(noReturnType);
      if (match && !lines[i].trim().startsWith("//")) {
        violations.push({
          principle: "Tipos de Retorno Explicitos",
          category: "clean-code",
          severity: "media",
          location: `Linha ${i + 1} (funcao '${match[1]}')`,
          description: `Funcao '${match[1]}' sem tipo de retorno explicito.`,
          suggestion: `Adicione o tipo de retorno (ex.: : Promise<void>, : number) para melhor documentacao e type safety.`,
        });
      }
    }
  }

  // Nomes genericos: data, info, temp, manager, processor, helper, utils
  const genericNamePattern =
    /\b(const|let|var|function\s+\w*\([^)]*)\s+(data|info|temp|manager|processor|helper|utils)\b/g;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim().startsWith("//")) continue;
    let match;
    while ((match = genericNamePattern.exec(lines[i])) !== null) {
      violations.push({
        principle: "Nomes Significativos (evitar genericos)",
        category: "clean-code",
        severity: "media",
        location: `Linha ${i + 1} ('${match[2]}')`,
        description: `Nome generico '${match[2]}' pouco descritivo.`,
        suggestion: `Use um nome que revele o proposito (ex.: userList, orderTotal, configMap).`,
      });
    }
    genericNamePattern.lastIndex = 0;
  }

  // Retorno de null
  for (let i = 0; i < lines.length; i++) {
    if (/return\s+null\s*;/.test(lines[i]) && !lines[i].trim().startsWith("//")) {
      violations.push({
        principle: "Evitar Retorno de null",
        category: "clean-code",
        severity: "media",
        location: `Linha ${i + 1}`,
        description: `Retorno de null detectado. Pode causar NullPointerException e codigo defensivo excessivo.`,
        suggestion: `Prefira Optional/Maybe, lancar excecao ou retornar objeto vazio conforme o dominio.`,
      });
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

  // Regra 4: Colecoes em primeira classe (evitar array/lista exposta sem classe propria)
  const collectionPattern =
    /\b(items|list|array|collection)\s*:\s*(?:\w+\[\]|Array\s*<[\w\s,]+>)/g;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim().startsWith("//")) continue;
    let match;
    while ((match = collectionPattern.exec(lines[i])) !== null) {
      violations.push({
        principle: "Regra 4: Colecoes em primeira classe",
        category: "object-calisthenics",
        severity: "media",
        location: `Linha ${i + 1} ('${match[1]}')`,
        description: `Colecao '${match[1]}' exposta como array/lista. Prefira uma classe que encapsule a colecao.`,
        suggestion: `Crie uma classe (ex.: OrderItems, UserList) que encapsule a colecao e exponha comportamento em vez do array cru.`,
      });
    }
    collectionPattern.lastIndex = 0;
  }

  // Regra 7: Classe com mais de 50 linhas
  let ocInClass = false;
  let ocClassStart = -1;
  let ocClassDepth = 0;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^\s*class\s+\w+/.test(line)) {
      ocInClass = true;
      ocClassStart = i;
      ocClassDepth = 0;
    }
    if (ocInClass) {
      ocClassDepth += (line.match(/{/g) || []).length;
      ocClassDepth -= (line.match(/}/g) || []).length;
      if (ocClassDepth <= 0 && ocClassStart >= 0) {
        const classLines = i - ocClassStart + 1;
        if (classLines > 50) {
          violations.push({
            principle: "Regra 7: Classe pequena (max 50 linhas)",
            category: "object-calisthenics",
            severity: "media",
            location: `Linhas ${ocClassStart + 1}-${i + 1} (${classLines} linhas)`,
            description: `Classe com ${classLines} linhas. Object Calisthenics: maximo 50 linhas por classe.`,
            suggestion: `Extraia responsabilidades em classes menores.`,
          });
        }
        ocInClass = false;
      }
    }
  }

  // Regra 8: Classe com mais de 2 variaveis de instancia
  ocInClass = false;
  ocClassStart = -1;
  ocClassDepth = 0;
  let instanceVarCount = 0;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^\s*class\s+\w+/.test(line)) {
      ocInClass = true;
      ocClassStart = i;
      ocClassDepth = 0;
      instanceVarCount = 0;
    }
    if (ocInClass) {
      ocClassDepth += (line.match(/{/g) || []).length;
      ocClassDepth -= (line.match(/}/g) || []).length;
      if (
        /^\s*(?:readonly\s+)?(?:public|private|protected)\s+(?:readonly\s+)?\w+(\s*:\s*[\w<>\[\]]+)?\s*[;=]/.test(
          line
        ) ||
        /^\s*(?:private|protected|public)\s+\$\w+/.test(line)
      ) {
        instanceVarCount++;
      }
      if (ocClassDepth <= 0 && ocClassStart >= 0) {
        if (instanceVarCount > 2) {
          violations.push({
            principle: "Regra 8: Maximo 2 variaveis de instancia",
            category: "object-calisthenics",
            severity: "media",
            location: `Linhas ${ocClassStart + 1}-${i + 1} (${instanceVarCount} variaveis)`,
            description: `Classe com ${instanceVarCount} variaveis de instancia. Object Calisthenics: maximo 2.`,
            suggestion: `Agrupe variaveis em objetos de valor ou extraia em classes relacionadas.`,
          });
        }
        ocInClass = false;
      }
    }
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
