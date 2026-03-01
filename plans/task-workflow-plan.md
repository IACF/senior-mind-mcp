# Plano: Task Plan Workflow — Ralph-inspired no Senior Mind MCP

## Contexto

O Senior Mind MCP já possui ferramentas de planejamento (`plan_implementation`) e execução TDD (`tdd_guide`, `review_code`, etc.), mas não tem um **fluxo de trabalho fixo e estruturado** que o desenvolvedor possa seguir do início ao fim de uma tarefa técnica. O Ralph Loops resolveu isso com `prd.json` + um loop bem definido. O objetivo aqui é trazer essa ideia para o Senior Mind, adaptada para **trabalho assistido** (dev presente), **tarefas técnicas de escopo médio** (módulos, serviços, bug fixes, refatorações) e **TDD central** — diferente do Ralph que não é TDD-first.

```
Ralph:        /prd → prd.md (legível) → revisar → /ralph → prd.json → ralph.sh
Senior Mind:  /task → task-brief.md (técnico) → revisar + selecionar fases → task-plan.json → executar
```

---

## O que será adicionado

### 1. Nova Tool: `create_task_brief`

**Arquivo**: `src/tools/create-task-brief.ts`

Equivalente ao `/prd` do Ralph. Gera um **plano técnico de implementação** no estilo de um senior dev — equivalente ao `credit-bucket-refactor.md` que o time já usa. O dev abre o arquivo, lê e valida antes de qualquer execução.

O output NÃO é linguagem natural. É um plano técnico estruturado com: contexto arquitetural, tabela de arquivos críticos, e fases com TDD explícito (nomes de testes, caminhos de arquivo, trechos de código onde relevante).

**Parâmetros**:
| Param | Tipo | Obrigatório |
|-------|------|-------------|
| `task` | string | sim |
| `technology` | `laravel \| nestjs \| generic` | sim |
| `taskType` | `nova-feature \| bug-fix \| refatoracao \| modulo \| servico` | sim |
| `requirements` | string | não |
| `context` | string | não (paths de arquivos existentes, contexto do domínio) |

**Output — `.senior-mind/[slug-da-tarefa]-brief.md`** (salvo na pasta `.senior-mind/` do projeto do dev, com nome derivado da tarefa para ser commitado e compartilhado com o time):

```markdown
# Task Brief — [nome da tarefa]

## Contexto
[O que muda, por que muda, impacto na arquitetura existente]

## Arquitetura da Solução (quando relevante)
[Diagrama ASCII mostrando relações entre componentes]

## Comandos do Projeto
- Rodar testes: [comando informado pelo dev, ex: ./vendor/bin/sail test]
- Rodar testes de um arquivo: [ex: ./vendor/bin/sail test --filter NomeDoTest]
- Linting/padrão de código: [ex: ./vendor/bin/sail bin phpcs]

## Arquivos Críticos
| Arquivo | Ação |
|---------|------|
| app/Services/CartService.php | Corrigir método applyCoupon |
| tests/Unit/Services/CartServiceTest.php | RED: testes do bug + edge cases |

## Fases de Implementação

### Fase 1 — CartService: Reprodução e Correção do Bug

**Objetivo:** Escrever teste falhando que reproduz o bug, aplicar correção mínima.

**TDD:**

RED — `tests/Unit/Services/CartServiceTest.php`:
- [cenário: cupom percentual não reduz o total]
- [cenário: cupom de valor fixo não é afetado]

GREEN — `app/Services/CartService.php`:
[implementação mínima para os testes passarem]

REFACTOR + [comando de linting do projeto]

### Fase 2 — CartService: Edge Cases e Cobertura

**Objetivo:** Cobrir casos extremos descobertos após a correção.

...

## Verificação End-to-End
[comandos informados pelo dev]
```

