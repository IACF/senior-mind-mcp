# Plano de Evolucao - Senior Mind MCP (v3)

---

## Instrucoes de uso do plano

**Ao concluir uma fase:** Atualize o titulo da secao dessa fase no documento, indicando que foi concluida. Exemplo: altere **"## FASE 1: Prompt Modo Mentor"** para **"## FASE 1: Prompt Modo Mentor (Concluida)"**. Assim fica claro quais fases ja foram realizadas e quais ainda estao pendentes.

**Ao executar uma fase:** Antes de comecar a implementacao, o agente que esta executando o plano deve:
1. **Sugerir qual agente de IA seria o mais adequado** para executar aquela fase (ex.: "Para esta fase recomendo usar o agente X, pois envolve criacao de codigo novo e testes" ou "Para esta fase um agente mais rapido e suficiente, pois e principalmente edicao de texto").
2. **Aguardar voce escolher o agente de IA** — nao prosseguir com a implementacao ate que voce confirme ou selecione o agente (no Cursor: escolher o modelo/agente no chat antes de continuar).
3. **So apos a sua selecao**, dar continuidade ao plano e executar a fase.

Isso garante que cada fase rode com o agente que voce preferir e evita que a execucao avance sem sua decisao.

---

8 fases independentes e numeradas. Cada fase pode ser executada separadamente, em qualquer ordem (exceto a Fase 8 que deve ser a ultima). Todas seguem TDD (Red-Green-Refactor).

---

## Diagnostico Completo do Estado Atual

### RESOURCES: O que existe e o que falta

**Resource `clean-code` (~125 linhas) - RASO:**

- Nomes Significativos: ~20 linhas, 2 exemplos - OK
- Funcoes Pequenas: ~25 linhas, 2 exemplos - OK
- DRY: ~4 linhas, SEM exemplos - MUITO RASO
- KISS: ~3 linhas, SEM exemplos - MUITO RASO
- SOLID: ~20 linhas, SEM exemplos - RASO (so definicoes de 1 linha)
- Tratamento de Erros: ~5 linhas, SEM exemplos - MUITO RASO
- Testes Limpos: ~5 linhas, SEM exemplos - MUITO RASO
- Falta: Boundaries, Classes, Emergence, CQS, niveis de abstracao, Lei de Demeter

**Resource `clean-architecture` (~144 linhas) - BOM mas incompleto:**

- 4 Camadas com exemplos - BOM
- Regra de Dependencia e Boundary Crossing - BOM
- Falta: Screaming Arch, Humble Object, Presenters, Main Component, anti-patterns, pastas reais

**Resource `object-calisthenics` (~233 linhas) - BOM:**

- 9 regras completas com exemplos. Faltam exemplos em PHP e orientacao de adocao gradual.

**Resource `tdd-reference` (~202 linhas) - BOM:**

- Ciclo, estrategias, tipos de teste, AAA, test doubles. Faltam anti-patterns de teste.

### TOOLS: O que detecta e o que falta

**Tool `review_code` - INCOMPLETA:**

- Detecta: `any`, `console.log`, funcoes longas, nomes curtos, muitos parametros, codigo comentado, Regras OC 1/2/5/6/9
- NAO detecta: magic numbers, boolean params, God class, return types, nomes genericos, null return, Regras OC 3/4/7/8

**Tool `suggest_refactoring` - GENERICA DEMAIS:**

- Implementa Regras 1, 2, 3, 5, 9 - mas as sugestoes sao templates genericos, nao refatoram o codigo real
- NAO implementa (embora liste): Regras 4, 6, 7, 8

**Tool `analyze_architecture` - ESTATICA:**

- Sempre retorna 3 opcoes fixas (Clean Architecture, Service Layer, DDD) independente do problema

**Tool `plan_implementation` - SEM recomendacao de agente de IA:**

- Gera plano faseado mas nao indica qual modelo/agente usar por fase
- As fases ja sao numeradas e independentes - OK

**Prompt `implementation-plan` - SEM recomendacao de agente de IA:**

- Gera checklist faseado mas sem indicacao de agente por fase

---

## Estrategia de Conteudo

1. **Segmentar por conceito** - Resources focados em vez de monoliticos
2. **Conhecimento publico** - Principios amplamente documentados, conteudo educacional original
3. **Exemplos bilinguais** - TypeScript E PHP (para cobrir Laravel)
4. **Padrao existente** - `register(server)` em cada arquivo, agregados nos `index.ts`

---

## FASE 1: Prompt "Modo Mentor" (Concluida)

**Prioridade:** Alta
**Arquivos:** `src/prompts/mentor-mode.ts`, `tests/prompts/mentor-mode.test.ts`, `src/prompts/index.ts`

### O que criar

Prompt `mentor-mode` que instrui o agente a NAO escrever codigo final ate completar checkpoints de Clean Architecture, Clean Code e TDD.

