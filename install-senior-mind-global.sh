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