**Princípios de geração das fases**:
- Cada fase deve criar seus próprios testes, seguindo o padrão de testes já adotado no projeto do dev — a tool não impõe convenção de nome, estrutura de arquivo ou framework de teste
- Cada fase é **autossuficiente**: tem seus próprios testes e seus próprios arquivos de produção
- Nenhuma fase depende de código não commitado de outra fase (pode depender de código já existente no projeto)
- **As fases devem estar ordenadas por dependência de execução**: a Fase N nunca pode exigir que a Fase N+2 já tenha sido executada. A ordem no brief é a ordem correta de execução — camadas mais básicas (domínio/entidade) sempre antes de camadas superiores (serviço, controller, integração). A tool deve seguir a regra: fundação antes de estrutura, estrutura antes de comportamento, comportamento antes de integração.

**Perguntas obrigatórias ao dev antes de gerar o brief**:
- Qual o comando para rodar todos os testes do projeto?
- Qual o comando para rodar os testes de um arquivo específico?
- Existe algum comando de linting ou verificação de padrão de código (ex: phpcs, eslint)?
- Existe algum outro comando relevante para o ciclo de desenvolvimento (ex: build, migrate)?

Esses comandos são incluídos na seção "Comandos do Projeto" do brief e usados pelo agente durante a execução das fases.

**O agente para e espera revisão e seleção de fases.**

---

### 2. Nova Tool: `create_task_plan`

**Arquivo**: `src/tools/create-task-plan.ts`

Equivalente ao `/ralph` do Ralph. Recebe o conteúdo do `task-brief.md` confirmado e as fases selecionadas, e gera o `task-plan.json` — tracker de progresso por fase.

**Parâmetros**:
| Param | Tipo | Obrigatório |
|-------|------|-------------|
| `brief` | string | sim (conteúdo do task-brief.md) |
| `technology` | `laravel \| nestjs \| generic` | sim |
| `taskType` | `nova-feature \| bug-fix \| refatoracao \| modulo \| servico` | sim |
| `selectedPhases` | `number[] \| "all"` | sim |

**Output — `.senior-mind/[slug-da-tarefa]-plan.json`** (mesmo slug do brief, commitável):
```json
{
  "task": "Bug: desconto percentual no CartService",
  "briefFile": ".senior-mind/bug-desconto-percentual-cartservice-brief.md",
  "technology": "laravel",
  "taskType": "bug-fix",
  "generatedAt": "2024-01-01T00:00:00.000Z",
  "commands": {
    "test": "./vendor/bin/sail test",
    "testFile": "./vendor/bin/sail test --filter {file}",
    "lint": "./vendor/bin/sail bin phpcs"
  },
  "phases": [
    {
      "number": 1,
      "name": "CartService: Reproducao e Correcao do Bug",
      "selected": true,
      "status": "pending",
      "testFile": "tests/Unit/Services/CartServiceTest.php",
      "sourceFiles": ["app/Services/CartService.php"],
      "tddPhase": "red",
      "qualityGates": [
        "Todos os testes da fase passam",
        "review_code sem violacoes altas",
        "lint passa"
      ]
    },
    {
      "number": 2,
      "name": "CartService: Edge Cases",
      "selected": false,
      "status": "skipped"
    }
  ]
}
```

Fases não selecionadas ficam com `"selected": false, "status": "skipped"` — preservadas para execução futura por outro dev ou outra sessão.

---

### 3. Skill `/task`: ponto de entrada

**Arquivo**: `.senior-mind/skills/task/SKILL.md`

Escrito como instruções para o agente. Tem dois modos de entrada: **nova tarefa** e **continuar tarefa existente**.

