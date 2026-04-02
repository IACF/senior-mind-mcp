# TASK WORKFLOW — Execução de Fase por Sessão

Carregado pela skill `/task` no **Modo B** (continuar tarefa existente). Define o loop de execução de **uma fase por vez**.

## REGRA FUNDAMENTAL

Executar apenas **UMA fase por sessão**. Ao concluir, encerrar a sessão.

Cada fase começa em contexto limpo — isso evita acúmulo de contexto e garante que o agente não carregue decisões de fases anteriores.

---

## EXECUÇÃO DE UMA FASE

### 1. Carregar o plano

Ler `.senior-mind/[slug]-plan.json`.

Identificar a fase solicitada (número passado pelo dev).

### 2. Verificar pré-condições

- Se a fase depende de fase anterior com `status != "done"` → avisar o dev e **não executar**
- Se a fase já está `"done"` → confirmar com o dev se quer reexecutar

### 3. Anunciar início

```
Iniciando Fase N: [nome da fase]
testFile: [testFile da fase]
sourceFiles: [lista de sourceFiles]
```

### 4. Ciclo TDD

**RED:**
1. Chamar `tdd_guide(phase="red", feature="[nome da fase]", technology="[tech]")`
2. Escrever os testes no `testFile` da fase
3. Rodar: `[commands.testFile]` (substituir `{class}` ou `{file}` pelo nome do arquivo de teste)
4. **Gate RED:** os testes devem **FALHAR** pelo motivo correto (código não existe ainda)
   - Se passarem: o teste não está testando nada novo — revisar

**GREEN:**
1. Chamar `tdd_guide(phase="green", feature="[nome da fase]", technology="[tech]", test_code="[código dos testes]")`
2. Implementar o mínimo necessário nos `sourceFiles` para os testes passarem
3. Rodar: `[commands.test]`
4. **Gate GREEN:** todos os testes passam, sem regressão no restante da suite

**REFACTOR:**
1. Chamar `tdd_guide(phase="refactor", feature="[nome da fase]", technology="[tech]", code="[código implementado]", test_code="[código dos testes]")`
2. Chamar `review_code(code=[código], language=[linguagem], focus="all")`
3. Chamar `detect_code_smells(code=[código], language=[linguagem])`
4. Aplicar ajustes baseados no feedback das ferramentas
5. Se `commands.lint` existir: rodar `[commands.lint]`
6. **Gate REFACTOR:** testes verdes, review_code sem violações altas, lint passa

### 5. Atualizar o plano

Atualizar `.senior-mind/[slug]-plan.json`:
- Fase atual: `"status": "done"`

### 6. Rodar suite completa

Rodar: `[commands.test]`

Verificar que nenhuma regressão foi introduzida.

### 7. Reportar resumo e ENCERRAR

```
Fase N concluída.

Arquivos criados/modificados:
- [lista de arquivos]

Testes adicionados:
- [lista de testes]

.senior-mind/[slug]-plan.json atualizado: Fase N → status="done"

Próxima fase disponível: Fase N+1 — [nome]

IMPORTANTE: Feche esta sessão antes de continuar.
Para executar a próxima fase, abra uma nova sessão e use:
/task fase [N+1]

Commite os arquivos .senior-mind/ para compartilhar o estado com o time.
```

**NÃO executar a próxima fase automaticamente.**

---

## Por que uma fase por sessão?

Cada fase pode gerar dezenas de trocas de mensagens (RED/GREEN/REFACTOR + correções). Acumular múltiplas fases na mesma janela de contexto degrada a qualidade das respostas do agente.

Iniciar cada fase em contexto limpo garante foco total na fase atual, sem ruído das anteriores.
