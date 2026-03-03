import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

function isFaseCommand(input: string): boolean {
  const normalized = input.toLowerCase().trim();
  return (
    normalized.startsWith("fase ") ||
    normalized === "todas as fases" ||
    normalized.includes("todas as fases")
  );
}

function buildModoACommandCollection(): string {
  let section = `## ETAPA 0 — Coletar comandos do projeto (ANTES do brief)\n\n`;
  section += `Perguntar ao dev:\n\n`;
  section += `1. "Qual o comando para rodar **todos os testes** do projeto?"\n`;
  section += `2. "Qual o comando para rodar os testes de **um arquivo específico**? (inclua o placeholder usado, ex: \`--filter {class}\` ou \`--testPathPattern\`)"\n`;
  section += `3. "Existe algum comando de **linting** ou verificação de padrão de código? (ex: phpcs, eslint)"\n`;
  section += `4. "Existe algum outro comando relevante para o ciclo de desenvolvimento? (ex: build, migrate, seed)"\n\n`;
  section += `Aguardar as respostas antes de prosseguir.\n\n`;
  return section;
}

function buildModoABriefGeneration(): string {
  let section = `## ETAPA 1 — Gerar o brief\n\n`;
  section += `1. Extrair \`task\`, \`technology\`, \`taskType\` da descrição do dev (perguntar se não ficar claro)\n`;
  section += `2. Gerar slug: kebab-case do nome da tarefa (ex: \`implementar-login-jwt\`)\n`;
  section += `3. Chamar \`create_task_brief(task, technology, taskType, testCommand, testFileCommand, lintCommand?, otherCommands?, requirements?, context?)\`\n`;
  section += `4. Salvar o conteúdo retornado em \`.senior-mind/[slug]-brief.md\` no projeto do dev\n`;
  section += `5. **PARAR** e exibir:\n\n`;
  section += `\`\`\`\n`;
  section += `Salvei .senior-mind/[slug]-brief.md.\n\n`;
  section += `Abra o arquivo e revise o plano técnico — arquivos, fases e TDD.\n\n`;
  section += `Quando confirmar, me informe quais fases deseja executar agora:\n`;
  section += `- "todas" → executa todas as fases\n`;
  section += `- "1" → executa apenas a Fase 1\n`;
  section += `- "2 e 3" → executa as Fases 2 e 3\n`;
  section += `- "1, 3, 5" → executa as Fases 1, 3 e 5\n`;
  section += `\`\`\`\n\n`;
  return section;
}

function buildModoAPlanSelection(): string {
  let section = `## ETAPA 2 — Selecionar fases e gerar o plano\n\n`;
  section += `6. Receber confirmação e seleção de fases do dev\n`;
  section += `7. Chamar \`create_task_plan(brief=[conteúdo do brief], technology, taskType, selectedPhases=[...])\`\n`;
  section += `8. Salvar o JSON retornado em \`.senior-mind/[slug]-plan.json\` no projeto do dev\n`;
  section += `9. **PARAR** e exibir:\n\n`;
  section += `\`\`\`\n`;
  section += `Plano salvo em .senior-mind/[slug]-plan.json.\n\n`;
  section += `Feche esta sessão e abra uma nova para executar as fases.\n`;
  section += `Na nova sessão, use: /task fase [N]\n\n`;
  section += `Commite os arquivos .senior-mind/ para que o time possa acessar o plano.\n`;
  section += `\`\`\`\n`;
  return section;
}

function buildModoA(task: string): string {
  return [
    `# Task Workflow — Nova Tarefa\n\n**Tarefa**: ${task}\n\n---\n\n`,
    buildModoACommandCollection(),
    `---\n\n`,
    buildModoABriefGeneration(),
    `---\n\n`,
    buildModoAPlanSelection(),
  ].join("");
}

function buildModoB(input: string): string {
  let output = `# Task Workflow — Continuar Tarefa Existente\n\n`;
  output += `**Comando recebido**: ${input}\n\n`;
  output += `---\n\n`;
  output += `## ETAPA 0 — Descobrir o plano\n\n`;
  output += `Buscar arquivos \`*-plan.json\` em \`.senior-mind/\`:\n\n`;
  output += `- **Nenhum encontrado** → informar: "Nenhum plano encontrado em \`.senior-mind/\`. Use \`/task [descrição]\` para criar."\n`;
  output += `- **Apenas um encontrado** → usar automaticamente\n`;
  output += `- **Mais de um encontrado** → listar e perguntar qual usar:\n`;
  output += `\`\`\`\nEncontrei N planos em .senior-mind/. Qual deseja continuar?\n`;
  output += `1. [slug-a]-plan.json (fases pendentes: 2, 3)\n`;
  output += `2. [slug-b]-plan.json (fases pendentes: 4, 5)\n\`\`\`\n\n`;
  output += `---\n\n`;
  output += `## ETAPA 1 — Executar as fases solicitadas\n\n`;
  output += `1. Ler o \`*-plan.json\` selecionado\n`;
  output += `2. Se as fases solicitadas estiverem com \`status="skipped"\`, atualizar para \`status="pending"\` e \`selected=true\` no JSON\n`;
  output += `3. Carregar e seguir \`.senior-mind/workflows/TASK-WORKFLOW.md\` para executar as fases marcadas\n`;
  return output;
}

function buildPromptResponse(text: string) {
  return {
    messages: [
      {
        role: "user" as const,
        content: { type: "text" as const, text },
      },
    ],
  };
}

export function register(server: McpServer): void {
  server.prompt(
    "task",
    "Ponto de entrada do Task Workflow. Gera ou continua um plano técnico com TDD por fase.",
    {
      input: z.string().describe(
        "Descrição da tarefa ('Implementar login com JWT') ou fase ('fase 2', 'todas as fases')"
      ),
    },
    ({ input }) => {
      const text = isFaseCommand(input) ? buildModoB(input) : buildModoA(input);
      return buildPromptResponse(text);
    }
  );
}
