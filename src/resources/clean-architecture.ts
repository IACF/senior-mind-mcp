import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

const CLEAN_ARCHITECTURE_CONTENT = `# Clean Architecture - Robert C. Martin

## Visao Geral

Clean Architecture organiza o codigo em camadas concentricas com uma regra fundamental:
**dependencias sempre apontam para dentro** — camadas externas dependem das internas, nunca o contrario.

## As 4 Camadas

### 1. Entities (Camada mais interna)
- Encapsulam as regras de negocio da **empresa** (Enterprise Business Rules).
- Sao os objetos mais estaveis do sistema — mudam muito raramente.
- Nao dependem de NADA externo (nem frameworks, nem banco de dados).
- Podem ser usadas por qualquer aplicacao da empresa.

\`\`\`typescript
// entities/User.ts
export class User {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly email: string,
    private readonly passwordHash: string,
  ) {}

  isValidEmail(): boolean {
    return /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(this.email);
  }
}
\`\`\`

### 2. Use Cases (Application Business Rules)
- Contem as regras de negocio da **aplicacao**.
- Orquestram o fluxo de dados de e para as Entities.
- Definem e implementam os casos de uso do sistema.
- Nao sabem nada sobre UI, banco de dados ou frameworks.

\`\`\`typescript
// use-cases/CreateUser.ts
export class CreateUser {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly hasher: PasswordHasher,
  ) {}

  async execute(input: CreateUserInput): Promise<User> {
    const existing = await this.userRepository.findByEmail(input.email);
    if (existing) {
      throw new UserAlreadyExistsError(input.email);
    }

    const hash = await this.hasher.hash(input.password);
    const user = new User(generateId(), input.name, input.email, hash);

    return this.userRepository.save(user);
  }
}
\`\`\`

### 3. Interface Adapters
- Convertem dados entre o formato dos Use Cases e o formato externo (DB, Web, etc.).
- Incluem: Controllers, Presenters, Gateways, Repositories (implementacoes).
- Aqui moram os DTOs, mappers e adaptadores.

\`\`\`typescript
// adapters/UserController.ts
export class UserController {
  constructor(private readonly createUser: CreateUser) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    const input = {
      name: request.body.name,
      email: request.body.email,
      password: request.body.password,
    };

    const user = await this.createUser.execute(input);

    return { statusCode: 201, body: UserPresenter.toJson(user) };
  }
}
\`\`\`

### 4. Frameworks & Drivers (Camada mais externa)
- Detalhes de implementacao: Express, NestJS, Laravel, PostgreSQL, Redis, etc.
- Esta camada e onde as coisas "sujas" vivem — e totalmente substituivel.
- Deve conter o minimo de codigo possivel — apenas "cola" para conectar frameworks aos adapters.

## Regra de Dependencia

> Dependencias de codigo-fonte devem apontar apenas para dentro, em direcao a politicas de nivel mais alto.

- **Entities** nao conhecem nada externo.
- **Use Cases** conhecem apenas Entities.
- **Interface Adapters** conhecem Use Cases e Entities.
- **Frameworks** conhecem tudo, mas sao conhecidos por ninguem.

## Boundary Crossing e Inversao de Dependencia

Quando um Use Case precisa acessar o banco de dados:

1. O Use Case define uma **interface** (port): \`UserRepository\`
2. A camada de Interface Adapters **implementa** essa interface: \`PostgresUserRepository\`
3. A injecao de dependencia conecta as duas em tempo de execucao.

\`\`\`typescript
// use-cases/ports/UserRepository.ts (definido na camada de Use Cases)
export interface UserRepository {
  findByEmail(email: string): Promise<User | null>;
  save(user: User): Promise<User>;
}

// adapters/repositories/PostgresUserRepository.ts (implementado na camada de Adapters)
export class PostgresUserRepository implements UserRepository {
  async findByEmail(email: string): Promise<User | null> {
    const row = await db.query("SELECT * FROM users WHERE email = $1", [email]);
    return row ? UserMapper.toDomain(row) : null;
  }

  async save(user: User): Promise<User> {
    await db.query("INSERT INTO users ...", [user.id, user.name, user.email]);
    return user;
  }
}
\`\`\`

## Quando Usar Cada Camada

| Situacao | Camada |
|---|---|
| Regra de negocio universal (ex.: calculo de imposto) | Entity |
| Fluxo especifico da aplicacao (ex.: criar pedido) | Use Case |
| Converter request HTTP para input do Use Case | Interface Adapter |
| Configurar Express/NestJS, conectar ao PostgreSQL | Framework & Driver |

## Screaming Architecture

A estrutura de pastas deve **gritar o proposito do sistema**, nao o framework. Ao abrir o projeto, deve ficar claro que e um sistema de pedidos, de cobranca ou de cadastro — nao "um projeto Laravel" ou "um projeto NestJS". Evite pastas que so repitam o nome do framework (controllers/, models/ genéricos). Prefira dominios ou casos de uso: \`order/\`, \`billing/\`, \`create-order/\`, \`place-order-use-case/\`.

**Ruim:** \`app/Http/Controllers/UserController.php\`, \`app/Models/Order.php\` — so se ve "Laravel".
**Bom:** \`src/order/PlaceOrderUseCase.ts\`, \`src/billing/Invoice.ts\` — o dominio aparece primeiro.

## Humble Object Pattern

Separe a logica **testavel** da logica **difícil de testar** (UI, framework, I/O). A classe "humilde" (ex.: Controller, View) faz o minimo: recebe input, chama o objeto testavel e repassa o resultado. Toda a logica de negocio e decisao fica em classes puras, testaveis sem mocks de framework.

\`\`\`typescript
// Humble: so repassa; dificil de testar (acoplado ao HTTP)
class OrderController {
  async handle(req: Request) {
    const result = await this.placeOrder.execute(req.body);
    return this.presenter.toJson(result);
  }
}
// Testavel: sem HTTP, sem framework
class PlaceOrderUseCase {
  execute(input: PlaceOrderInput) { /* logica pura */ }
}
\`\`\`

## Presenters e View Models

Use Cases retornam dados de dominio (Entities ou DTOs de saida). **Nunca** formate para HTML, JSON ou CLI dentro do Use Case. Presenters e View Models ficam na camada de Interface Adapters: recebem o resultado do Use Case e transformam em formato da entrega (JSON, view model para template). Assim o Use Case permanece agnostico de UI e facil de testar.

\`\`\`typescript
// Use Case retorna dominio
const order = await placeOrder.execute(input);

// Presenter formata para API
return OrderPresenter.toJson(order); // { id, total, items: [...] }
\`\`\`

## Main Component / Composition Root

E o ponto unico onde as dependencias sao **montadas** (wiring): criacao de repositories, conectores de DB, injecao nos Use Cases e Controllers. Em NestJS e o modulo raiz ou \`main.ts\` com \`NestFactory.create()\` e providers. Em Laravel, o \`AppServiceProvider\` ou modulos de dominio. Toda a aplicacao so conhece abstracoes; o Composition Root e o unico que instancia implementacoes concretas.

\`\`\`typescript
// composition-root.ts (NestJS ou manual)
const userRepo = new PostgresUserRepository(db);
const createUser = new CreateUser(userRepo, hasher);
const controller = new UserController(createUser);
\`\`\`

## Anti-patterns

- **Entidade anemica**: Entity so com getters/setters, sem comportamento. Regras de negocio ficam em "services" e a entidade vira saco de dados. Correcao: mover comportamento para a Entity (validacoes, calculos de dominio).
- **Use Case acoplado ao framework**: Use Case que importa \`Request\`, \`Response\`, Eloquent ou decorators do framework. Correcao: Use Case recebe DTOs simples; o Controller/Adapter traduz request em DTO e chama o Use Case.
- **Controller gordo**: Controller com validacao, regra de negocio, persistencia e formatacao. Correcao: Controller fino; delegar para Use Case e Presenter; manter so conversao request -> input e resultado -> response.

## Estruturas de Pastas Reais

### NestJS (orientacao por camada/dominio)

\`\`\`
src/
  domain/           # Entities
    user.entity.ts
    order.entity.ts
  application/      # Use Cases
    use-cases/
      create-user.use-case.ts
      place-order.use-case.ts
  infrastructure/  # Adapters + Framework
    persistence/
      user.repository.ts
    http/
      user.controller.ts
      presenters/
  main.ts          # Composition Root
\`\`\`

### Laravel (modulos ou bounded context)

\`\`\`
app/
  Domain/
    User.php
    Order.php
  Application/
    UseCases/
      CreateUser.php
      PlaceOrder.php
  Infrastructure/
    Http/
      Controllers/
      Presenters/
    Persistence/
      EloquentUserRepository.php
  Providers/       # Composition Root (binding interfaces)
\`\`\`

Mantenha Entities e Use Cases fora de \`Http\` e \`Persistence\`: assim a estrutura "grita" que o nucleo e dominio e aplicacao, e nao o framework.

## Beneficios

- **Testabilidade**: Use Cases e Entities sao testaveis sem framework.
- **Independencia de framework**: Trocar Express por Fastify nao afeta logica de negocio.
- **Independencia de banco**: Trocar PostgreSQL por MongoDB requer mudar apenas a camada externa.
- **Independencia de UI**: A mesma logica serve API REST, GraphQL ou CLI.
`;

export function register(server: McpServer): void {
  server.resource(
    "clean-architecture",
    "senior-mind://references/clean-architecture",
    {
      description:
        "Clean Architecture de Robert C. Martin: 4 camadas (Entities, Use Cases, Interface Adapters, Frameworks), Regra de Dependencia e Boundary Crossing",
      mimeType: "text/markdown",
    },
    async () => ({
      contents: [
        {
          uri: "senior-mind://references/clean-architecture",
          mimeType: "text/markdown",
          text: CLEAN_ARCHITECTURE_CONTENT,
        },
      ],
    })
  );
}