**Input:**

- `feature` (string): Descricao da feature
- `technology` (enum: "laravel", "nestjs", "generic")
- `complexity` (enum: "low", "medium", "high", optional, default: "medium")

**5 Checkpoints do template gerado:**

**Checkpoint 1 - Analise Arquitetural (Clean Architecture):**

- Identificar camadas envolvidas (Entity, Use Case, Adapter, Framework)
- Listar Entities e regras de negocio
- Definir Use Cases necessarios
- Mapear Interface Adapters e dependencias externas
- Apresentar diagrama de camadas
- Justificar escolhas citando Regra de Dependencia e DIP

**Checkpoint 2 - Revisao Clean Code:**

- Definir convencoes de nomes (classes, metodos, variaveis)
- Planejar tamanho das funcoes (cada uma faz UMA coisa)
- Definir estrategia de tratamento de erros (excecoes de dominio, sem null)
- Identificar onde aplicar DRY, KISS, YAGNI
- Listar potenciais code smells a evitar

**Checkpoint 3 - Contratos e Interfaces (SOLID):**

- Definir interfaces/ports que os Use Cases precisam
- Definir DTOs de entrada e saida
- Verificar SRP de cada classe planejada
- Verificar OCP (extensivel sem modificar)
- Justificar decisoes citando principios SOLID

**Checkpoint 4 - Estrategia de Testes (TDD):**

- Listar cenarios de teste por Use Case (happy path, edge cases, erros)
- Definir test doubles necessarios (mocks, stubs, fakes)
- Propor ordem de implementacao (Entity -> Use Case -> Adapter)
- Definir estrategia por cenario: Fake It, Triangulation ou Obvious Implementation
- Planejar ciclo Red-Green-Refactor

**Checkpoint 5 - Implementacao Guiada:**

- Somente apos aprovacao dos 4 anteriores
- TDD rigoroso, explicar CADA decisao de design
- Object Calisthenics durante o Refactor

**Variacao por complexidade:**

- `low`: Checkpoints 1 e 4 simplificados (sem diagrama, menos cenarios)
- `medium`: Todos completos
- `high`: Todos + analise de trade-offs + ADR (Architecture Decision Record)

### Testes

- Verificar registro do prompt, geracao com argumentos, presenca dos 5 checkpoints
- Testar variacao por complexidade (low/medium/high)
- Testar variacao por tecnologia

---

## FASE 2: Expandir Resources de Clean Code (Concluida)

**Arquivos:** `src/resources/clean-code.ts` (expandir), `src/resources/clean-code-smells.ts` (novo), `src/resources/solid-principles.ts` (novo), `src/resources/index.ts`, `tests/resources/clean-code-advanced.test.ts`

### 2A. Expandir `clean-code` existente

Arquivo: `src/resources/clean-code.ts`

**Topicos a expandir (atualmente rasos):**

- **DRY** - 2 exemplos praticos (extrair funcao, extrair modulo)
- **KISS/YAGNI** - exemplos de over-engineering vs simplicidade
- **Tratamento de Erros** - excecoes de dominio, Result pattern, sem null
- **Testes Limpos** - F.I.R.S.T. com exemplos

**Topicos a adicionar:**

- **Classes** - coesao, tamanho, SRP aplicado a classes
- **Boundaries** - wrapping de APIs externas, Adapter/Facade
- **Niveis de Abstracao** - funcoes em unico nivel, step-down rule
- **Command Query Separation (CQS)** - funcoes que fazem OU retornam
- **Emergence** - 4 regras de design simples de Kent Beck

### 2B. Novo resource: `clean-code-smells`

URI: `senior-mind://references/clean-code-smells`

6 categorias com nome, descricao, exemplo e correcao:

- **Comentarios** - obsoletos, redundantes, codigo comentado, journal comments
- **Ambiente** - builds complexos, testes dificeis de rodar
- **Funcoes** - muitos argumentos, flag arguments, funcoes mortas, efeitos colaterais
- **Gerais** - duplicacao, magic numbers, feature envy, God class, selector arguments
- **Nomes** - genericos (data, info), sem contexto, encodings
- **Testes** - insuficientes, sem cobertura de contorno, frageis, lentos

### 2C. Novo resource: `solid-principles`

URI: `senior-mind://references/solid-principles`

Para cada principio (SRP, OCP, LSP, ISP, DIP):

- Explicacao detalhada (2-3 paragrafos)
- Violacao em TypeScript com correcao
- Violacao em PHP/Laravel com correcao
- Quando e aceitavel violar
- Relacao com os outros principios

### Testes

- Validar conteudo expandido do clean-code (novos termos-chave)
- Validar registro e conteudo dos 2 novos resources
- Termos-chave por resource

---