```
── MODO A: NOVA TAREFA ("/task Descrição da tarefa") ──────────────────────────

ETAPA 0 — COLETA DE COMANDOS (antes do brief):
0. Perguntar ao dev:
   - "Qual o comando para rodar todos os testes?"
   - "Qual o comando para rodar os testes de um arquivo específico?"
   - "Existe comando de linting/padrão de código?"
   - "Algum outro comando relevante (build, migrate, etc.)?"

ETAPA 1 — BRIEF:
1. Extrair task, technology, taskType, requirements, context e os comandos coletados
2. Gerar slug: kebab-case do nome da tarefa (ex: "bug-desconto-percentual-cartservice")
3. Chamar create_task_brief(...)
4. Salvar .senior-mind/[slug]-brief.md
5. PARAR: "Salvei .senior-mind/[slug]-brief.md. Revise o plano técnico.
   Quando confirmar, informe quais fases deseja executar agora (ex: '1', '2 e 3', 'todas')."

ETAPA 2 — SELEÇÃO:
6. Receber confirmação + seleção de fases
7. Chamar create_task_plan(brief=<conteúdo>, technology, taskType, selectedPhases=[...])
8. Salvar .senior-mind/[slug]-plan.json
9. PARAR: "Plano salvo. Feche esta sessão e abra uma nova.
   Na nova sessão, use: /task fase [N] para iniciar a execução."

── MODO B: CONTINUAR TAREFA EXISTENTE ("/task fase N") ────────────────────────

ETAPA 0 — DESCOBERTA DO PLANO:
0. Buscar arquivos *-plan.json em .senior-mind/
   - Se nenhum encontrado → informar "Nenhum plano encontrado. Use /task [descrição] para criar."
   - Se apenas um encontrado → usar automaticamente
   - Se mais de um → listar e perguntar qual usar:
     "Encontrei N planos em .senior-mind/. Qual deseja continuar?
      1. [slug-a]-plan.json (fases: 2, 3 pendentes)
      2. [slug-b]-plan.json (fases: 4, 5 pendentes)"

ETAPA 1 — EXECUÇÃO:
1. Ler o *-plan.json selecionado
2. Marcar as fases solicitadas como selected=true (se estavam skipped)
   e atualizar status de "skipped" para "pending"
3. Carregar TASK-WORKFLOW.md e executar apenas as fases marcadas
```

**Como o dev invoca cada modo na prática:**

| Intenção | O que digitar |
|----------|--------------|
| Criar nova tarefa do zero | `/task Implementar módulo de pagamentos no NestJS` |
| Executar fase específica de tarefa existente | `/task fase 2` |
| Executar múltiplas fases de tarefa existente | `/task fase 2 e 3` |
| Executar todas as fases pendentes de tarefa existente | `/task todas as fases` |
| Escolher entre múltiplos planos existentes | `/task fase 2` → agente lista os planos e pergunta qual |

---

### 4. Workflow de Execução: `.senior-mind/workflows/TASK-WORKFLOW.md`

Carregado pela skill no Modo B. Define o loop de execução de **uma fase por vez**, com limpeza de contexto entre fases.

```
REGRA: executar apenas UMA fase por sessão. Ao concluir, encerrar a sessão.
Cada fase começa em contexto limpo — isso evita acúmulo de contexto e
garante que o agente não carregue decisões de fases anteriores.

EXECUÇÃO DE UMA FASE:

  1. Ler .senior-mind/[slug]-plan.json
  2. Identificar a fase solicitada (número passado pelo dev)
  3. Verificar pré-condições:
     - Se fase depende de fase anterior com status != "done" → avisar o dev
     - Se fase já está "done" → confirmar com dev se quer reexecutar
  4. Anunciar: "Iniciando Fase N: [nome]"
  5. Ciclo TDD:
     RED:      chamar tdd_guide(phase="red", feature="[nome da fase]", technology="...")
               Escrever testes no testFile da fase
               Rodar: [commands.testFile] → Gate: testes FALHAM pelo motivo correto
     GREEN:    chamar tdd_guide(phase="green", ...)
               Implementar mínimo nos sourceFiles
               Rodar: [commands.test] → Gate: testes passam, sem regressão
     REFACTOR: chamar tdd_guide(phase="refactor", ...)
               chamar review_code(code=..., language=..., focus="all")
               chamar detect_code_smells(code=..., language=...)
               Rodar: [commands.lint] → Gate: linting passa, review sem violações altas
  6. Atualizar .senior-mind/[slug]-plan.json: fase atual → status="done"
  7. Rodar suite completa: [commands.test]
  8. Reportar resumo da fase:
     "Fase N concluída.
      - Arquivos criados/modificados: [lista]
      - Testes adicionados: [lista]
      - Próxima fase disponível: Fase N+1 — [nome]

      IMPORTANTE: Feche esta sessão antes de continuar.
      Para executar a próxima fase, abra uma nova sessão e use:
      /task fase [N+1]"
  9. ENCERRAR — não executar a próxima fase automaticamente
```

