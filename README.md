# Senior Mind MCP

MCP (Model Context Protocol) server que replica a mentalidade de um desenvolvedor senior. Fornece tools, resources e prompts para guiar agentes de IA (Cursor, Claude Desktop, etc.) com boas praticas de engenharia de software.

## O que e?

O Senior Mind MCP atua como um **copiloto senior** para o seu agente de IA. Em vez de depender apenas do conhecimento geral do LLM, o agente passa a ter acesso a:

- **Principios de Clean Code e Object Calisthenics** para revisoes fundamentadas
- **Convencoes de frameworks** (Laravel, NestJS, Vue 3, React 18) para codigo idiomatico
- **Ferramentas de analise** de arquitetura, code review, refatoracao e TDD
- **Templates estruturados** para decisoes de arquitetura, planejamento e analise SQL

---

## Requisitos

- [Docker](https://docs.docker.com/get-docker/) e Docker Compose
- Ou: [Node.js](https://nodejs.org/) >= 22 (para uso sem Docker)

---

## Inicio Rapido

### 1. Clone o repositorio

```bash
git clone <url-do-repositorio>
cd senior-mind-mcp
```

### 2. Configure o ambiente

```bash
cp .env.example .env
```

Edite o `.env` com seu nome:

```env
DEVELOPER_NAME=SeuNome
```

A variavel `DEVELOPER_NAME` personaliza as mensagens e templates gerados pelo MCP. Se nao definida, assume "Desenvolvedor".

### 3. Execute com Docker

```bash
docker compose up -d
```

Isso inicia dois servicos:

| Servico | Descricao |
|---------|-----------|
| `app` | Servidor MCP (stdio) com hot reload |
| `inspector` | MCP Inspector UI em `http://localhost:6274` |

### 4. Teste com o MCP Inspector

Acesse `http://localhost:6274` no navegador. La voce pode:

- **Tools**: Selecionar e executar qualquer tool com argumentos
- **Resources**: Consultar os resources de conhecimento
- **Prompts**: Invocar prompts e preencher os argumentos para gerar templates

---

## Testes

O projeto segue TDD (Test-Driven Development) com 130 testes cobrindo todas as tools, resources e prompts.

```bash
# Modo watch (re-executa ao salvar)
docker compose exec app npm test

# Execucao unica
docker compose exec app npm run test:run
```

Sem Docker:

```bash
npm test
npm run test:run
```

---

## Componentes Disponiveis

### Tools (7)

Tools sao **acoes que o agente executa** automaticamente quando detecta que precisa analisar, revisar ou gerar algo.

| Tool | Descricao | Argumentos |
|------|-----------|------------|
| `ping` | Verifica se o MCP esta ativo | — |
| `analyze_architecture` | Analisa um problema e propoe opcoes de arquitetura (Clean Architecture, Service Layer, DDD) com pros/cons e recomendacao | `problem`, `technology`, `context` |
| `review_code` | Revisa codigo contra Clean Code e Object Calisthenics, identificando violacoes com severidade e sugestoes | `code`, `language`, `focus` |
| `suggest_refactoring` | Sugere refatoracoes baseadas em Object Calisthenics com exemplos antes/depois | `code`, `language`, `rules` |
| `tdd_guide` | Guia o ciclo TDD (Red-Green-Refactor) com instrucoes e checklists por fase | `feature`, `phase`, `technology`, `code`, `test_code` |
| `compare_sql` | Compara abordagem ORM vs SQL puro com analise de performance | `description`, `technology`, `tables`, `context` |
| `plan_implementation` | Gera plano de implementacao faseado com perguntas de alinhamento | `feature`, `technology`, `requirements` |

### Resources (8)

Resources sao a **base de conhecimento passiva** que o agente consulta automaticamente para fundamentar suas respostas.

| Resource | URI | Conteudo |
|----------|-----|----------|
| Clean Code | `senior-mind://clean-code` | Principios, regras de nomenclatura, funcoes, tratamento de erros |
| Clean Architecture | `senior-mind://clean-architecture` | Camadas, regra de dependencia, use cases, adapters |
| Object Calisthenics | `senior-mind://object-calisthenics` | 9 regras com exemplos de violacao e correcao |
| Laravel Conventions | `senior-mind://laravel-conventions` | Eloquent, FormRequest, Resources, Service Pattern, N+1 |
| NestJS Patterns | `senior-mind://nestjs-patterns` | Modules, DI, DTOs, Pipes, Guards, Interceptors, Repository |
| TDD Reference | `senior-mind://tdd-reference` | Red-Green-Refactor, estrategias, metricas, patterns de teste |
| Vue 3 Patterns | `senior-mind://vue-patterns` | Composition API, script setup, composables, reatividade, performance |
| React 18 Patterns | `senior-mind://react-patterns` | Hooks, custom hooks, component patterns, memoizacao, Suspense |

### Prompts (6)

Prompts sao **templates estruturados** que o usuario invoca explicitamente para iniciar uma conversa guiada.

| Prompt | Descricao | Argumentos |
|--------|-----------|------------|
| `architecture-decision` | Gera template ADR (Architecture Decision Record) | `problem` (obrigatorio), `constraints` (opcional) |
| `tdd-cycle` | Gera guia completo Red-Green-Refactor com checklists | `feature`, `technology` |
| `code-review-backend` | Template de code review para backend | `code`, `framework` (laravel/nestjs) |
| `code-review-frontend` | Template de code review para frontend | `code`, `framework` (vue/react) |
| `implementation-plan` | Questionario de alinhamento + plano faseado | `feature`, `context` (opcional) |
| `sql-analysis` | Analise profunda de query SQL | `query`, `context` (opcional) |

---

## Como o Agente de IA Usa o Senior Mind

### Resources — Base de conhecimento passiva

Resources sao **lidos automaticamente** pelo agente quando ele precisa de contexto sobre um assunto. O agente consulta resources como se fosse uma documentacao interna.

**Exemplos de uso real:**

- Ao pedir "revise este codigo", o agente le `senior-mind://clean-code` e `senior-mind://object-calisthenics` para fundamentar a revisao
- Ao trabalhar com Laravel, o agente le `senior-mind://laravel-conventions` para aplicar convencoes corretas
- Ao discutir arquitetura, o agente le `senior-mind://clean-architecture` como referencia

### Tools — Acoes que o agente executa

Tools sao **chamadas ativamente** pelo agente quando detecta que precisa executar uma analise ou gerar algo. O agente decide sozinho qual tool usar com base no pedido do usuario.

**Exemplos de uso real:**

- Usuario: "Analise a arquitetura para um modulo de pagamentos" → agente chama `analyze_architecture`
- Usuario: "Revise este codigo" → agente chama `review_code` com o codigo
- Usuario: "Sugira refatoracoes para esta classe" → agente chama `suggest_refactoring`
- Usuario: "Me guie no TDD para criar um endpoint de usuarios" → agente chama `tdd_guide` com `phase="red"`
- Usuario: "Compare ORM vs SQL para esta query" → agente chama `compare_sql`
- Usuario: "Crie um plano de implementacao para esta feature" → agente chama `plan_implementation`

### Prompts — Templates que o usuario invoca

Prompts sao **invocados explicitamente** pelo usuario (via menu de prompts no Cursor ou slash command no Claude). Diferente de tools, prompts geram um **template estruturado** que inicia uma conversa guiada.

**Como acessar:**

- **Cursor**: Aba "Prompts" no painel MCP, ou digitando `/` no chat
- **Claude Desktop**: Icone de clip (anexar) → "Choose an integration"

**Exemplos de uso real:**

- Selecione `code-review-backend`, preencha `code` e `framework: laravel` → receba um checklist completo de review
- Selecione `architecture-decision`, preencha `problem` → receba um template ADR
- Selecione `implementation-plan`, preencha `feature` → receba questionario de alinhamento + plano faseado
- Selecione `sql-analysis`, preencha `query` → receba template de analise SQL completo

### Fluxo Tipico de Uso Combinado

Exemplo de uma sessao real de trabalho:

```
1. Invoque o prompt `implementation-plan` para "Modulo de autenticacao JWT"
   → Receba questionario + plano faseado

2. Peca ao agente para analisar a arquitetura
   → Agente chama tool `analyze_architecture` e le resource `clean-architecture`

3. Documente a decisao com prompt `architecture-decision`
   → Receba template ADR preenchido

4. Inicie TDD com prompt `tdd-cycle` para a primeira fase
   → Receba guia Red-Green-Refactor

5. Durante o codigo, peca revisao
   → Agente chama tool `review_code` (consultando resources de Clean Code)

6. Apos implementar, peca sugestoes de refatoracao
   → Agente chama tool `suggest_refactoring`
```

---

## Configuracao no Cursor

Adicione ao arquivo `.cursor/mcp.json` do seu projeto ou da configuracao global:

**Com Docker (recomendado):**

```json
{
  "mcpServers": {
    "senior-mind": {
      "command": "docker",
      "args": ["compose", "-f", "/caminho/para/senior-mind-mcp/docker-compose.yml", "exec", "-T", "app", "node", "dist/index.js"]
    }
  }
}
```

**Sem Docker (direto com Node.js):**

```json
{
  "mcpServers": {
    "senior-mind": {
      "command": "npx",
      "args": ["tsx", "src/index.ts"],
      "cwd": "/caminho/para/senior-mind-mcp",
      "env": {
        "DEVELOPER_NAME": "SeuNome"
      }
    }
  }
}
```

## Configuracao no Claude Desktop

Edite o arquivo de configuracao do Claude Desktop (`claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "senior-mind": {
      "command": "npx",
      "args": ["tsx", "src/index.ts"],
      "cwd": "/caminho/para/senior-mind-mcp",
      "env": {
        "DEVELOPER_NAME": "SeuNome"
      }
    }
  }
}
```

---

## Integracao com Context7

O Senior Mind pode ser usado em conjunto com o [Context7 MCP](https://context7.com) para:

- **Documentacao atualizada**: O Context7 busca documentacao em tempo real dos frameworks (Laravel, NestJS, Vue, React), enquanto o Senior Mind fornece convencoes e boas praticas
- **Complementaridade**: O Senior Mind ensina *como* escrever bom codigo; o Context7 fornece a documentacao *atualizada* de cada framework

### Configurando o Context7

**No Cursor** — Adicione ao `.cursor/mcp.json` (junto com o Senior Mind):

```json
{
  "mcpServers": {
    "senior-mind": {
      "command": "npx",
      "args": ["tsx", "src/index.ts"],
      "cwd": "/caminho/para/senior-mind-mcp",
      "env": { "DEVELOPER_NAME": "SeuNome" }
    },
    "context7": {
      "url": "https://mcp.context7.com/mcp"
    }
  }
}
```

**No Claude Desktop** — Adicione ao `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "senior-mind": {
      "command": "npx",
      "args": ["tsx", "src/index.ts"],
      "cwd": "/caminho/para/senior-mind-mcp",
      "env": { "DEVELOPER_NAME": "SeuNome" }
    },
    "context7": {
      "url": "https://mcp.context7.com/mcp"
    }
  }
}
```

### Como usar os dois juntos

Adicione `use context7` ao seu prompt para que o agente busque documentacao atualizada no Context7, enquanto o Senior Mind aplica as boas praticas:

```
Crie um endpoint de autenticacao JWT no NestJS. use context7

→ O Context7 busca a documentacao atual do NestJS e JWT
→ O Senior Mind aplica Clean Architecture, SOLID e convencoes NestJS
→ O agente combina ambos para gerar codigo idiomatico e bem estruturado
```

---

## Estrutura do Projeto

```
senior-mind-mcp/
├── src/
│   ├── index.ts              # Entry point (stdio transport)
│   ├── server.ts             # Criacao do McpServer e registro de componentes
│   ├── config.ts             # Configuracao via .env
│   ├── tools/
│   │   ├── index.ts          # Registro de todas as tools
│   │   ├── ping.ts
│   │   ├── analyze-architecture.ts
│   │   ├── review-code.ts
│   │   ├── suggest-refactoring.ts
│   │   ├── tdd-guide.ts
│   │   ├── compare-sql.ts
│   │   └── plan-implementation.ts
│   ├── resources/
│   │   ├── index.ts          # Registro de todos os resources
│   │   ├── clean-code.ts
│   │   ├── clean-architecture.ts
│   │   ├── object-calisthenics.ts
│   │   ├── laravel-conventions.ts
│   │   ├── nestjs-patterns.ts
│   │   ├── tdd-reference.ts
│   │   ├── vue-patterns.ts
│   │   └── react-patterns.ts
│   └── prompts/
│       ├── index.ts          # Registro de todos os prompts
│       ├── architecture-decision.ts
│       ├── tdd-cycle.ts
│       ├── code-review-backend.ts
│       ├── code-review-frontend.ts
│       ├── implementation-plan.ts
│       └── sql-analysis.ts
├── tests/
│   ├── config.test.ts
│   ├── server.test.ts
│   ├── tools/
│   │   ├── ping.test.ts
│   │   ├── analyze-architecture.test.ts
│   │   ├── review-code.test.ts
│   │   ├── suggest-refactoring.test.ts
│   │   ├── tdd-guide.test.ts
│   │   ├── compare-sql.test.ts
│   │   └── plan-implementation.test.ts
│   ├── resources/
│   │   ├── fundamentals.test.ts
│   │   ├── backend.test.ts
│   │   └── frontend.test.ts
│   └── prompts/
│       ├── architecture-tdd.test.ts
│       ├── code-review.test.ts
│       └── planning-sql.test.ts
├── docker-compose.yml
├── Dockerfile
├── package.json
├── tsconfig.json
├── vitest.config.ts
└── .env
```

---

## Como Extender

O projeto segue o padrao modular `register(server)`. Para adicionar novos componentes:

### Adicionar uma nova Tool

1. Crie `src/tools/minha-tool.ts`:

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

export function register(server: McpServer): void {
  server.tool(
    "minha_tool",
    "Descricao clara do que a tool faz",
    {
      argumento: z.string().describe("O que este argumento espera"),
    },
    async ({ argumento }) => ({
      content: [{ type: "text", text: `Resultado: ${argumento}` }],
    })
  );
}
```

2. Registre em `src/tools/index.ts`:

```typescript
import { register as minhaTool } from "./minha-tool.js";
// ... dentro de registerAllTools:
minhaTool(server);
```

3. Crie o teste `tests/tools/minha-tool.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createServer } from "../../src/server.js";

describe("minha_tool", () => {
  let client: Client;

  beforeEach(async () => {
    const server = createServer();
    const [clientTransport, serverTransport] =
      InMemoryTransport.createLinkedPair();
    await server.connect(serverTransport);
    client = new Client({ name: "test-client", version: "1.0.0" });
    await client.connect(clientTransport);
  });

  it("deve retornar o resultado esperado", async () => {
    const result = await client.callTool({
      name: "minha_tool",
      arguments: { argumento: "teste" },
    });
    const text = (result.content as Array<{ type: string; text: string }>)[0].text;
    expect(text).toContain("Resultado: teste");
  });
});
```

### Adicionar um novo Resource

1. Crie `src/resources/meu-resource.ts`:

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

const CONTEUDO = `# Titulo do Resource

Conteudo em markdown...
`;

export function register(server: McpServer): void {
  server.resource(
    "meu-resource",
    "senior-mind://meu-resource",
    { description: "Descricao do resource" },
    async () => ({
      contents: [
        {
          uri: "senior-mind://meu-resource",
          text: CONTEUDO,
          mimeType: "text/markdown",
        },
      ],
    })
  );
}
```

2. Registre em `src/resources/index.ts`:

```typescript
import { register as meuResource } from "./meu-resource.js";
// ... dentro de registerAllResources:
meuResource(server);
```

### Adicionar um novo Prompt

1. Crie `src/prompts/meu-prompt.ts`:

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

export function register(server: McpServer): void {
  server.prompt(
    "meu-prompt",
    "Descricao do que o prompt gera",
    {
      argumento: z.string().describe("O que este argumento espera"),
    },
    ({ argumento }) => ({
      messages: [
        {
          role: "user" as const,
          content: {
            type: "text" as const,
            text: `Template gerado para: ${argumento}`,
          },
        },
      ],
    })
  );
}
```

2. Registre em `src/prompts/index.ts`:

```typescript
import { register as meuPrompt } from "./meu-prompt.js";
// ... dentro de registerAllPrompts:
meuPrompt(server);
```

### Convencoes

- **Nomes de arquivo**: kebab-case (`minha-tool.ts`)
- **Nomes de tool**: snake_case (`minha_tool`)
- **Nomes de resource/prompt**: kebab-case (`meu-prompt`)
- **URIs de resource**: `senior-mind://nome-do-resource`
- **Testes**: Mesmo nome do modulo com sufixo `.test.ts`, organizados em pastas espelho
- **Cada componente faz UMA coisa** (Single Responsibility)

---

## Observabilidade

Logs e configuracoes de K8s/infraestrutura NAO sao incluidos por padrao neste projeto. Caso necessario, podem ser adicionados sob solicitacao explicita.

---

## Licenca

MIT
