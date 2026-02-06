import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

const LARAVEL_CONVENTIONS_CONTENT = `# Laravel - Convencoes e Padroes

## 1. Nomenclatura

| Elemento | Convencao | Exemplo |
|---|---|---|
| Model | Singular, PascalCase | \`User\`, \`OrderItem\` |
| Controller | Plural + Controller | \`UsersController\`, \`OrderItemsController\` |
| Migration | snake_case com verbo + tabela | \`create_users_table\`, \`add_email_to_users_table\` |
| FormRequest | Acao + Model + Request | \`StoreUserRequest\`, \`UpdateOrderRequest\` |
| Resource | Singular + Resource | \`UserResource\`, \`OrderItemResource\` |
| Policy | Singular + Policy | \`UserPolicy\`, \`OrderPolicy\` |
| Seeder | Plural + Seeder | \`UsersSeeder\` |
| Factory | Singular + Factory | \`UserFactory\` |
| Event | Descritivo (passado) | \`OrderShipped\`, \`UserRegistered\` |
| Listener | Descritivo (acao) | \`SendShipmentNotification\` |
| Job | Descritivo (acao) | \`ProcessPayment\` |
| Middleware | Descritivo | \`EnsureUserIsAdmin\` |
| Tabela BD | Plural, snake_case | \`users\`, \`order_items\` |
| Coluna BD | snake_case | \`first_name\`, \`created_at\` |
| Pivot table | Singular, ordem alfabetica | \`order_product\`, \`role_user\` |

## 2. Estrutura de Pastas Padrao

\`\`\`
app/
  Http/
    Controllers/       # Controllers (logica HTTP)
    Middleware/         # Middlewares
    Requests/           # FormRequests (validacao)
    Resources/          # API Resources (transformacao)
  Models/               # Eloquent Models
  Services/             # Logica de negocio (Service Layer)
  Repositories/         # Acesso a dados (opcional, Repository Pattern)
  Events/               # Eventos do dominio
  Listeners/            # Listeners de eventos
  Jobs/                 # Jobs assincronos
  Policies/             # Authorization Policies
  Exceptions/           # Excecoes customizadas
  Enums/                # PHP Enums (8.1+)
database/
  migrations/           # Migrations
  factories/            # Factories para testes
  seeders/              # Seeders
tests/
  Feature/              # Testes de integracao (HTTP, DB)
  Unit/                 # Testes unitarios
routes/
  api.php               # Rotas API
  web.php               # Rotas web
\`\`\`

## 3. Padroes Eloquent

### Scopes

Scopes encapsulam queries reutilizaveis no Model:

\`\`\`php
// Model
class User extends Model
{
    // Scope local
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    public function scopeCreatedAfter(Builder $query, Carbon $date): Builder
    {
        return $query->where('created_at', '>=', $date);
    }
}

// Uso
$activeUsers = User::active()->createdAfter(now()->subMonth())->get();
\`\`\`

### Relationships

\`\`\`php
class User extends Model
{
    public function posts(): HasMany
    {
        return $this->hasMany(Post::class);
    }

    public function profile(): HasOne
    {
        return $this->hasOne(Profile::class);
    }

    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(Role::class);
    }
}
\`\`\`

### Accessors e Mutators (Laravel 9+)

\`\`\`php
use Illuminate\\Database\\Eloquent\\Casts\\Attribute;

class User extends Model
{
    protected function fullName(): Attribute
    {
        return Attribute::make(
            get: fn () => "{$this->first_name} {$this->last_name}",
        );
    }

    protected function email(): Attribute
    {
        return Attribute::make(
            set: fn (string $value) => strtolower($value),
        );
    }
}
\`\`\`

## 4. Service Pattern

Services encapsulam logica de negocio complexa, mantendo Controllers e Models limpos:

\`\`\`php
// app/Services/OrderService.php
class OrderService
{
    public function __construct(
        private readonly OrderRepository $orderRepository,
        private readonly PaymentGateway $paymentGateway,
        private readonly NotificationService $notificationService,
    ) {}

    public function placeOrder(PlaceOrderDTO $dto): Order
    {
        $order = $this->orderRepository->create($dto);

        $this->paymentGateway->charge($order->total, $dto->paymentMethod);

        $this->notificationService->sendOrderConfirmation($order);

        return $order;
    }
}

// Controller
class OrdersController extends Controller
{
    public function store(StoreOrderRequest $request, OrderService $service): JsonResponse
    {
        $order = $service->placeOrder(
            PlaceOrderDTO::fromRequest($request)
        );

        return new JsonResponse(new OrderResource($order), 201);
    }
}
\`\`\`

## 5. Repository Pattern

Repositorios abstraem o acesso a dados, facilitando testes e troca de implementacao:

\`\`\`php
// Interface (contrato)
interface UserRepository
{
    public function findById(int $id): ?User;
    public function findByEmail(string $email): ?User;
    public function save(User $user): User;
    public function activeUsers(): Collection;
}

// Implementacao Eloquent
class EloquentUserRepository implements UserRepository
{
    public function findById(int $id): ?User
    {
        return User::find($id);
    }

    public function findByEmail(string $email): ?User
    {
        return User::where('email', $email)->first();
    }

    public function save(User $user): User
    {
        $user->save();
        return $user;
    }

    public function activeUsers(): Collection
    {
        return User::active()->get();
    }
}

// Binding no ServiceProvider
$this->app->bind(UserRepository::class, EloquentUserRepository::class);
\`\`\`

## 6. Boas Praticas Laravel

- **Sempre use FormRequest** para validacao — nunca valide no Controller.
- **Use API Resources** para transformar dados — nunca retorne Models diretamente.
- **Evite N+1**: use \`with()\` (eager loading) para relationships.
- **Use Enums** (PHP 8.1+) para status, tipos e constantes de dominio.
- **Mass Assignment**: defina \`$fillable\` ou \`$guarded\` em todo Model.
- **Soft Deletes**: use \`SoftDeletes\` para dados que nao devem ser perdidos.
- **Queues**: use Jobs para operacoes demoradas (email, integracao, processamento).
`;

export function register(server: McpServer): void {
  server.resource(
    "laravel-conventions",
    "senior-mind://references/laravel-conventions",
    {
      description:
        "Convencoes Laravel: nomenclatura, estrutura de pastas, Eloquent (scopes, relationships, accessors/mutators), Service e Repository Pattern",
      mimeType: "text/markdown",
    },
    async () => ({
      contents: [
        {
          uri: "senior-mind://references/laravel-conventions",
          mimeType: "text/markdown",
          text: LARAVEL_CONVENTIONS_CONTENT,
        },
      ],
    })
  );
}