**Por que uma fase por sessão e não um loop contínuo?**
Cada fase pode gerar dezenas de trocas de mensagens (RED/GREEN/REFACTOR + correções). Acumular múltiplas fases na mesma janela de contexto degrada a qualidade das respostas do agente. Iniciar cada fase em contexto limpo garante foco total na fase atual, sem ruído das anteriores.

---

### 5. Testes

**Arquivos**:
- `tests/tools/create-task-brief.test.ts`
- `tests/tools/create-task-plan.test.ts`

Seguem padrão `InMemoryTransport.createLinkedPair()`.

**`create_task_brief` — cobertura**:
- Tool listada em `listTools()`
- Output contém: seção "Comandos do Projeto", tabela de arquivos críticos, fases com TDD (RED/GREEN/REFACTOR)
- Output inclui os comandos passados pelo dev (test, testFile, lint) na seção correta
- Output contém caminhos de arquivo reais (ex: `app/Services/`, `tests/Feature/`)
- Por `taskType`:
  - `bug-fix` → fases focadas em reprodução e correção, cada fase com testes próprios
  - `refatoracao` → Fase 1 é sempre rede de segurança (testes antes de mudar código)
  - `modulo` → 5 fases com arquivos independentes por fase
- Cada fase é autossuficiente: cria seus próprios testes seguindo o padrão do projeto
- Instrução de revisão + seleção de fases presente no final do output

**`create_task_plan` — cobertura**:
- Tool listada em `listTools()`
- Com `selectedPhases=[1]`: apenas fase 1 fica `selected=true`, demais `selected=false`
- Com `selectedPhases="all"`: todas as fases ficam `selected=true`
- JSON gerado contém campo `commands` com os comandos do projeto
- JSON gerado contém campo `briefFile` apontando para o `.senior-mind/[slug]-brief.md`
- Cada fase contém: `testFile`, `sourceFiles`, `tddPhase`, `qualityGates`
- Fases não selecionadas ficam `status="skipped"`

---

### 6. Modificação em `src/tools/index.ts`

```typescript
import { register as createTaskBrief } from "./create-task-brief.js";
import { register as createTaskPlan } from "./create-task-plan.js";

export function registerAllTools(server: McpServer): void {
  // ... tools existentes ...
  createTaskBrief(server);
  createTaskPlan(server);
}
```

---

## Arquivos a criar/modificar

| Ação | Arquivo |
|------|---------|
| **Criar** | `src/tools/create-task-brief.ts` |
| **Criar** | `src/tools/create-task-plan.ts` |
| **Criar** | `tests/tools/create-task-brief.test.ts` |
| **Criar** | `tests/tools/create-task-plan.test.ts` |
| **Criar** | `.senior-mind/workflows/TASK-WORKFLOW.md` |
| **Criar** | `.senior-mind/skills/task/SKILL.md` |
| **Modificar** | `src/tools/index.ts` (4 linhas) |
| **Modificar** | `README.md` (nova seção "Task Workflow") |

**Padrões de referência**:
- `src/tools/plan-implementation.ts` — estrutura interna dos tools
- `tests/tools/plan-implementation.test.ts` — estrutura dos testes
- `.senior-mind/workflows/CONDITIONAL-TDD-WORKFLOW.md` — tom e formato do workflow
- `credit-bucket-refactor.md` — estilo do output do `create_task_brief`

---

## Como funciona na prática (exemplo real)

### Cenário: Refatoração — Client → CreditBucket (igual ao credit-bucket-refactor.md)

O dev abre o Claude Code no projeto e digita:

```
/task Refatorar o sistema de créditos: mover available_credits do Client para um novo
modelo CreditBucket. Cada pacote contratado gera um bucket com saldo e expiração próprios.
O CreditManager não muda de assinatura. Projeto é Laravel multibase por tenant.
```

---

#### ETAPA 0 — Agente coleta os comandos do projeto:

```
Agente: "Antes de gerar o plano, preciso dos comandos do seu projeto:
  1. Qual o comando para rodar todos os testes?
  2. Qual o comando para rodar os testes de um arquivo específico?
  3. Existe comando de linting ou padrão de código?
  4. Algum outro comando relevante?"

Dev: "1. ./vendor/bin/sail test
      2. ./vendor/bin/sail test --filter {class}
      3. ./vendor/bin/sail bin phpcs
      4. ./vendor/bin/sail artisan migrate:fresh --seed"
```

