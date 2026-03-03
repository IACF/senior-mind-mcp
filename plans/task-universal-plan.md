# Plano: `/task` Universal — sem cópia de arquivos por projeto

## Contexto

O Task Workflow está implementado (tools `create_task_brief` e `create_task_plan` no MCP), mas o ponto de entrada — a lógica que diz ao agente "colete os comandos, chame o brief, pause para revisão" — vive em arquivos que precisam ser copiados para cada projeto. Isso cria inconsistência: funciona de um jeito no Cursor (via `.cursor/skills/`), de outro no Claude Code (via `.senior-mind/skills/`), e em nenhum outro cliente.

**O objetivo:** `/task implementar login` funciona do mesmo jeito em qualquer IDE/agente, sem copiar nenhum arquivo para o projeto. A experiência do dev é idêntica em Claude Code, Cursor, ou qualquer cliente MCP.

---

## Causa raiz

A lógica de orquestração do workflow (o que fazer quando o dev digita `/task`) está em arquivos locais do projeto, não no servidor MCP. O servidor já expõe as ferramentas (`create_task_brief`, `create_task_plan`), mas não expõe o "como usar" de forma acessível a todos os clientes.

---

## Solução: MCP Prompt `task` + instalação global única

```
Hoje:   por projeto → copiar SKILL.md → /task funciona (só nesse projeto)
Depois: por máquina → instalar uma vez → /task funciona em TODOS os projetos
```

A lógica de orquestração sai dos arquivos de projeto e entra no **MCP Prompt `task`**, que é parte do servidor. Qualquer cliente MCP que tenha o Senior Mind configurado pode acessar o prompt. A instalação global configura o `/task` como atalho em cada IDE — mas é feita **uma única vez por máquina**, não por projeto.

---

## Fase 1 — MCP Prompt `task`

**Arquivo novo**: `src/prompts/task.ts`
**Arquivo novo**: `tests/prompts/task.test.ts`
**Arquivo modificado**: `src/prompts/index.ts`

### Responsabilidade

O prompt `task` é a fonte única de verdade para o workflow. Contém toda a lógica que hoje está em `SKILL.md`. Quando qualquer cliente MCP invoca este prompt, recebe as instruções completas de orquestração.

### Schema

```typescript
server.prompt(
  "task",
  "Ponto de entrada do Task Workflow. Gera ou continua um plano técnico com TDD por fase.",
  {
    input: z.string().describe(
      "Descrição da tarefa ('Implementar login com JWT') ou fase ('fase 2', 'todas as fases')"
    ),
  },
  ({ input }) => { ... }
)
```

### Lógica do handler

O handler detecta o modo pelo conteúdo de `input` e retorna as instruções correspondentes:

```
isFaseCommand(input)  → instrucoes MODO B (continuar tarefa)
else                  → instrucoes MODO A (nova tarefa, task=input)
```

**MODO A** — instrucoes para o agente:
- Coletar os 4 comandos do projeto (test, testFile, lint, outros)
- Chamar `create_task_brief(task, technology, taskType, ...commands)`
- Salvar `.senior-mind/[slug]-brief.md` no projeto do dev
- PARAR: exibir mensagem de revisão + instrução de seleção de fases
- Após seleção: chamar `create_task_plan`, salvar `-plan.json`, PARAR

**MODO B** — instrucoes para o agente:
- Buscar `*-plan.json` em `.senior-mind/`
- Se múltiplos: listar e perguntar qual usar
- Carregar e seguir o workflow de execução de fases (TASK-WORKFLOW.md)

O conteúdo retornado é idêntico ao SKILL.md atual — agora servido via MCP, acessível a qualquer cliente.

### Padrão de implementação

Seguir `src/prompts/tdd-cycle.ts`: export `register(server)`, retornar `{ messages: [{ role: "user", content: { type: "text", text: output } }] }`. Adicionar import em `src/prompts/index.ts`.

### Testes (`tests/prompts/task.test.ts`)

Seguir padrão de `InMemoryTransport.createLinkedPair()`:

- Prompt listado em `listPrompts()` com descrição correta
- `input="Implementar login com JWT"` → output contém: ETAPA 0 (coleta de comandos), menção a `create_task_brief`, instrução de pausa para revisão
- `input="fase 2"` → output contém: busca por `*-plan.json`, carregamento do TASK-WORKFLOW
- `input="todas as fases"` → output contém instruções MODO B
- `input="fase 2 e 3"` → output contém instruções MODO B para múltiplas fases

