#!/usr/bin/env bash
# Replica a estrutura de Skills, Rules, Agents e Workflows do Senior Mind MCP
# para um projeto de destino (ex.: ../meu-projeto).
#
# Uso: ./copy-senior-mind-patterns.sh <caminho-do-projeto-destino>
# Exemplo: ./copy-senior-mind-patterns.sh ../api-laravel

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEST="${1:-}"

if [ -z "$DEST" ]; then
  echo "Uso: $0 <caminho-do-projeto-destino>"
  echo "Exemplo: $0 ../meu-projeto"
  exit 1
fi

if [ ! -d "$DEST" ]; then
  echo "Erro: diretório de destino não existe: $1"
  exit 1
fi
DEST="$(cd "$DEST" && pwd)"

echo "Origem: $SCRIPT_DIR"
echo "Destino: $DEST"
echo ""

# Cursor: rules, skills, agents
mkdir -p "$DEST/.cursor/rules"
mkdir -p "$DEST/.cursor/skills"
mkdir -p "$DEST/.cursor/agents"

if [ -d "$SCRIPT_DIR/.cursor/rules" ]; then
  echo "Copiando rules..."
  cp -r "$SCRIPT_DIR/.cursor/rules/"*.mdc "$DEST/.cursor/rules/" 2>/dev/null || true
  [ -f "$SCRIPT_DIR/.cursor/rules/use-senior-mind-mcp.mdc" ] && cp "$SCRIPT_DIR/.cursor/rules/use-senior-mind-mcp.mdc" "$DEST/.cursor/rules/"
  [ -f "$SCRIPT_DIR/.cursor/rules/ask-complexity-first.mdc" ] && cp "$SCRIPT_DIR/.cursor/rules/ask-complexity-first.mdc" "$DEST/.cursor/rules/"
  [ -f "$SCRIPT_DIR/.cursor/rules/tdd-conditional.mdc" ] && cp "$SCRIPT_DIR/.cursor/rules/tdd-conditional.mdc" "$DEST/.cursor/rules/"
fi

if [ -d "$SCRIPT_DIR/.cursor/skills" ]; then
  echo "Copiando skills..."
  for skill in code-review architecture-advisor tdd-workflow implementation-planning sql-advisor; do
    if [ -d "$SCRIPT_DIR/.cursor/skills/$skill" ]; then
      mkdir -p "$DEST/.cursor/skills/$skill"
      cp "$SCRIPT_DIR/.cursor/skills/$skill/SKILL.md" "$DEST/.cursor/skills/$skill/"
    fi
  done
fi

if [ -d "$SCRIPT_DIR/.cursor/agents" ] && [ -f "$SCRIPT_DIR/.cursor/agents/AGENTS.md" ]; then
  echo "Copiando agents..."
  cp "$SCRIPT_DIR/.cursor/agents/AGENTS.md" "$DEST/.cursor/agents/"
fi

# Claude Code / outros: .senior-mind
if [ -d "$SCRIPT_DIR/.senior-mind" ]; then
  echo "Copiando .senior-mind (workflows para Claude Code/outros)..."
  mkdir -p "$DEST/.senior-mind/workflows"
  cp "$SCRIPT_DIR/.senior-mind/README.md" "$DEST/.senior-mind/" 2>/dev/null || true
  for f in CONDITIONAL-TDD-WORKFLOW.md CONDITIONAL-PLANNING.md code-review-workflow.md architecture-workflow.md sql-workflow.md; do
    [ -f "$SCRIPT_DIR/.senior-mind/workflows/$f" ] && cp "$SCRIPT_DIR/.senior-mind/workflows/$f" "$DEST/.senior-mind/workflows/"
  done
fi

echo ""
echo "Concluído. Estrutura replicada em $DEST"
echo ""
echo "Próximos passos:"
echo "1. Configure o Senior Mind MCP no projeto (mcp.json ou config global)"
echo "2. (Cursor) Rules e skills passam a valer automaticamente"
echo "3. (Claude Code) Copie os workflows de .senior-mind/workflows no início da conversa quando necessário"
echo "4. Sempre que for implementar ou planejar, o agente perguntará: 'Esta tarefa é complexa, mediana ou simples?' — responda para definir o rigor do processo"