---

#### ETAPA 1 — Agente gera o brief (automático):

O agente chama `create_task_brief` e salva `.senior-mind/refatoracao-client-creditbucket-brief.md`. O dev abre no IDE e vê um plano **técnico**:

```markdown
# Task Brief — Refatoracao: Client -> CreditBucket

## Contexto
Atualmente available_credits fica em Client. O novo modelo CreditBucket
separa cada pacote contratado em um registro próprio com saldo e expiração.
CreditManager não muda de assinatura — apenas o modelo Creditable muda.

## Comandos do Projeto
- Rodar todos os testes: ./vendor/bin/sail test
- Rodar testes de um arquivo: ./vendor/bin/sail test --filter {class}
- Linting: ./vendor/bin/sail bin phpcs
- Setup: ./vendor/bin/sail artisan migrate:fresh --seed

## Arquitetura da Solução
CreditPackage — catálogo de pacotes
      ↓ ao contratar
CreditBucket — implements Creditable (saldo + expires_at)
      ↓
CreditManager — consume / grant / rollback (sem mudança)
      ↓
CreditLedgerEntry — passa a referenciar CreditBucket

## Arquivos Críticos
| Arquivo                                      | Ação                                    |
|----------------------------------------------|-----------------------------------------|
| app/Models/CreditBucket.php                  | Criar: Creditable + campos              |
| app/Models/CreditLedgerEntry.php             | Trocar client() → bucket()              |
| app/Models/Client.php                        | Remover Creditable, manter consulta     |
| app/Http/Controllers/ExportRecordController  | Buscar bucket ativo ao consumir         |
| database/factories/CreditBucketFactory.php   | Implementar definition()                |
| tests/Feature/App/Credits/CreditsManagerTest | Migrar ClientFactory → CreditBucketFactory |

## Fases de Implementação

### Fase 1 — CreditBucket: Modelo e Factory

**Objetivo:** Criar o modelo CreditBucket com Creditable e a factory para testes.

**TDD:**

RED — `tests/Feature/App/Models/CreditBucketTest.php`:
- `testBucketImplementsCreditable`
- `testBucketHasRequiredFields`
- `testBucketLedgerEntryModelReturnsCreditLedgerEntry`
- `testGetAvailableCreditsReturnsCorrectValue`

GREEN — `app/Models/CreditBucket.php` + `database/factories/CreditBucketFactory.php`

REFACTOR + `./vendor/bin/sail bin phpcs`

### Fase 2 — Client: Adicionar getAvailableCredits()

**Objetivo:** Client consulta créditos somando buckets não expirados.

**TDD:**

RED — `tests/Feature/App/Models/ClientTest.php`:
- `testGetAvailableCredits_SumsNonExpiredBuckets`
- `testGetAvailableCredits_IgnoresExpiredBuckets`
- `testGetAvailableCredits_ReturnsZeroWhenNoBuckets`

GREEN — `app/Models/Client.php` (novo método getAvailableCredits())

REFACTOR + `./vendor/bin/sail bin phpcs`

### Fase 3 — CreditLedgerEntry: Trocar Client → CreditBucket
...
### Fase 4 — CreditManager: Migrar testes
...
### Fase 5 — ExportRecordController: Usar CreditBucket
...
### Fase 6 — Limpeza do Client
...

## Verificacao End-to-End
./vendor/bin/sail test
./vendor/bin/sail bin phpcs

---
Quais fases deseja executar? (números separados por vírgula ou "todas")
```

O dev lê e vê que **o plano é exatamente igual ao que ele mesmo escreveu manualmente**. Confia, e responde:

```
Quero fazer a fase 1. O João vai fazer a fase 2 e 3 amanhã.
```

---

#### ETAPA 2 — Agente gera `.senior-mind/refatoracao-client-creditbucket-plan.json` com a fase selecionada:

