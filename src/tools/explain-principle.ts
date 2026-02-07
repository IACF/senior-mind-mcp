import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

const principleEnum = z.enum([
  "srp",
  "ocp",
  "lsp",
  "isp",
  "dip",
  "dry",
  "kiss",
  "yagni",
  "demeter",
  "tell-dont-ask",
  "first",
  "solid",
]);

const languageEnum = z.enum(["php", "typescript", "javascript", "generic"]);

type Principle = z.infer<typeof principleEnum>;
type Language = z.infer<typeof languageEnum>;

interface PrincipleEntry {
  name: string;
  fullName: string;
  explanation: string;
  example: string;
  counterExample: string;
  application?: string;
}

const PRINCIPLES: Record<Principle, PrincipleEntry> = {
  srp: {
    name: "srp",
    fullName: "Single Responsibility Principle (SRP)",
    explanation:
      "Uma classe ou modulo deve ter apenas um motivo para mudar. Responsabilidade unica reduz acoplamento, facilita testes e evolucao. Quando uma classe faz muitas coisas, mudancas em uma area afetam as outras.",
    example:
      "TypeScript: CreateUserUseCase que apenas orquestra; UserRepository para persistencia; UserNotifier para email — cada um com uma responsabilidade.\nPHP: Controller fino que chama um Use Case; Use Case que chama Repository e Notifier separados.",
    counterExample:
      "Classe UserService que persiste usuario, envia email, gera log e gera PDF. Qualquer mudanca em email, log ou PDF exige alterar a mesma classe.",
    application:
      "Ao criar um novo servico ou use case, pergunte: 'quantos motivos essa classe tem para mudar?' Se for mais de um, extraia responsabilidades.",
  },
  ocp: {
    name: "ocp",
    fullName: "Open/Closed Principle (OCP)",
    explanation:
      "Entidades devem ser abertas para extensao e fechadas para modificacao. Novos comportamentos entram por novos codigos (novas classes, implementacoes) em vez de alterar codigo existente. Reduz risco de regressao.",
    example:
      "TypeScript: interface ShippingStrategy; StandardShipping e ExpressShipping implementam; novo tipo = nova classe.\nPHP: Interface PaymentGateway; StripeGateway e PixGateway; container injeta a implementacao.",
    counterExample:
      "Funcao calculateShipping(order) com if (type === 'standard') ... else if (type === 'express') ... Adicionar tipo 'priority' exige editar essa funcao.",
    application:
      "Ao adicionar um novo tipo ou variante, prefira criar nova classe que implementa uma interface existente em vez de adicionar else/switch.",
  },
  lsp: {
    name: "lsp",
    fullName: "Liskov Substitution Principle (LSP)",
    explanation:
      "Subtipos devem ser substituiveis por seus tipos base sem quebrar o comportamento esperado. Onde o codigo usa a abstracao, qualquer implementacao deve respeitar o contrato (pre-pos-condicoes, invariantes).",
    example:
      "Qualquer implementacao de UserRepository pode ser usada no CreateUserUseCase; cliente nao sabe se e Postgres ou InMemory.",
    counterExample:
      "Square extends Rectangle mas setWidth em Square altera tambem altura; cliente que usa Rectangle e chama setWidth(5); setHeight(4) recebe 4x4 em vez de 5x4.",
    application:
      "Ao herdar ou implementar uma interface, garanta que o cliente que depende da base nao seja surpreendido ao receber a subclasse.",
  },
  isp: {
    name: "isp",
    fullName: "Interface Segregation Principle (ISP)",
    explanation:
      "Clientes nao devem depender de interfaces que nao usam. Interfaces grandes forcam implementacoes a ter metodos vazios ou dependencias desnecessarias. Prefira interfaces pequenas e especificas.",
    example:
      "ReadOnlyRepository com find/findAll; WritableRepository com save/delete. Cliente de leitura depende so de ReadOnlyRepository.",
    counterExample:
      "Interface Worker { work(); eat(); sleep(); } e Robot obrigado a implementar eat() e sleep() vazios ou lancando excecao.",
    application:
      "Ao definir uma interface, pergunte: 'todo cliente precisa de todos os metodos?' Se nao, segregue em interfaces menores.",
  },
  dip: {
    name: "dip",
    fullName: "Dependency Inversion Principle (DIP)",
    explanation:
      "Modulos de alto nivel nao devem depender de modulos de baixo nivel; ambos devem depender de abstracoes. Abstracoes nao dependem de detalhes; detalhes dependem de abstracoes. Permite trocar implementacoes sem alterar regras de negocio.",
    example:
      "TypeScript: CreateUserUseCase recebe IUserRepository e IEmailService no construtor; main ou composition root injeta PostgresUserRepository e SendGridEmailService.\nPHP: Service Provider faz bind de PaymentGateway para StripePaymentGateway; Controller recebe PaymentGateway por injecao.",
    counterExample:
      "Use Case instancia new PostgresUserRepository() e new SendGridEmailService() dentro da classe.",
    application:
      "No nucleo (domain, use cases), dependa de interfaces; na borda (main, bootstrap), instancie as implementacoes e injete.",
  },
  dry: {
    name: "dry",
    fullName: "DRY - Don't Repeat Yourself",
    explanation:
      "Cada conhecimento deve ter uma representacao unica e autoritativa no sistema. Duplicacao de logica leva a inconsistencia e manutencao custosa: alterar em um lugar e esquecer outro gera bugs.",
    example:
      "Extrair validacao de email para funcao validateEmail(); extrair formato de data para formatDate(). Todos os pontos que precisam usam a mesma funcao.",
    counterExample:
      "Mesma expressao regular ou mesma sequencia de ifs copiada em 5 arquivos diferentes.",
    application:
      "Ao colar codigo, pare e extraia para uma funcao ou modulo compartilhado. Em formularios, centralize validacoes e mensagens.",
  },
  kiss: {
    name: "kiss",
    fullName: "KISS - Keep It Simple, Stupid",
    explanation:
      "Prefira solucoes simples em vez de complexas. Codigo simples e mais facil de entender, testar e modificar. Complexidade desnecessaria e uma forma de debito tecnico.",
    example:
      "Um loop for e um if em vez de um padrao Observer para um caso que nao vai crescer.",
    counterExample:
      "Framework de plugins e eventos para um CRUD de uma tabela que nunca tera mais de 3 regras.",
    application:
      "Antes de introduzir abstracao ou padrao, pergunte: 'o problema exige isso agora?' Se nao, implemente o mais direto.",
  },
  yagni: {
    name: "yagni",
    fullName: "YAGNI - You Aren't Gonna Need It",
    explanation:
      "Nao adicione funcionalidade ate que seja necessaria. Codigo antecipado custa tempo agora e dificulta mudancas depois (mais codigo para alterar). Requisitos mudam; o que voce 'acha' que vai precisar muitas vezes nao acontece.",
    example:
      "Nao criar interface Repository 'para o futuro' se hoje so existe uma implementacao e nenhum teste precisa de mock.",
    counterExample:
      "Camada de cache, logging e metricas antes de ter primeiro usuario; suporte a 10 idiomas quando so existe um.",
    application:
      "Implemente o minimo que atende o requisito atual. Refatore quando o segundo caso aparecer (Rule of Three).",
  },
  demeter: {
    name: "demeter",
    fullName: "Lei de Demeter",
    explanation:
      "Um objeto deve conhecer o minimo possivel sobre a estrutura de outros objetos. Evite cadeias de chamadas (a.getB().getC().doSomething()) — isso acopla o cliente aos detalhes internos e torna mudancas fragil.",
    example:
      "Em vez de order.getCustomer().getAddress().getCity(), o Order expoe getCustomerCity() e delega internamente, ou o Customer expoe getCity() e o Order chama order.getCustomer().getCity().",
    counterExample:
      "obj.getA().getB().getC().method() — o cliente depende de A, B e C.",
    application:
      "Se voce esta encadeando mais de um ponto (.), considere mover o comportamento para o objeto que possui os dados ou expor um metodo que encapsula a cadeia.",
  },
  "tell-dont-ask": {
    name: "tell-dont-ask",
    fullName: "Tell, Don't Ask",
    explanation:
      "Em vez de pedir dados a um objeto e decidir fora o que fazer, diga ao objeto o que fazer. Objetos encapsulam dados e comportamento; pedir getters e decidir fora quebra encapsulamento e espalha logica.",
    example:
      "Em vez de if (order.getTotal() > 100) { order.setDiscount(0.1); }, chamar order.applyVolumeDiscount() e o Order decide internamente se aplica e quanto.",
    counterExample:
      "Classe com muitos getters; logica de negocio espalhada em servicos que leem dados da entidade e alteram via setters.",
    application:
      "Ao fazer getX() para em seguida fazer if/switch e chamar setY(), mova essa logica para um metodo do proprio objeto.",
  },
  first: {
    name: "first",
    fullName: "F.I.R.S.T. - Testes Limpos",
    explanation:
      "Testes devem ser Fast (rapidos), Independent (independentes), Repeatable (repetiveis), Self-validating (resultado binario pass/fail), Timely (escritos no momento certo, ex.: TDD).",
    example:
      "Testes unitarios que rodam em memoria, sem I/O; cada teste configura seus dados; nenhum depende de ordem; assert claro (expect(result).toBe(expected)).",
    counterExample:
      "Teste que chama API real e leva 5 segundos; teste que depende de arquivo no disco; teste que so passa se rodar depois de outro.",
    application:
      "Mantenha testes rapidos com mocks; evite testes que dependem de estado global ou ordem de execucao.",
  },
  solid: {
    name: "solid",
    fullName: "SOLID - Resumo",
    explanation:
      "SOLID sao cinco principios de design orientado a objetos: SRP (uma responsabilidade), OCP (aberto para extensao, fechado para modificacao), LSP (substituicao de subtipos), ISP (interfaces segregadas), DIP (depender de abstracoes). Juntos levam a codigo testavel e evolutivo.",
    example:
      "Use Cases que dependem de interfaces (DIP); novas regras por novas classes (OCP); cada classe com um motivo para mudar (SRP).",
    counterExample:
      "God class que faz tudo; switch/if para cada tipo novo; subclasse que quebra contrato; interface com 20 metodos; new Concrete() dentro do nucleo.",
    application:
      "Use SRP e DIP como base; OCP e LSP ao estender comportamento; ISP ao definir contratos. Aplicar com pragmatismo (YAGNI).",
  },
};

