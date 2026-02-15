# Senior Mind Workflows para Claude Code e Outros Agentes

Este diretório contém workflows para agentes que não suportam skills nativas (Claude Code, Claude Desktop, etc.). **Quem classifica a complexidade (complexa/mediana/simples) é SEMPRE o usuário;** o agente apenas pergunta e aplica o fluxo.

## Como Usar

### 1. TDD + Mentor Mode (Condicional por Complexidade)

**Quando**: Ao implementar qualquer código de produção (feature, bug, refatoração)

**Ação**: Copie o conteúdo de `workflows/CONDITIONAL-TDD-WORKFLOW.md` no início da conversa com o agente.

Exemplo:

```
[Cole o conteúdo de CONDITIONAL-TDD-WORKFLOW.md]

Agora implemente a feature X seguindo este workflow. Pergunte-me primeiro se a tarefa é complexa, mediana ou simples.
```

### 2. Implementation Planning (Obrigatório no Modo Plan)

**Quando**: Ao planejar implementação antes de executar

**Ação**: Copie o conteúdo de `workflows/CONDITIONAL-PLANNING.md` no início da conversa.

Exemplo:

```
[Cole o conteúdo de CONDITIONAL-PLANNING.md]

Agora crie um plano para implementar a feature X. Pergunte-me primeiro se a tarefa é complexa, mediana ou simples.
```

### 3. Outros Workflows (opcionais)

- `code-review-workflow.md`: Quando revisar código
- `architecture-workflow.md`: Quando tomar decisões arquiteturais
- `sql-workflow.md`: Quando trabalhar com queries SQL

## Regra de Ouro: Complexidade

O agente **sempre pergunta** ao usuário: "Esta tarefa é complexa, mediana ou simples?" e **aguarda a resposta**. O agente **nunca** decide ou infere a complexidade; apenas aplica o fluxo conforme o que o usuário informou.

## Diferença vs Cursor

| Recurso | Cursor | Claude Code/Outros |
|---------|--------|---------------------|
| Skills | Nativas (`.cursor/skills/`) | Manual (copiar workflows) |
| Rules | Nativas (`.cursor/rules/`) | Manual (copiar no início) |
| Sub-agents | Nativos | Não suportado |
| MCP | Suportado | Suportado |

Em Claude Code, você precisa **manualmente** copiar os workflows no início da conversa para garantir que o agente siga as regras.
