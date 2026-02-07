import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

const CLEAN_CODE_SMELLS_CONTENT = `# Code Smells - Categorias e Correcoes

Referencia de smells comuns com nome, descricao, exemplo e correcao.

---

## 1. Comentarios

**Smells:** Comentarios obsoletos, redundantes, codigo comentado, journal comments (historico de mudancas no codigo).

**Exemplo (antes):**
\`\`\`typescript
// 2020-01-15 Joao: adicionei validacao
// 2020-03-20 Maria: alterado para async
// TODO: remover depois do deploy
function validateEmail(email: string) {
  // verifica se tem @
  return email.includes("@");
}
\`\`\`

**Correcao (depois):** Remover comentarios que nao explicam "por que". Codigo comentado deve ser removido (o controle de versao guarda o historico). Nome da funcao e condicao ja explicam o que faz.
\`\`\`typescript
function validateEmail(email: string): boolean {
  return email.includes("@");
}
\`\`\`

---

## 2. Ambiente

**Smells:** Builds complexos, testes dificeis de rodar, multiplos passos manuais para rodar a aplicacao.

**Exemplo (antes):** Script de build com 20 passos; testes que so rodam com banco real e variaveis de ambiente especificas.

**Correcao (depois):** Um comando para build (\`npm run build\`), um para testes (\`npm test\`) com mocks e in-memory DB quando possivel; documentar variaveis obrigatorias em um unico lugar (.env.example).

---

## 3. Funcoes

**Smells:** Muitos argumentos, flag arguments (booleanos que mudam o comportamento), funcoes mortas, efeitos colaterais escondidos.

**Exemplo (antes):**
\`\`\`typescript
function saveUser(user: User, sendEmail: boolean, logToFile: boolean): void {
  db.save(user);
  if (sendEmail) emailService.send(user.email);
  if (logToFile) fs.appendFile("log.txt", user.id);
}
\`\`\`

**Correcao (depois):** Eliminar flag arguments; extrair comportamentos em funcoes ou estrategias. Separar comando de notificacao do comando de persistencia.
\`\`\`typescript
function saveUser(user: User): void {
  db.save(user);
}
// Quem chama decide se envia email ou grava log, em chamadas explicitas.
\`\`\`

---

## 4. Gerais

**Smells:** Duplicacao, magic numbers, feature envy (metodo que usa mais dados de outro objeto que do proprio), God class, selector arguments (parametro que indica qual caminho tomar).

**Exemplo (antes):** Classe com 50 metodos; metodo que recebe \`type: "A" | "B"\` e faz if/else por tipo.

**Correcao (depois):** Extrair constantes para magic numbers; quebrar God class em classes coesas; substituir selector arguments por polimorfismo ou funcoes pequenas especificas.

---

## 5. Nomes

**Smells:** Nomes genericos (\`data\`, \`info\`, \`temp\`), sem contexto, encodings (prefixo de tipo no nome, ex.: \`strName\`).

**Exemplo (antes):**
\`\`\`typescript
const data = await fetchData();
const info = processInfo(data);
\`\`\`

**Correcao (depois):** Nomes que revelam intencao e contexto.
\`\`\`typescript
const orderSummary = await fetchOrderSummary(orderId);
const validationResult = validateOrder(orderSummary);
\`\`\`

---

## 6. Testes

**Smells:** Testes insuficientes, sem cobertura de contorno (edge cases), frageis (quebram com mudancas cosmeticas), lentos (dependem de I/O real).

**Exemplo (antes):** Um teste que so cobre happy path; testes que chamam API externa e levam segundos.

**Correcao (depois):** Cobrir cenarios de sucesso, erro e limites; usar mocks para I/O; testes rapidos e independentes (F.I.R.S.T.).
`;

export function register(server: McpServer): void {
  server.resource(
    "clean-code-smells",
    "senior-mind://references/clean-code-smells",
    {
      description:
        "Code smells em 6 categorias: Comentarios, Ambiente, Funcoes, Gerais, Nomes, Testes — com exemplo e correcao",
      mimeType: "text/markdown",
    },
    async () => ({
      contents: [
        {
          uri: "senior-mind://references/clean-code-smells",
          mimeType: "text/markdown",
          text: CLEAN_CODE_SMELLS_CONTENT,
        },
      ],
    })
  );
}