function getPrincipleKey(input: string): Principle | null {
  const normalized = input.toLowerCase().trim().replace(/\s+/g, "-");
  if (Object.keys(PRINCIPLES).includes(normalized)) return normalized as Principle;
  const aliases: Record<string, Principle> = {
    "single responsibility": "srp",
    "open closed": "ocp",
    "liskov substitution": "lsp",
    "interface segregation": "isp",
    "dependency inversion": "dip",
    "tell dont ask": "tell-dont-ask",
    "object calisthenics": "demeter",
  };
  return aliases[normalized] || null;
}

function formatOutput(
  entry: PrincipleEntry,
  language: Language,
  context: string | undefined
): string {
  let output = `# ${entry.fullName}\n\n`;
  output += `## Explicacao\n\n${entry.explanation}\n\n`;
  output += `## Exemplo (aplicacao correta)\n\n${entry.example}\n\n`;
  output += `## Contra-exemplo (evitar)\n\n${entry.counterExample}\n\n`;
  if (entry.application) {
    output += `## Aplicacao pratica\n\n${entry.application}\n\n`;
  }
  output += `**Linguagem considerada**: ${language}\n\n`;
  if (context) {
    output += `## No seu contexto\n\n${context}\n\n`;
    output +=
      "Use a explicacao e os exemplos acima para aplicar o principio neste contexto. Mantenha a mesma ideia: responsabilidade unica, dependencia de abstracoes, ou o que se aplique.\n";
  }
  return output;
}

