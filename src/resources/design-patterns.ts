import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

const DESIGN_PATTERNS_CONTENT = `# Design Patterns (GoF) no Contexto Clean Architecture

Padroes Gang of Four aplicados de forma compativel com Clean Architecture: criacao e inducao de dependencias na borda, dominio estavel.

---

## Criacionais

### Factory Method

Uma classe define um metodo que cria um objeto, mas a classe concreta do objeto e decidida por subclasses (ou implementacoes). Na Clean Architecture, factories podem viver na camada de aplicacao (criar Entities) ou na borda (criar adapters).

**TypeScript:**

\`\`\`typescript
// Use Case usa factory injetada para criar entidade
interface OrderFactory {
  create(items: LineItem[], customerId: string): Order;
}
class PlaceOrderUseCase {
  constructor(
    private orderFactory: OrderFactory,
    private orderRepo: OrderRepository,
  ) {}
  async execute(input: PlaceOrderInput) {
    const order = this.orderFactory.create(input.items, input.customerId);
    await this.orderRepo.save(order);
    return order.id;
  }
}
\`\`\`

**PHP:**

\`\`\`php
interface OrderFactoryInterface {
  public function create(array $items, string $customerId): Order;
}
class DefaultOrderFactory implements OrderFactoryInterface {
  public function create(array $items, string $customerId): Order {
    return Order::place($items, $customerId);
  }
}
\`\`\`

### Abstract Factory

Familia de produtos relacionados (ex.: persistencia para User e Order). A aplicacao depende da interface da fabrica; a implementacao (ex.: PostgresFactory, InMemoryFactory) e injetada no Composition Root.

**TypeScript:**

\`\`\`typescript
interface PersistenceFactory {
  userRepository(): UserRepository;
  orderRepository(): OrderRepository;
}
class PostgresPersistenceFactory implements PersistenceFactory {
  userRepository() { return new PostgresUserRepository(this.pool); }
  orderRepository() { return new PostgresOrderRepository(this.pool); }
}
// Composition Root: new PostgresPersistenceFactory(pool)
\`\`\`

**PHP:**

\`\`\`php
interface PersistenceFactoryInterface {
  public function userRepository(): UserRepositoryInterface;
  public function orderRepository(): OrderRepositoryInterface;
}
\`\`\`

### Builder

Construcao passo a passo de objetos complexos (ex.: Order com muitos itens e opcoes). Mantem a Entity ou o DTO imutavel e legivel; o Builder fica na camada de aplicacao ou em DTOs de entrada.

**TypeScript:**

\`\`\`typescript
class OrderBuilder {
  private items: LineItem[] = [];
  private customerId?: string;
  forCustomer(id: string) { this.customerId = id; return this; }
  addItem(sku: string, qty: number) {
    this.items.push(new LineItem(sku, qty));
    return this;
  }
  build(): Order {
    if (!this.customerId) throw new Error("customerId required");
    return Order.place(this.items, this.customerId);
  }
}
\`\`\`

**PHP:**

\`\`\`php
class OrderBuilder {
  private array $items = [];
  private ?string $customerId = null;
  public function forCustomer(string $id): self { $this->customerId = $id; return $this; }
  public function addItem(string $sku, int $qty): self {
    $this->items[] = new LineItem($sku, $qty);
    return $this;
  }
  public function build(): Order {
    if ($this->customerId === null) throw new \\InvalidArgumentException("customerId required");
    return Order::place($this->items, $this->customerId);
  }
}
\`\`\`

---

## Estruturais

### Adapter

Converte a interface de um componente externo para a interface esperada pelo nucleo. Repository e Gateway sao adapters: o Use Case depende de \`UserRepository\`; \`PostgresUserRepository\` adapta o banco para essa interface.

**TypeScript:**

\`\`\`typescript
// Port (nucleo)
interface EmailSender {
  send(to: string, subject: string, body: string): Promise<void>;
}
// Adapter (borda)
class SendGridEmailAdapter implements EmailSender {
  constructor(private client: SendGridClient) {}
  async send(to: string, subject: string, body: string) {
    await this.client.send({ to, subject, content: body });
  }
}
\`\`\`

**PHP:**

\`\`\`php
interface EmailSenderInterface {
  public function send(string $to, string $subject, string $body): void;
}
class MailgunEmailAdapter implements EmailSenderInterface {
  public function __construct(private Mailgun $mailgun) {}
  public function send(string $to, string $subject, string $body): void {
    $this->mailgun->messages()->send(...);
  }
}
\`\`\`

### Decorator

Envolve um objeto para adicionar comportamento (logging, cache, retry) sem alterar a interface. Na Clean Architecture, decore interfaces de Repository ou Gateway no Composition Root; o Use Case continua recebendo a mesma interface.

**TypeScript:**

\`\`\`typescript
class LoggingUserRepositoryDecorator implements UserRepository {
  constructor(
    private readonly inner: UserRepository,
    private readonly logger: Logger,
  ) {}
  async findById(id: string) {
    this.logger.info("UserRepository.findById", { id });
    return this.inner.findById(id);
  }
  async save(user: User) {
    this.logger.info("UserRepository.save", { id: user.id });
    return this.inner.save(user);
  }
}
// Composition Root: new LoggingUserRepositoryDecorator(realRepo, logger)
\`\`\`

**PHP:**

\`\`\`php
class LoggingUserRepositoryDecorator implements UserRepositoryInterface {
  public function __construct(
    private UserRepositoryInterface $inner,
    private LoggerInterface $logger,
  ) {}
  public function findById(string $id): ?User {
    $this->logger->info("UserRepository.findById", ['id' => $id]);
    return $this->inner->findById($id);
  }
  // ...
}
\`\`\`

### Facade

Interface simplificada para um subsistema complexo. Na borda, um Facade pode esconder a complexidade de um SDK ou biblioteca externa, expondo apenas o que o Use Case precisa (ex.: \`PaymentFacade\` que encapsula Stripe).

**TypeScript:**

\`\`\`typescript
// Use Case so precisa de charge(amount, token)
interface PaymentFacade {
  charge(amountCents: number, token: string): Promise<ChargeResult>;
}
class StripePaymentFacade implements PaymentFacade {
  constructor(private stripe: Stripe) {}
  async charge(amountCents: number, token: string) {
    const paymentIntent = await this.stripe.paymentIntents.create({ amount: amountCents, ... });
    return { id: paymentIntent.id, status: paymentIntent.status };
  }
}
\`\`\`

**PHP:**

\`\`\`php
interface PaymentFacadeInterface {
  public function charge(int $amountCents, string $token): ChargeResult;
}
class StripePaymentFacade implements PaymentFacadeInterface { ... }
\`\`\`

---

## Comportamentais

### Strategy

Algoritmo intercambiavel: a mesma interface, multiplas implementacoes (ex.: calculo de frete por regiao). O Use Case depende da interface; a estrategia concreta e injetada. Muito usado para OCP (aberto para extensao, fechado para modificacao).

**TypeScript:**

\`\`\`typescript
interface ShippingStrategy {
  calculate(order: Order): number;
}
class StandardShipping implements ShippingStrategy {
  calculate(order: Order) { return order.weight * 2; }
}
class ExpressShipping implements ShippingStrategy {
  calculate(order: Order) { return order.weight * 5; }
}
class CalculateShippingUseCase {
  constructor(private strategy: ShippingStrategy) {}
  execute(order: Order) { return this.strategy.calculate(order); }
}
\`\`\`

**PHP:**

\`\`\`php
interface ShippingStrategyInterface {
  public function calculate(Order $order): int;
}
class StandardShipping implements ShippingStrategyInterface {
  public function calculate(Order $order): int { return $order->weight() * 2; }
}
\`\`\`

### Observer

Objetos se inscrevem para serem notificados quando algo acontece. Domain Events + listeners implementam Observer: o Use Case publica o evento; N listeners (email, cache, auditoria) reagem sem o nucleo conhecê-los.

**TypeScript:**

\`\`\`typescript
// Nucleo emite
interface DomainEventPublisher {
  publish(event: DomainEvent): Promise<void>;
}
// Adapters assinam
class SendEmailOnOrderPlaced implements EventHandler<OrderPlaced> {
  async handle(event: OrderPlaced) {
    await this.mailer.send(event.order.customerEmail(), "Order confirmed", ...);
  }
}
\`\`\`

**PHP/Laravel:**

\`\`\`php
// event(new OrderPlaced($order));
// SendEmailOnOrderPlaced listener registrado no EventServiceProvider
\`\`\`

### Command

Encapsula uma acao como objeto: nome da acao + parametros. Use Cases podem ser vistos como Commands (PlaceOrderCommand, CreateUserCommand). Na Clean Architecture, o Controller cria o Command/Input DTO e chama o Use Case; filas podem serializar o mesmo Command para processamento assincrono.

**TypeScript:**

\`\`\`typescript
interface Command<TResult> {
  execute(): Promise<TResult>;
}
class PlaceOrderCommand implements Command<OrderId> {
  constructor(private input: PlaceOrderInput, private placeOrder: PlaceOrderUseCase) {}
  async execute() {
    return this.placeOrder.execute(this.input);
  }
}
// Controller: await new PlaceOrderCommand(input, placeOrder).execute();
\`\`\`

**PHP:**

\`\`\`php
interface CommandInterface {
  public function execute(): mixed;
}
class PlaceOrderCommand implements CommandInterface {
  public function __construct(
    private PlaceOrderInput $input,
    private PlaceOrderUseCase $useCase,
  ) {}
  public function execute(): OrderId {
    return $this->useCase->execute($this->input);
  }
}
\`\`\`

---

## Resumo

| Padrao | Uso na Clean Architecture |
|--------|----------------------------|
| Factory Method / Abstract Factory | Criacao de entidades ou de familias de adapters; injetadas no Composition Root |
| Builder | Construcao de Entities ou DTOs complexos |
| Adapter | Repository, Gateway, Presenter — converter mundo externo para portas do nucleo |
| Decorator | Logging, cache, retry em cima de Repository/Gateway sem mudar Use Case |
| Facade | Esconder SDKs/libs externas atras de interface simples |
| Strategy | Algoritmos intercambiaveis (frete, desconto); OCP |
| Observer | Domain Events + listeners; nucleo emite, adapters reagem |
| Command | Use Case como objeto de acao; suporta fila e undo se necessario |
`;

const URI = "senior-mind://references/design-patterns";

async function readDesignPatterns() {
  return {
    contents: [
      { uri: URI, mimeType: "text/markdown", text: DESIGN_PATTERNS_CONTENT },
    ],
  };
}

export function register(server: McpServer): void {
  server.resource("design-patterns", URI, {
    description:
      "Design Patterns GoF no contexto Clean Architecture: Factory Method, Abstract Factory, Builder, Adapter, Decorator, Facade, Strategy, Observer, Command — com exemplos TypeScript e PHP",
    mimeType: "text/markdown",
  }, readDesignPatterns);
}
