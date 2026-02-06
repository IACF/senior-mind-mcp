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
