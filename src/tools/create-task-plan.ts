import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

const technologyEnum = z.enum(["laravel", "nestjs", "generic"]);
const taskTypeEnum = z.enum([
  "nova-feature",
  "bug-fix",
  "refatoracao",
  "modulo",
  "servico",
]);

type Technology = z.infer<typeof technologyEnum>;
type TaskType = z.infer<typeof taskTypeEnum>;

interface ParsedPhase {
  number: number;
  name: string;
  testFile: string;
  sourceFiles: string[];
}

interface Commands {
  test: string;
  testFile: string;
  lint?: string;
}

// ─── Brief parsers ────────────────────────────────────────────────────────────

function toSlug(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .substring(0, 60);
}

function extractTaskName(brief: string): string {
  const match = brief.match(/^# Task Brief — (.+)$/m);
  return match ? match[1].trim() : "Task";
}

function extractCommands(brief: string): Commands {
  const sectionMatch = brief.match(
    /## Comandos do Projeto\n([\s\S]*?)(?=\n## |\n---)/
  );
  if (!sectionMatch) return { test: "", testFile: "" };

  const section = sectionMatch[1];
  const testMatch = section.match(/- Rodar todos os testes: (.+)/);
  const testFileMatch = section.match(/- Rodar testes de um arquivo: (.+)/);
  const lintMatch = section.match(/- Linting: (.+)/);

  return {
    test: testMatch ? testMatch[1].trim() : "",
    testFile: testFileMatch ? testFileMatch[1].trim() : "",
    lint: lintMatch ? lintMatch[1].trim() : undefined,
  };
}

function extractPhases(brief: string): ParsedPhase[] {
  const phases: ParsedPhase[] = [];
  const phaseRegex =
    /### Fase (\d+) — ([^\n]+)\n([\s\S]*?)(?=### Fase \d+|## Verificacao|---\nQuais|$)/g;

  let match: RegExpExecArray | null;
  while ((match = phaseRegex.exec(brief)) !== null) {
    const number = parseInt(match[1], 10);
    const name = match[2].trim();
    const content = match[3];

    // Extract test file: first backtick path after "RED —"
    const redMatch = content.match(/RED — `([^`]+)`/);
    const testFile = redMatch ? redMatch[1] : "";

    // Extract source files: all backtick paths on the GREEN line
    const sourceFiles: string[] = [];
    const greenLineMatch = content.match(/GREEN — ([^\n]+)/);
    if (greenLineMatch) {
      const backtickMatches = greenLineMatch[1].matchAll(/`([^`]+)`/g);
      for (const bm of backtickMatches) {
        const path = bm[1];
        if (path.includes("/") || (path.includes(".") && !path.includes(" "))) {
          sourceFiles.push(path);
        }
      }
    }

    phases.push({ number, name, testFile, sourceFiles });
  }

  return phases;
}

// ─── Plan generator ───────────────────────────────────────────────────────────

function generatePlan(
  brief: string,
  technology: Technology,
  taskType: TaskType,
  selectedPhases: number[] | "all"
) {
  const taskName = extractTaskName(brief);
  const slug = toSlug(taskName);
  const commands = extractCommands(brief);
  const parsedPhases = extractPhases(brief);

  const phases = parsedPhases.map((p) => {
    const isSelected =
      selectedPhases === "all" || selectedPhases.includes(p.number);
    return {
      number: p.number,
      name: p.name,
      selected: isSelected,
      status: isSelected ? "pending" : "skipped",
      testFile: p.testFile,
      sourceFiles: p.sourceFiles,
      tddPhase: "red",
      qualityGates: [
        "Todos os testes da fase passam",
        "review_code sem violacoes altas",
        "lint passa",
      ],
    };
  });

  return {
    task: taskName,
    briefFile: `.senior-mind/${slug}-brief.md`,
    technology,
    taskType,
    generatedAt: new Date().toISOString(),
    commands,
    phases,
  };
}

// ─── Tool registration ────────────────────────────────────────────────────────

export function register(server: McpServer): void {
  server.tool(
    "create_task_plan",
    "Gera o task-plan.json a partir do brief confirmado e das fases selecionadas pelo dev",
    {
      brief: z
        .string()
        .describe("Conteudo completo do task-brief.md confirmado pelo dev"),
      technology: technologyEnum.describe("Stack tecnologica do projeto"),
      taskType: taskTypeEnum.describe("Tipo da tarefa"),
      selectedPhases: z
        .union([z.array(z.number()), z.literal("all")])
        .describe(
          'Fases selecionadas para execucao agora: array de numeros (ex: [1, 2]) ou "all"'
        ),
    },
    async ({ brief, technology, taskType, selectedPhases }) => {
      const plan = generatePlan(brief, technology, taskType, selectedPhases);
      const text = JSON.stringify(plan, null, 2);
      return { content: [{ type: "text", text }] };
    }
  );
}
