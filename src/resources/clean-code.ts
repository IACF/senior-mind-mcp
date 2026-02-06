import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

const CLEAN_CODE_CONTENT = `# Clean Code - Principios de Robert C. Martin

## 1. Nomes Significativos

- Use nomes que revelem a intencao: o nome deve dizer por que existe, o que faz e como e usado.
- Evite desinformacao: nao use nomes que possam ser confundidos com outros conceitos.
- Faca distincoes significativas: nao use nomes como \`data\`, \`info\`, \`temp\` sem contexto.
- Use nomes pronunciaveis e pesquisaveis.

### Bom exemplo:
\`\`\`typescript
const elapsedTimeInDays: number = 5;
const activeUsers: User[] = users.filter(u => u.isActive);
\`\`\`

### Mau exemplo:
\`\`\`typescript
const d: number = 5;
const list: any[] = users.filter(u => u.a);
\`\`\`

## 2. Funcoes Pequenas

- Funcoes devem ser pequenas. Idealmente, menos de 20 linhas.
- Devem fazer apenas UMA coisa e faze-la bem.
- Um nivel de abstracao por funcao.
- Menos argumentos e melhor: ideal 0-2, maximo 3. Mais que isso, considere usar um objeto.

### Bom exemplo:
\`\`\`typescript
function sendWelcomeEmail(user: User): void {
  const email = buildWelcomeEmail(user);
  emailService.send(email);
}

function buildWelcomeEmail(user: User): Email {
  return {
    to: user.email,
    subject: "Bem-vindo!",
    body: renderWelcomeTemplate(user.name),
  };
}
\`\`\`

### Mau exemplo:
\`\`\`typescript
function processUser(user: User): void {
  // valida, envia email, atualiza banco, gera log...
  // 100+ linhas fazendo tudo
}
\`\`\`

## 3. DRY (Don't Repeat Yourself)

- Cada conhecimento deve ter uma unica representacao no sistema.
- Duplicacao e a raiz de muitos problemas de manutencao.
- Extraia logica repetida em funcoes, classes ou modulos reutilizaveis.

## 4. KISS (Keep It Simple, Stupid)

- A simplicidade e a sofisticacao suprema.
- Prefira solucoes simples e diretas.
- Nao adicione complexidade desnecessaria "para o futuro" (YAGNI - You Aren't Gonna Need It).

## 5. Principios SOLID

### SRP - Single Responsibility Principle
- Uma classe deve ter um, e somente um, motivo para mudar.
- Cada modulo/classe deve ter responsabilidade sobre uma unica parte da funcionalidade.

### OCP - Open/Closed Principle
- Entidades de software devem ser abertas para extensao, fechadas para modificacao.
- Use abstracoes (interfaces, classes abstratas) para permitir novos comportamentos sem alterar codigo existente.

### LSP - Liskov Substitution Principle
- Subtipos devem ser substituiveis por seus tipos base sem alterar o comportamento correto do programa.

### ISP - Interface Segregation Principle
- Clientes nao devem ser forcados a depender de interfaces que nao utilizam.
- Prefira interfaces pequenas e especificas.

### DIP - Dependency Inversion Principle
- Modulos de alto nivel nao devem depender de modulos de baixo nivel. Ambos devem depender de abstracoes.
- Abstracoes nao devem depender de detalhes. Detalhes devem depender de abstracoes.

## 6. Formatacao e Comentarios

### Formatacao:
- Consistencia e mais importante que preferencia pessoal.
- Use formatadores automaticos (Prettier, ESLint).
- Agrupe codigo relacionado; separe conceitos diferentes com linhas em branco.

### Comentarios:
- O melhor comentario e aquele que voce nao precisa escrever — codigo limpo e autodocumentado.
- Comentarios bons: explicam o "por que", nao o "o que".
- Comentarios ruins: codigo comentado, redundancia com o codigo, marcadores de fechamento.

### Bom comentario:
\`\`\`typescript
// Timeout de 30s exigido pelo contrato SLA com o gateway de pagamento
const PAYMENT_TIMEOUT_MS = 30_000;
\`\`\`

### Mau comentario:
\`\`\`typescript
// Seta o timeout para 30000
const timeout = 30000;
\`\`\`

## 7. Tratamento de Erros

- Use excecoes em vez de codigos de retorno de erro.
- Crie classes de excecao especificas para o dominio.
- Nao retorne \`null\` — use Optional/Maybe, excecoes ou valores default.
- Nao passe \`null\` como argumento.

## 8. Testes Limpos

- Testes devem ser tao limpos quanto o codigo de producao.
- Siga o padrao AAA: Arrange, Act, Assert.
- Um assert por teste (quando possivel).
- Testes devem ser rapidos, independentes, repetitivos, auto-validaveis e escritos em tempo habil (F.I.R.S.T.).
`;

export function register(server: McpServer): void {
  server.resource(
    "clean-code",
    "senior-mind://references/clean-code",
    {
      description:
        "Principios de Clean Code de Robert C. Martin: nomes significativos, funcoes pequenas, DRY, KISS, SOLID, formatacao e comentarios",
      mimeType: "text/markdown",
    },
    async () => ({
      contents: [
        {
          uri: "senior-mind://references/clean-code",
          mimeType: "text/markdown",
          text: CLEAN_CODE_CONTENT,
        },
      ],
    })
  );
}