---

## Fase 2 — Script de instalação global (`install-senior-mind-global.sh`)

**Arquivo novo**: `install-senior-mind-global.sh` (na raiz do repositório senior-mind-mcp)

### Responsabilidade

Script executado **uma única vez por máquina** (não por projeto). Pergunta qual agente de IA o dev utiliza e instala **apenas** o atalho `/task` correspondente no diretório do usuário (`$HOME`). Não recebe argumento de projeto destino.

### Agentes suportados

| Agente | O que é instalado |
|--------|------------------|
| Claude Code | `~/.claude/commands/task.md` |
| Cursor | `~/.cursor/rules/senior-mind-task.mdc` |
| Codex | `~/.codex/instructions.md` |
| Open Code | `~/.opencode/instructions.md` |

### Conteúdo dos templates por agente

**Claude Code** — `install/claude-commands/task.md`:
```markdown
Use o MCP Prompt "task" do servidor senior-mind, passando como `input` o texto que
o usuário digitou após /task.

Se nenhum texto foi fornecido, pergunte: "Qual tarefa deseja implementar?"

Siga exatamente as instruções retornadas pelo prompt.
```

**Cursor** — `install/cursor-rules/senior-mind-task.mdc`:
```
---
description: Quando o usuário invocar /task, usar o MCP prompt task do senior-mind
globs: **/*
alwaysApply: false
---

Quando o usuário digitar /task [descrição], invoque o MCP prompt "task" do servidor
senior-mind com input=[descrição] e siga as instruções retornadas.
```

**Codex** — `install/codex/task-instructions.md`:
```markdown
Quando o usuário digitar /task [descrição], invoque o MCP prompt "task" do servidor
senior-mind com input=[descrição] e siga as instruções retornadas.
```

**Open Code** — `install/opencode/task-instructions.md`:
```markdown
Quando o usuário digitar /task [descrição], invoque o MCP prompt "task" do servidor
senior-mind com input=[descrição] e siga as instruções retornadas.
```

### Estrutura do script

```bash
#!/usr/bin/env bash
# Configura o atalho /task globalmente para o agente de IA escolhido
# Uso: ./install-senior-mind-global.sh
# Execute UMA VEZ por máquina após configurar o Senior Mind MCP

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "Senior Mind MCP — Instalação Global do /task"
echo ""
echo "Qual agente de IA você utiliza?"
echo "  1) Claude Code"
echo "  2) Cursor"
echo "  3) Codex"
echo "  4) Open Code"
echo ""
read -rp "Escolha (1-4): " choice

case "$choice" in
  1)
    mkdir -p "$HOME/.claude/commands"
    cp "$SCRIPT_DIR/install/claude-commands/task.md" "$HOME/.claude/commands/task.md"
    echo "✓ Claude Code: ~/.claude/commands/task.md instalado"
    ;;
  2)
    mkdir -p "$HOME/.cursor/rules"
    cp "$SCRIPT_DIR/install/cursor-rules/senior-mind-task.mdc" "$HOME/.cursor/rules/senior-mind-task.mdc"
    echo "✓ Cursor: ~/.cursor/rules/senior-mind-task.mdc instalado"
    ;;
  3)
    mkdir -p "$HOME/.codex"
    cp "$SCRIPT_DIR/install/codex/task-instructions.md" "$HOME/.codex/instructions.md"
    echo "✓ Codex: ~/.codex/instructions.md instalado"
    ;;
  4)
    mkdir -p "$HOME/.opencode"
    cp "$SCRIPT_DIR/install/opencode/task-instructions.md" "$HOME/.opencode/instructions.md"
    echo "✓ Open Code: ~/.opencode/instructions.md instalado"
    ;;
  *)
    echo "Opção inválida. Execute o script novamente."
    exit 1
    ;;
esac

echo ""
echo "Instalação concluída. /task está disponível em todos os projetos."
echo "Pré-requisito: Senior Mind MCP configurado no seu ambiente (mcp.json)."
```

### Arquivos de template (no repositório)