function listAvailablePrinciples(): string {
  return (
    "Principios disponiveis: " +
    Object.keys(PRINCIPLES).join(", ") +
    ". Use um deles no parametro principle."
  );
}

export function register(server: McpServer): void {
  server.tool(
    "explain_principle",
    "Dicionario interativo de principios (SRP, OCP, LSP, ISP, DIP, DRY, KISS, YAGNI, Demeter, Tell Don't Ask, FIRST, SOLID): explicacao, exemplo, contra-exemplo e aplicacao no contexto",
    {
      principle: z
        .string()
        .describe(
          "Principio: srp, ocp, lsp, isp, dip, dry, kiss, yagni, demeter, tell-dont-ask, first, solid"
        ),
      language: languageEnum.describe("Linguagem do codigo (php, typescript, javascript, generic)"),
      context: z
        .string()
        .optional()
        .describe("Contexto opcional para aplicar o principio (ex.: validacao em React)"),
    },
    async ({ principle, language, context }) => {
      const key =
        getPrincipleKey(principle) ||
        (Object.keys(PRINCIPLES).includes(principle.toLowerCase())
          ? (principle.toLowerCase() as Principle)
          : null);

      if (!key || !PRINCIPLES[key]) {
        const text =
          `Principio "${principle}" nao encontrado.\n\n` +
          listAvailablePrinciples();
        return {
          content: [{ type: "text", text }],
        };
      }

      const entry = PRINCIPLES[key];
      const text = formatOutput(entry, language, context);
      return {
        content: [{ type: "text", text }],
      };
    }
  );
}