## FASE 3: Expandir Resources de Clean Architecture (Concluida)

**Arquivos:** `src/resources/clean-architecture.ts` (expandir), `src/resources/clean-architecture-patterns.ts` (novo), `src/resources/design-patterns.ts` (novo), `src/resources/index.ts`, `tests/resources/clean-architecture-advanced.test.ts`

### 3A. Expandir `clean-architecture` existente

Arquivo: `src/resources/clean-architecture.ts`

**Adicionar:**

- **Screaming Architecture** - pastas gritam proposito, nao framework
- **Humble Object Pattern** - separar testavel do nao-testavel
- **Presenters e View Models** - formatacao sem poluir Use Cases
- **Main Component / Composition Root** - onde a DI acontece
- **Anti-patterns** - Entidade anemica, Use Case acoplado ao framework, Controller gordo
- **Estruturas de pastas reais** - NestJS e Laravel

### 3B. Novo resource: `clean-architecture-patterns`

URI: `senior-mind://references/clean-architecture-patterns`

Padroes com exemplos em TypeScript e PHP:

- Repository, Gateway, Presenter, Input/Output DTOs, Use Case Interactor, Mapper, Domain Events

### 3C. Novo resource: `design-patterns`

URI: `senior-mind://references/design-patterns`

GoF no contexto Clean Architecture:

- Criacionais: Factory Method, Abstract Factory, Builder
- Estruturais: Adapter, Decorator, Facade
- Comportamentais: Strategy, Observer, Command

### Testes

- Validar conteudo expandido do clean-architecture
- Validar registro e conteudo dos 2 novos resources

---

## FASE 4: Melhorar Tool `review_code` (Concluida)

**Arquivos:** `src/tools/review-code.ts`, `tests/tools/review-code.test.ts`

### Novas deteccoes Clean Code

- **Magic numbers** - numeros literais sem constante nomeada (exceto 0, 1, -1)
- **Boolean/flag arguments** - parametros booleanos que alteram comportamento
- **God class** - classes com mais de 200 linhas ou mais de 10 metodos
- **Missing return types** - funcoes sem tipo de retorno explicito (TS)
- **Nomes genericos** - data, info, temp, manager, processor, helper, utils
- **Retorno de null** - funcoes que retornam null

### Novas deteccoes Object Calisthenics

- **Regra 4** - arrays/colecoes usadas diretamente sem classe propria
- **Regra 7** - classes com mais de 50 linhas
- **Regra 8** - classes com mais de 2 variaveis de instancia

### Testes

- Expandir testes existentes com exemplos para cada nova deteccao

---

## FASE 5: Melhorar Tools `suggest_refactoring` e `analyze_architecture` (Concluida)

**Arquivos:** `src/tools/suggest-refactoring.ts`, `src/tools/analyze-architecture.ts`, testes correspondentes

### 5A. Melhorar `suggest_refactoring`

- **Implementar Regras 4, 6, 7, 8** (listadas mas sem deteccao)
- **Gerar codigo refatorado ESPECIFICO** do usuario, nao templates genericos
- Ex.: se tem `if (x) { doA(); } else { doB(); }`, gerar `if (!x) { doB(); return; } doA();`

### 5B. Melhorar `analyze_architecture`

- **Analise contextual** - variar opcoes por tipo de problema (API, batch, evento, CRUD)
- **Estrutura de pastas** - sugerir organizacao concreta por tecnologia
- **Trade-offs** - complexidade vs beneficio
- **Recomendacao mais rica** - analise semantica alem de keyword matching

### Testes

- Expandir testes existentes

---

## FASE 6: Novas Tools (Concluida)

**Arquivos:** `src/tools/detect-code-smells.ts`, `src/tools/validate-architecture.ts`, `src/tools/explain-principle.ts`, `src/tools/index.ts`, testes correspondentes

### 6A. Tool: `detect_code_smells`

Complementa `review_code` com smells de nivel mais alto.

Input: `code`, `language` (php/typescript/javascript), `category` (comments/functions/general/names/all)
Deteccoes: magic numbers, flag arguments, feature envy, dead code, God class, nomes genericos, Long Method, Data Clumps

### 6B. Tool: `validate_architecture`

Valida conformidade com camadas do Clean Architecture.

Input: `structure`, `technology` (laravel/nestjs/generic), `layer` (entity/use-case/adapter/framework)
Output: Conformidade, imports invalidos, sugestoes

### 6C. Tool: `explain_principle`

Dicionario interativo de principios.

Input: `principle` (srp/ocp/lsp/isp/dip/dry/kiss/yagni/demeter/tell-dont-ask/...), `language`, `context` (opcional)
Output: Explicacao, exemplo, contra-exemplo, aplicacao no contexto

### Testes

- Testes para cada nova tool

---