```json
{
  "task": "Refatoracao: Client -> CreditBucket",
  "briefFile": ".senior-mind/refatoracao-client-creditbucket-brief.md",
  "commands": {
    "test": "./vendor/bin/sail test",
    "testFile": "./vendor/bin/sail test --filter {class}",
    "lint": "./vendor/bin/sail bin phpcs"
  },
  "phases": [
    { "number": 1, "name": "CreditBucket: Modelo e Factory",  "selected": true,  "status": "pending" },
    { "number": 2, "name": "Client: getAvailableCredits",      "selected": false, "status": "skipped" },
    { "number": 3, "name": "CreditLedgerEntry: Client→Bucket", "selected": false, "status": "skipped" },
    ...
  ]
}
```

---

#### ETAPA 3 — Agente executa somente a Fase 1 (automático):

```
[Fase 1 — CreditBucket: Modelo e Factory]
testFile: tests/Feature/App/Models/CreditBucketTest.php

Chamando: tdd_guide(phase="red", feature="CreditBucket", technology="laravel")
→ Escrevendo: testBucketImplementsCreditable, testBucketHasRequiredFields...
→ Rodando testes: FALHAM — CreditBucket.php não existe [gate RED ok]

Chamando: tdd_guide(phase="green", ...)
→ Implementando CreditBucket.php com $fillable, $casts, getLedgerEntryModel()
→ Preenchendo CreditBucketFactory.php
→ Rodando testes: PASSAM [gate GREEN ok]

Chamando: tdd_guide(phase="refactor", ...)
Chamando: review_code(code="CreditBucket.php", language="php")
Chamando: detect_code_smells(...)
→ Aplicando ajustes...
→ ./vendor/bin/sail bin phpcs — PASSA [gate REFACTOR ok]
```

Atualiza `task-plan.json` → Fase 1: `"status": "done"`.

Reporta ao dev:
```
Fase 1 concluída.
- Criado: app/Models/CreditBucket.php
- Criado: database/factories/CreditBucketFactory.php
- Testes: tests/Feature/App/Models/CreditBucketTest.php (4 testes passando)
- Code review: sem violações

.senior-mind/refatoracao-client-creditbucket-plan.json atualizado.
Fases 2-6 continuam com status "skipped" para o João.
Commite os arquivos .senior-mind/ para compartilhar o estado com o time.
```

---

#### O que cada dev faz (uma fase = uma sessão):

| Dev | Sessão | O que digita | Fase |
|-----|--------|-------------|------|
| Você | Sessão 1 | `/task Refatorar créditos Client→CreditBucket` | Gera brief + plan |
| Você | Sessão 2 | `/task fase 1` | Fase 1 — contexto limpo |
| João | Sessão 3 | `/task fase 2` | Fase 2 — contexto limpo |
| João | Sessão 4 | `/task fase 3` | Fase 3 — contexto limpo |
| Você | Sessão 5 | `/task fase 4` | Fase 4 — contexto limpo |

**Após a Sessão 1** (geração do brief), o dev commita os arquivos `.senior-mind/` para que o João possa acessar o plano. A partir daí, cada sessão começa em contexto limpo e o agente lê o estado atual do `task-plan.json` para saber onde está.

Os arquivos `.senior-mind/[slug]-brief.md` e `.senior-mind/[slug]-plan.json` ficam no repositório — são o artefato compartilhado entre os devs, da mesma forma que o `prd.json` no Ralph.

---

## Seção a adicionar no README.md do Senior Mind

Inserir após a seção "Fluxo Tipico de Uso Combinado" (linha ~256 do README atual), antes de "Configuracao no Cursor".

A seção deve se chamar **"Task Workflow: Plano Tecnico + TDD por Fase"** e explicar o fluxo completo com exemplos práticos. Conteúdo exato a inserir:

---

