import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

const SOLID_PRINCIPLES_CONTENT = `# Principios SOLID - Referencia Detalhada

Para cada principio: explicacao, violacao e correcao em TypeScript e PHP/Laravel, quando e aceitavel violar e relacao com os outros principios.

---

## SRP - Single Responsibility Principle

Uma classe (ou modulo) deve ter apenas um motivo para mudar. Responsabilidade unica reduz acoplamento e facilita testes e evolucao. Quando uma classe faz muitas coisas, mudancas em uma area afetam as outras e o codigo fica fragil. A relacao com os outros principios: SRP e a base; violar SRP muitas vezes leva a violar OCP e DIP.

### Violacao em TypeScript (antecipado) e correcao (refatorado):

**Violacao:** Classe que persiste usuario, envia email e gera log.
\`\`\`typescript
class UserService {
  save(user: User) {
    this.db.insert(user);
    this.emailService.sendWelcome(user.email);
    this.logger.log("User created", user.id);
  }
}
\`\`\`

**Correcao:** Separar em responsabilidades: persistencia, notificacao e logging em colaboradores distintos; o orquestrador apenas coordena.
\`\`\`typescript
class CreateUserUseCase {
  constructor(
    private userRepo: UserRepository,
    private notifier: UserNotifier,
    private logger: Logger
  ) {}
  execute(user: User) {
    this.userRepo.save(user);
    this.notifier.sendWelcome(user);
    this.logger.log("User created", user.id);
  }
}
\`\`\`

### Violacao em PHP/Laravel e correcao:

**Violacao:** Controller que valida, persiste, envia email e gera PDF.
\`\`\`php
class OrderController {
  public function store(Request $request) {
    $validated = $request->validate([...]);
    Order::create($validated);
    Mail::to($request->user())->send(new OrderConfirmation($validated));
    $pdf = Pdf::load($validated)->save(storage_path('orders/...'));
    return redirect()->route('orders.index');
  }
}
\`\`\`

**Correcao:** Controller fino; Use Case ou Service orquestra; cada acao (persistir, notificar, gerar PDF) em classe ou metodo dedicado, injetado quando possivel.

**Quando e aceitavel violar:** Prototipos muito pequenos ou scripts one-off; assim que o codigo crescer, extrair responsabilidades. Trade-off: menos arquivos vs. maior coesao.

---

## OCP - Open/Closed Principle

Entidades devem ser abertas para extensao e fechadas para modificacao. Novos comportamentos entram por novos codigos (novas classes, implementacoes) em vez de alterar codigo existente. Isso reduz risco de regressao. Relacao: OCP se apoia em abstracoes (DIP) e em responsabilidades bem definidas (SRP).

### Violacao em TypeScript e correcao:

**Violacao:** \`if (type === "A") ... else if (type === "B") ...\` no mesmo modulo; adicionar tipo C exige editar esse modulo.
\`\`\`typescript
function calculateShipping(order: Order): number {
  if (order.type === "standard") return order.weight * 2;
  if (order.type === "express") return order.weight * 5;
  return 0;
}
\`\`\`

**Correcao:** Estrategias por tipo; nova estrategia = nova classe, sem modificar as existentes.
\`\`\`typescript
interface ShippingStrategy {
  calculate(order: Order): number;
}
class StandardShipping implements ShippingStrategy {
  calculate(order: Order) { return order.weight * 2; }
}
// Novo tipo = nova classe que implementa ShippingStrategy.
\`\`\`

### Violacao em PHP/Laravel e correcao:

**Violacao:** Service com switch no tipo de pagamento; cada novo gateway exige editar o mesmo arquivo.

**Correcao:** Interface \`PaymentGateway\`; implementacoes \`StripeGateway\`, \`PixGateway\`; container injeta a implementacao. Novo gateway = nova classe e registro no container.

**Quando e aceitavel violar:** Poucos tipos estaveis e sem previsao de crescimento; quando a abstração antecipada nao traz beneficio (YAGNI). Avalie trade-off entre complexidade agora e extensibilidade futura.

---

## LSP - Liskov Substitution Principle

Subtipos devem ser substituiveis por seus tipos base sem quebrar o comportamento esperado pelo cliente. Ou seja: onde o codigo usa a abstração (classe base ou interface), qualquer implementacao deve respeitar o contrato (pre-pos-condicoes, invariantes). Relacao: LSP reforca que abstracoes (DIP) devem ser respeitadas por todas as implementacoes; quebrar LSP costuma indicar modelagem errada (heranca onde deveria ser composicao).

### Violacao em TypeScript e correcao:

**Violacao:** \`Square extends Rectangle\` mas \`setWidth\` em Square altera tambem altura; cliente que usa Rectangle e chama \`setWidth(5); setHeight(4)\` recebe 4x4 em vez de 5x4.
\`\`\`typescript
class Rectangle {
  setWidth(w: number) { this.width = w; }
  setHeight(h: number) { this.height = h; }
}
class Square extends Rectangle {
  setWidth(w: number) { this.width = this.height = w; }
}
\`\`\`

**Correcao:** Nao herdar Square de Rectangle; ou usar composicao, ou tipo base que nao exponha setters incompatíveis com Square.

### Violacao em PHP/Laravel e correcao:

**Violacao:** Subclasse de \`Repository\` que em \`find()\` lanca excecao em vez de retornar null, quebrando a expectativa do cliente.

**Correcao:** Subclasse deve respeitar o contrato (retorno, excecoes documentadas). Se o comportamento for diferente, nao usar heranca ou ajustar o contrato da base.

**Quando e aceitavel violar:** Quase nunca; LSP e um contrato de confiança. Violar causa bugs sutis. Se "substituir" nao e seguro, a hierarquia esta errada.

---

## ISP - Interface Segregation Principle

Clientes nao devem depender de interfaces que nao usam. Interfaces grandes forçam implementacoes a ter metodos vazios ou dependencias desnecessarias. Prefira interfaces pequenas e especificas. Relacao: ISP evita que SRP seja quebrado na interface; interfaces grandes costumam agrupar muitas responsabilidades.

### Violacao em TypeScript e correcao:

**Violacao:** \`interface Worker { work(); eat(); sleep(); }\` e um \`Robot\` que so implementa \`work()\`, sendo obrigado a \`eat()\` e \`sleep()\` vazios.
\`\`\`typescript
interface Worker {
  work(): void;
  eat(): void;
}
class Human implements Worker {
  work() {}
  eat() {}
}
class Robot implements Worker {
  work() {}
  eat() { throw new Error("Robot doesn't eat"); }
}
\`\`\`

**Correcao:** Interfaces segregadas: \`Workable { work(); }\`, \`Eatable { eat(); }\`. Human implementa ambas; Robot so Workable.

### Violacao em PHP/Laravel e correcao:

**Violacao:** Interface de repositorio com \`find\`, \`save\`, \`delete\`, \`exportToCsv\`. Um repositório read-only e forçado a implementar \`save\`, \`delete\`, \`exportToCsv\`.

**Correcao:** \`ReadOnlyRepository\` com \`find\`/\`findAll\`; \`WritableRepository\` estende ou compoe com metodos de escrita. Cada cliente depende só do que usa.

**Quando e aceitavel violar:** Interface estavel e com poucos clientes; adicionar um metodo opcional que a maioria ignora pode ser pragmatico. Trade-off: muitas interfaces pequenas vs. uma interface um pouco "gorda".

---

## DIP - Dependency Inversion Principle

Modulos de alto nivel nao devem depender de modulos de baixo nivel; ambos devem depender de abstracoes. Abstracoes nao devem depender de detalhes; detalhes dependem de abstracoes. Isso permite trocar implementacoes (banco, API, UI) sem alterar regras de negocio. Relacao: DIP e o que torna OCP e LSP uteis na pratica (injetar implementacoes); SRP ajuda a definir abstracoes estáveis.

### Violacao em TypeScript e correcao:

**Violacao:** Use Case importa e instancia diretamente \`PostgresUserRepository\` e \`SendGridEmailService\`.
\`\`\`typescript
class CreateUserUseCase {
  private repo = new PostgresUserRepository();
  private email = new SendGridEmailService();
  execute(user: User) {
    this.repo.save(user);
    this.email.send(user.email, "Welcome");
  }
}
\`\`\`

**Correcao:** Depender de interfaces; injetar implementacoes no construtor ou factory.
\`\`\`typescript
class CreateUserUseCase {
  constructor(
    private repo: IUserRepository,
    private email: IEmailService
  ) {}
  execute(user: User) {
    this.repo.save(user);
    this.email.send(user.email, "Welcome");
  }
}
\`\`\`

### Violacao em PHP/Laravel e correcao:

**Violacao:** Controller ou Service faz \`new StripeClient()\` ou \`Mail::send()\` direto (acoplado ao detalhe).

**Correcao:** Interface \`PaymentGateway\`; binding no Service Provider para \`StripePaymentGateway\`. Controller/Use Case recebe \`PaymentGateway\` por construtor. Testes injetam fake.

**Quando e aceitavel violar:** Scripts, jobs pequenos ou pontos de entrada (main) onde a composicao e feita em um so lugar. O nucleo de dominio deve depender de abstracoes; na borda, instanciar implementacoes e aceitavel.

---

## Resumo - Relacao entre os principios

- **SRP** mantem cada classe com um motivo para mudar.
- **OCP** usa abstracoes para estender sem modificar (novas implementacoes).
- **LSP** garante que qualquer implementacao possa ser usada onde a abstração e esperada.
- **ISP** mantem interfaces enxutas para que clientes nao dependam do que nao usam.
- **DIP** faz o nucleo depender de abstracoes; detalhes (DB, API, UI) implementam essas abstracoes.

Violar um muitas vezes puxa violacao de outros; respeitar todos leva a codigo mais testavel e evolutivo, com trade-off em quantidade de arquivos e indirecao.
`;

export function register(server: McpServer): void {
  server.resource(
    "solid-principles",
    "senior-mind://references/solid-principles",
    {
      description:
        "Principios SOLID: SRP, OCP, LSP, ISP, DIP com explicacao, violacao e correcao em TypeScript e PHP/Laravel",
      mimeType: "text/markdown",
    },
    async () => ({
      contents: [
        {
          uri: "senior-mind://references/solid-principles",
          mimeType: "text/markdown",
          text: SOLID_PRINCIPLES_CONTENT,
        },
      ],
    })
  );
}