## FASE 7: Recomendacao de Agente de IA no Plano de Implementacao (Concluida)

**Arquivos:** `src/tools/plan-implementation.ts`, `src/prompts/implementation-plan.ts`, testes correspondentes

### Problema atual

A tool `plan_implementation` e o prompt `implementation-plan` geram planos faseados mas NAO indicam qual agente de IA (modelo) usar em cada fase. Isso e importante porque:

- Tarefas simples (boilerplate, migrations, CRUD) podem usar modelo rapido/barato
- Tarefas complexas (modelagem de dominio, arquitetura, refatoracao) precisam de modelo mais capaz
- O custo pode ser otimizado sem perder qualidade onde importa

### O que adicionar na tool `plan_implementation`

Adicionar ao output de CADA fase uma secao **"Agente de IA recomendado"** com:

- **Nivel do modelo**: "rapido" (tarefas mecanicas) ou "avancado" (tarefas que exigem raciocinio)
- **Justificativa**: Por que este nivel e suficiente para a fase
- **Dica de uso**: Como instruir o agente para a fase (ex.: "peça para gerar a migration com base no modelo definido")

Logica de recomendacao por fase:

- **Fase 1 (Entidades/Modelagem)**: Avancado - requer decisoes de dominio, definir atributos, relacionamentos
- **Fase 2 (Repository)**: Rapido - boilerplate previsivel, interface + implementacao padrao
- **Fase 3 (Service/TDD)**: Avancado - logica de negocio, cenarios de teste, decisoes de design
- **Fase 4 (API/Controller)**: Rapido - controller fino, DTOs, rotas (padrao mecanico)
- **Fase 5 (Refinamentos)**: Depende - paginacao/filtros (rapido), cache/performance (avancado)

Tambem adicionar ao FINAL do plano uma **tabela resumo**:

```
## Recomendacao de Agente por Fase

| Fase | Agente Recomendado | Justificativa |
|---|---|---|
| 1. Entidades | Avancado | Decisoes de dominio e modelagem |
| 2. Repository | Rapido | Boilerplate padrao |
| 3. Service/TDD | Avancado | Logica de negocio e testes |
| 4. API | Rapido | Controller fino, padrao mecanico |
| 5. Refinamentos | Misto | Depende da tarefa especifica |
```

### O que adicionar no prompt `implementation-plan`

Adicionar ao template em cada fase a mesma indicacao de agente. Adicionar ao final a tabela resumo.

Tambem adicionar uma **pergunta de alinhamento** no questionario:

- "Qual IDE/agente de IA voce esta usando? (Cursor, Claude Desktop, Copilot, outro)"

Isso permite adaptar as instrucoes de uso do agente (ex.: no Cursor, usar Agent mode para tarefas avancadas).

### Novo parametro opcional

Adicionar a ambos (tool e prompt) o parametro:

- `team_context` (string, opcional): "Contexto da equipe: nivel de experiencia, ferramentas de IA disponiveis"

Isso permite refinar a recomendacao: equipe junior pode precisar de modelo avancado ate para fases simples.

### Testes

- Expandir testes existentes para verificar presenca de "Agente" ou "modelo" no output
- Testar que cada fase tem recomendacao

---

## FASE 8: Finalizacao

**Arquivos:** `README.md`, `dist/` (rebuild)

### Tarefas

- Atualizar `README.md` com documentacao de todos os novos componentes
- Atualizar tabelas de tools, resources e prompts
- Adicionar secao sobre o Modo Mentor
- Adicionar secao sobre recomendacao de agente de IA
- Rebuild `dist/`: `docker compose exec -T app npx tsc`
- Rodar suite completa de testes: `npm run test:run`
- Validar no MCP Inspector que tudo aparece

---

## Mapa de Dependencias entre Fases

As fases 1 a 7 sao **independentes entre si** e podem ser executadas em qualquer ordem. A fase 8 deve ser a ultima (depende de todas).

---

## Resumo de Entregas

- **FASE 1**: 1 prompt novo (`mentor-mode`)
- **FASE 2**: 1 resource expandido (`clean-code`) + 2 novos (`clean-code-smells`, `solid-principles`)
- **FASE 3**: 1 resource expandido (`clean-architecture`) + 2 novos (`clean-architecture-patterns`, `design-patterns`)
- **FASE 4**: 1 tool melhorada (`review_code`)
- **FASE 5**: 2 tools melhoradas (`suggest_refactoring`, `analyze_architecture`)
- **FASE 6**: 3 tools novas (`detect_code_smells`, `validate_architecture`, `explain_principle`)
- **FASE 7**: 1 tool melhorada (`plan_implementation`) + 1 prompt melhorado (`implementation-plan`)
- **FASE 8**: README + dist + testes finais

**Total final estimado**: ~12 resources, 10 tools, 7 prompts, ~180+ testes