```markdown
## Task Workflow: Plano Tecnico + TDD por Fase

O **Task Workflow** e um fluxo estruturado para implementar tarefas tecnicas do dia a dia — modulos, servicos, bug fixes e refatoracoes — com plano revisavel, TDD por fase e rastreamento de progresso compartilhavel com o time.

Projetado para **trabalho assistido** (dev presente) e **TDD central** em cada fase.

### Como funciona

```
/task [descricao]  →  task-brief.md (revise)  →  confirmar + selecionar fases  →  task-plan.json  →  /task fase N (nova sessao)
```

**Artefatos gerados em `.senior-mind/` do seu projeto:**

| Arquivo | Proposito |
|---------|-----------|
| `[slug]-brief.md` | Plano tecnico revisavel — fases, arquivos, TDD detalhado |
| `[slug]-plan.json` | Tracker de progresso por fase — compartilhavel via git |

### Iniciando uma nova tarefa

```
/task Implementar modulo de pagamentos no NestJS com Stripe
```

O agente ira:
1. Perguntar os comandos do seu projeto (teste, lint, build)
2. Gerar `.senior-mind/modulo-pagamentos-nestjs-brief.md` com plano tecnico completo
3. **Parar para voce revisar** — abra o arquivo e confirme se as fases estao corretas
4. Apos confirmacao, perguntar quais fases deseja executar agora
5. Gerar `.senior-mind/modulo-pagamentos-nestjs-plan.json`
6. Executar as fases selecionadas com TDD (RED → GREEN → REFACTOR)

### Executando uma fase especifica

Quando o brief ja existe (em outra sessao ou por outro dev do time):

```
/task fase 2
```

O agente encontra o `*-plan.json` em `.senior-mind/`, executa a Fase 2 em contexto limpo e encerra a sessao ao concluir. Cada fase roda em sessao propria — sem acumulo de contexto.

```
/task fase 2 e 3     # executa as fases 2 e 3 em sequencia
/task todas as fases  # executa todas as fases pendentes
```

### Colaboracao entre devs

Os arquivos `.senior-mind/` sao commitados no repositorio. Isso permite que membros do time trabalhem em fases diferentes de forma independente:

```
# Dev A (hoje)
/task Refatorar sistema de creditos Client->CreditBucket
→ Gera brief + plan, executa Fase 1, commita .senior-mind/

# Dev B (amanha, apos pull)
/task fase 2
→ Agente le o plan.json existente, executa Fase 2 em contexto limpo

# Dev A (depois)
/task fase 4
→ Continua de onde o time parou
```

### Tipos de tarefa suportados

| taskType | Fases geradas |
|----------|--------------|
| `nova-feature` | Alinhamento → TDD Service → API → Refinamentos |
| `bug-fix` | Reproducao (RED) → Correcao (GREEN) → Consolidacao (REFACTOR) |
| `refatoracao` | Rede de Seguranca → Refatoracao → Validacao Arquitetural |
| `modulo` | Entidade → Repository → Service (TDD) → Controller → Refinamentos |
| `servico` | Contratos/Interfaces → Implementacao (TDD) → Integracao |

### Como usar

Para usar o Task Workflow, configure o **Senior Mind MCP** no seu projeto e use `/task` diretamente no seu agente de IA (Claude Code, Cursor, etc.). O MCP ja inclui as tools `create_task_brief` e `create_task_plan` que alimentam o workflow — nenhuma instalacao adicional e necessaria.

Consulte a secao **Inicio Rapido** para configurar o Senior Mind MCP no seu ambiente.
```

---

## Verificação

1. **Testes**: `npm run test:run` — ambos os test files devem passar
2. **MCP Inspector**: `http://localhost:6274`:
   - `create_task_brief` → output deve conter: seção "Comandos do Projeto", arquivos críticos, fases com TDD explícito no estilo do `credit-bucket-refactor.md`, fases ordenadas por dependência de execução
   - `create_task_plan(selectedPhases=[1])` → apenas fase 1 com `selected=true`, demais `status="skipped"`, campo `commands` populado
3. **Smoke test**: usar `/task` em projeto real → agente pergunta os comandos antes de gerar o brief → brief salvo em `.senior-mind/[slug]-brief.md` → plano em `.senior-mind/[slug]-plan.json`
4. **Ordenação das fases**: verificar que em `taskType=modulo` a entidade vem antes do repository, que vem antes do service — nunca o inverso
5. **Colaboração**: dois devs abrindo o mesmo `.senior-mind/[slug]-brief.md` e selecionando fases diferentes → verificar que o JSON reflete corretamente as seleções
6. **README**: a seção "Task Workflow" renderiza corretamente no GitHub com exemplos legíveis
