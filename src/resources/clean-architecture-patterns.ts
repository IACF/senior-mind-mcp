import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

const CLEAN_ARCHITECTURE_PATTERNS_CONTENT = `# Padroes da Clean Architecture

Padroes recorrentes na Clean Architecture, com exemplos em TypeScript e PHP.

---

## Repository

Abstracao de persistencia: a aplicacao nao sabe se os dados vêm de SQL, NoSQL ou arquivo. O Use Case depende de uma interface (port); a implementacao (adapter) fica na camada externa.

**TypeScript:**

\`\`\`typescript
// port (use case layer)
interface UserRepository {
  findById(id: string): Promise<User | null>;
  save(user: User): Promise<User>;
}

// adapter (infrastructure)
class PostgresUserRepository implements UserRepository {
  async findById(id: string) {
    const row = await this.db.query("SELECT * FROM users WHERE id = $1", [id]);
    return row ? UserMapper.toDomain(row) : null;
  }
  async save(user: User) {
    await this.db.query("INSERT INTO users ...", [user.id, user.name]);
    return user;
  }
}
\`\`\`

**PHP/Laravel:**

\`\`\`php
// port
interface UserRepositoryInterface {
  public function findById(string $id): ?User;
  public function save(User $user): User;
}

// adapter
class EloquentUserRepository implements UserRepositoryInterface {
  public function __construct(private UserModel $model) {}
  public function findById(string $id): ?User {
    $row = $this->model->find($id);
    return $row ? UserMapper::toDomain($row) : null;
  }
  public function save(User $user): User {
    $this->model->updateOrCreate([...]);
    return $user;
  }
}
\`\`\`

---

## Gateway

Similar ao Repository, mas para servicos externos (APIs, filas, email). O Use Case chama um Gateway (ex.: \`PaymentGateway\`, \`NotificationGateway\`) cuja implementacao faz HTTP ou usa SDK. Mantem o nucleo livre de detalhes de integracao.

**TypeScript:**

\`\`\`typescript
interface PaymentGateway {
  charge(amount: number, token: string): Promise<ChargeResult>;
}
// adapter: StripePaymentGateway implementa PaymentGateway
\`\`\`

**PHP:**

\`\`\`php
interface PaymentGatewayInterface {
  public function charge(Money $amount, string $token): ChargeResult;
}
class StripePaymentGateway implements PaymentGatewayInterface { ... }
\`\`\`

---

## Presenter

Transforma saida do Use Case (entidade ou DTO de saida) no formato da entrega (JSON, view model). O Controller chama o Use Case e depois o Presenter; o Use Case nunca formata para HTTP.

**TypeScript:**

\`\`\`typescript
class OrderPresenter {
  static toJson(order: Order): OrderResponse {
    return {
      id: order.id,
      total: order.totalCents / 100,
      items: order.items.map(i => ({ sku: i.sku, qty: i.quantity })),
    };
  }
}
\`\`\`

**PHP:**

\`\`\`php
class OrderPresenter {
  public static function toArray(Order $order): array {
    return [
      'id' => $order->id(),
      'total' => $order->totalCents() / 100,
      'items' => array_map(fn($i) => ['sku' => $i->sku(), 'qty' => $i->quantity()], $order->items()),
    ];
  }
}
\`\`\`

---

## Input / Output DTOs

Use Cases recebem e devolvem DTOs simples (objetos de dados), nao entidades cruas nem tipos do framework. Input DTO: dados necessarios para executar o caso de uso. Output DTO (ou resultado): o que o caso de uso retorna; o Presenter converte em JSON/view.

**TypeScript:**

\`\`\`typescript
interface CreateUserInput {
  name: string;
  email: string;
  password: string;
}
interface CreateUserOutput {
  id: string;
  name: string;
  email: string;
}
class CreateUser {
  async execute(input: CreateUserInput): Promise<CreateUserOutput> {
    const user = User.create(...);
    await this.userRepo.save(user);
    return { id: user.id, name: user.name, email: user.email };
  }
}
\`\`\`

**PHP:**

\`\`\`php
readonly class CreateUserInput {
  public function __construct(
    public string $name,
    public string $email,
    public string $password,
  ) {}
}
readonly class CreateUserOutput {
  public function __construct(
    public string $id,
    public string $name,
    public string $email,
  ) {}
}
\`\`\`

---

## Use Case Interactor

O Use Case (Interactor) orquestra: valida input, chama Entities, chama Repositories/Gateways e retorna resultado. Uma classe por caso de uso, com um metodo \`execute\` (ou \`handle\`). Mantem logica de aplicacao em um so lugar, testavel sem UI ou DB.

**TypeScript:**

\`\`\`typescript
class PlaceOrderInteractor {
  constructor(
    private orderRepo: OrderRepository,
    private inventory: InventoryGateway,
    private events: DomainEventPublisher,
  ) {}
  async execute(input: PlaceOrderInput): Promise<PlaceOrderResult> {
    const order = Order.place(input.items, input.customerId);
    await this.inventory.reserve(order.items);
    await this.orderRepo.save(order);
    await this.events.publish(new OrderPlaced(order));
    return { orderId: order.id };
  }
}
\`\`\`

**PHP:**

\`\`\`php
class PlaceOrderUseCase {
  public function __construct(
    private OrderRepositoryInterface $orderRepo,
    private InventoryGatewayInterface $inventory,
    private DomainEventPublisher $events,
  ) {}
  public function execute(PlaceOrderInput $input): PlaceOrderResult {
    $order = Order::place($input->items, $input->customerId);
    $this->inventory->reserve($order->items());
    $this->orderRepo->save($order);
    $this->events->publish(new OrderPlaced($order));
    return new PlaceOrderResult($order->id());
  }
}
\`\`\`

---

## Mapper

Converte entre modelo de dominio (Entity) e modelo de persistencia (linha de tabela, documento, modelo ORM). Fica na camada de adapters. O dominio nao conhece \`id\` auto-increment, nomes de colunas ou tipos do ORM.

**TypeScript:**

\`\`\`typescript
class UserMapper {
  static toDomain(row: UserRow): User {
    return new User(row.id, row.name, row.email, row.password_hash);
  }
  static toPersistence(user: User): UserRow {
    return { id: user.id, name: user.name, email: user.email, password_hash: user.passwordHash };
  }
}
\`\`\`

**PHP:**

\`\`\`php
class UserMapper {
  public static function toDomain(UserModel $model): User {
    return new User($model->id, $model->name, $model->email, $model->password_hash);
  }
  public static function toModel(User $user): array {
    return ['id' => $user->id(), 'name' => $user->name(), 'email' => $user->email()];
  }
}
\`\`\`

---

## Domain Events

Eventos que representam algo que aconteceu no dominio (ex.: \`OrderPlaced\`, \`UserRegistered\`). O Use Case publica o evento apos persistir; listeners (na camada externa) enviam email, atualizam cache, etc. O nucleo nao conhece os listeners, apenas emite eventos.

**TypeScript:**

\`\`\`typescript
class OrderPlaced {
  constructor(public readonly order: Order) {}
}
// Use Case
await this.orderRepo.save(order);
await this.eventBus.publish(new OrderPlaced(order));
// Listener (adapter): SendOrderConfirmationEmail implements EventHandler<OrderPlaced>
\`\`\`

**PHP/Laravel:**

\`\`\`php
class OrderPlaced {
  public function __construct(public readonly Order $order) {}
}
// Use Case
$this->orderRepo->save($order);
event(new OrderPlaced($order));
// Listener: SendOrderConfirmationEmail
\`\`\`
`;

const URI = "senior-mind://references/clean-architecture-patterns";

async function readCleanArchitecturePatterns() {
  return {
    contents: [
      { uri: URI, mimeType: "text/markdown", text: CLEAN_ARCHITECTURE_PATTERNS_CONTENT },
    ],
  };
}

export function register(server: McpServer): void {
  server.resource("clean-architecture-patterns", URI, {
    description:
      "Padroes da Clean Architecture: Repository, Gateway, Presenter, DTOs, Use Case Interactor, Mapper, Domain Events — com exemplos TypeScript e PHP",
    mimeType: "text/markdown",
  }, readCleanArchitecturePatterns);
}
