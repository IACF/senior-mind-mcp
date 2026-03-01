# Skill: /task — Task Workflow

Ponto de entrada do Task Workflow. Tem dois modos de operação:

---

## MODO A: NOVA TAREFA — `/task [Descrição da tarefa]`

### ETAPA 0 — Coletar comandos do projeto (ANTES do brief)

Perguntar ao dev:

1. "Qual o comando para rodar **todos os testes** do projeto?"
2. "Qual o comando para rodar os testes de **um arquivo específico**? (inclua o placeholder usado, ex: `--filter {class}` ou `--testPathPattern`)"
3. "Existe algum comando de **linting** ou verificação de padrão de código? (ex: phpcs, eslint)"
4. "Existe algum outro comando relevante para o ciclo de desenvolvimento? (ex: build, migrate, seed)"

Aguardar as respostas antes de prosseguir.

### ETAPA 1 — Gerar o brief

1. Extrair `task`, `technology`, `taskType` da descrição do dev (perguntar se não ficar claro)
2. Gerar slug: kebab-case do nome da tarefa (ex: `bug-desconto-percentual-cartservice`)
3. Chamar `create_task_brief(task, technology, taskType, testCommand, testFileCommand, lintCommand?, otherCommands?, requirements?, context?)`
4. Salvar o conteúdo retornado em `.senior-mind/[slug]-brief.md` no projeto do dev
5. **PARAR** e exibir:

```
Salvei .senior-mind/[slug]-brief.md.

Abra o arquivo e revise o plano técnico — arquivos, fases e TDD.

Quando confirmar, me informe quais fases deseja executar agora:
- "todas" → executa todas as fases
- "1" → executa apenas a Fase 1
- "2 e 3" → executa as Fases 2 e 3
- "1, 3, 5" → executa as Fases 1, 3 e 5
```

### ETAPA 2 — Selecionar fases e gerar o plano

6. Receber confirmação e seleção de fases do dev
7. Chamar `create_task_plan(brief=[conteúdo do brief], technology, taskType, selectedPhases=[...])`
8. Salvar o JSON retornado em `.senior-mind/[slug]-plan.json` no projeto do dev
9. **PARAR** e exibir:

```
Plano salvo em .senior-mind/[slug]-plan.json.

Feche esta sessão e abra uma nova para executar as fases.
Na nova sessão, use: /task fase [N]

Commite os arquivos .senior-mind/ para que o time possa acessar o plano.
```

---

## MODO B: CONTINUAR TAREFA EXISTENTE — `/task fase N`

### ETAPA 0 — Descobrir o plano

Buscar arquivos `*-plan.json` em `.senior-mind/`:

- **Nenhum encontrado** → informar: "Nenhum plano encontrado em `.senior-mind/`. Use `/task [descrição]` para criar."
- **Apenas um encontrado** → usar automaticamente
- **Mais de um encontrado** → listar e perguntar qual usar:
  ```
  Encontrei N planos em .senior-mind/. Qual deseja continuar?
  1. [slug-a]-plan.json (fases pendentes: 2, 3)
  2. [slug-b]-plan.json (fases pendentes: 4, 5)
  ```

### ETAPA 1 — Executar as fases solicitadas

1. Ler o `*-plan.json` selecionado
2. Se as fases solicitadas estiverem com `status="skipped"`, atualizar para `status="pending"` e `selected=true` no JSON
3. Carregar e seguir `.senior-mind/workflows/TASK-WORKFLOW.md` para executar as fases marcadas

---

## Tabela de uso

| Intenção | O que digitar |
|----------|--------------|
| Criar nova tarefa do zero | `/task Implementar módulo de pagamentos no NestJS` |
| Executar fase específica | `/task fase 2` |
| Executar múltiplas fases | `/task fase 2 e 3` |
| Executar todas as fases pendentes | `/task todas as fases` |
| Escolher entre múltiplos planos | `/task fase 2` → agente lista e pergunta qual |

---

## Tipos de tarefa suportados

| taskType | Descrição |
|----------|-----------|
| `nova-feature` | Nova funcionalidade do zero |
| `bug-fix` | Correção de bug com reprodução via teste |
| `refatoracao` | Refatoração com rede de segurança obrigatória na Fase 1 |
| `modulo` | Módulo completo em 5 fases (entidade → repository → service → controller → refinamentos) |
| `servico` | Serviço isolado com contratos, implementação e integração |