| Arquivo no repo | Agente | Instalado em |
|-----------------|--------|-------------|
| `install/claude-commands/task.md` | Claude Code | `~/.claude/commands/task.md` |
| `install/cursor-rules/senior-mind-task.mdc` | Cursor | `~/.cursor/rules/senior-mind-task.mdc` |
| `install/codex/task-instructions.md` | Codex | `~/.codex/instructions.md` |
| `install/opencode/task-instructions.md` | Open Code | `~/.opencode/instructions.md` |

Todos os templates são minimalistas — delegam para o MCP prompt sem lógica própria.

---

## Fase 3 — Thin wrappers para fluxo legado

**Arquivos modificados**:
- `.cursor/skills/task/SKILL.md`
- `.senior-mind/skills/task/SKILL.md`

Para devs que ainda usam `copy-senior-mind-patterns.sh` (fluxo antigo, por projeto), os skills existentes devem se tornar thin wrappers que delegam para o MCP prompt, em vez de conter a lógica completa. Isso elimina duplicação e garante que o comportamento seja sempre o do prompt.

```markdown
# Skill: /task — Task Workflow

Invocar o MCP Prompt "task" do servidor senior-mind com o `input` igual ao
texto que o usuário digitou após /task.

Seguir exatamente as instruções retornadas pelo prompt.
```

---

## Fase 4 — Atualizar documentação

**Arquivo modificado**: `README.md`

Na seção "Task Workflow: Plano Técnico + TDD por Fase":

1. Substituir instruções de cópia por projeto por "execute `install-senior-mind-global.sh` uma vez"
2. Adicionar seção "Instalação" com dois passos:
   - Passo 1: Configurar o MCP (já existia)
   - Passo 2: Rodar `./install-global.sh` uma vez na máquina
3. Mostrar que a experiência é a mesma em qualquer IDE:
   ```
   Claude Code: /task Implementar login com JWT
   Cursor:      /task Implementar login com JWT
   Outro MCP:   invocar prompt "task" com input="Implementar login com JWT"
   ```
4. Remover qualquer referência a cópia por projeto

---

## Arquivos a criar/modificar

| Ação | Arquivo |
|------|---------|
| **Criar** | `src/prompts/task.ts` |
| **Criar** | `tests/prompts/task.test.ts` |
| **Criar** | `install-senior-mind-global.sh` |
| **Criar** | `install/claude-commands/task.md` |
| **Criar** | `install/cursor-rules/senior-mind-task.mdc` |
| **Modificar** | `src/prompts/index.ts` |
| **Modificar** | `.cursor/skills/task/SKILL.md` → thin wrapper |
| **Modificar** | `.senior-mind/skills/task/SKILL.md` → thin wrapper |
| **Modificar** | `README.md` |

---

## Padrões de referência

- `src/prompts/tdd-cycle.ts` — estrutura do prompt handler
- `tests/prompts/tdd-cycle.test.ts` — padrão de teste de prompt
- `.senior-mind/skills/task/SKILL.md` — conteúdo a migrar para o prompt
- `.senior-mind/workflows/TASK-WORKFLOW.md` — referenciado no MODO B do prompt

---

## Experiência do dev após implementação

**Setup único (uma vez por máquina):**
```bash
./install-senior-mind-global.sh
```

**Uso em qualquer projeto:**
```
/task Implementar login com JWT no NestJS
/task fase 2
/task todas as fases
```

Funciona igual no Claude Code, Cursor, ou qualquer cliente MCP — sem copiar nenhum arquivo por projeto.

---

## Verificação

1. **Testes**: `npm run test:run` — `tests/prompts/task.test.ts` deve passar
2. **MCP Inspector** (`http://localhost:6274`):
   - Listar prompts → `task` aparece
   - Invocar com `input="Criar módulo de notificações"` → output contém ETAPA 0 + `create_task_brief`
   - Invocar com `input="fase 2"` → output contém busca por `*-plan.json`
3. **Claude Code**: rodar `./install-global.sh` → digitar `/task Implementar X` em projeto sem nenhum arquivo `.senior-mind/` → workflow executa corretamente
4. **Cursor**: mesma verificação com `/task` no Cursor
5. **Thin wrappers**: verificar que `SKILL.md` nos projetos copiados via `copy-senior-mind-patterns.sh` delegam ao MCP prompt (sem lógica duplicada)
6. **Script interativo**: rodar `install-senior-mind-global.sh` e escolher cada opção (1-4) → verificar que apenas o arquivo do agente escolhido é instalado; opção inválida deve exibir erro e sair
