import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

const NESTJS_PATTERNS_CONTENT = `# NestJS - Patterns e Boas Praticas

## 1. Modules

Modules sao a unidade fundamental de organizacao no NestJS. Cada feature deve ter seu proprio modulo.

\`\`\`typescript
// users/users.module.ts
@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [UsersController],
  providers: [UsersService, UsersRepository],
  exports: [UsersService], // Exporta para outros modulos usarem
})
export class UsersModule {}
\`\`\`

### Principios:
- **Um modulo por feature/dominio** (UsersModule, OrdersModule, AuthModule).
- **Encapsulamento**: so exporte o que outros modulos realmente precisam.
- **SharedModule**: para providers usados em multiplos modulos (ex.: LoggerService).

## 2. Controllers

Controllers lidam com requests HTTP e delegam logica para Services.

\`\`\`typescript
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createUserDto: CreateUserDto): Promise<UserResponseDto> {
    const user = await this.usersService.create(createUserDto);
    return UserResponseDto.fromEntity(user);
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<UserResponseDto> {
    return this.usersService.findOneOrFail(id);
  }

  @Get()
  async findAll(@Query() query: PaginationDto): Promise<PaginatedResponse<UserResponseDto>> {
    return this.usersService.findAll(query);
  }
}
\`\`\`

### Principios:
- Controllers devem ser **finos** — sem logica de negocio.
- Use **decorators** para validacao, transformacao e documentacao.
- Retorne **DTOs**, nunca entidades diretamente.

## 3. Providers / Services

Services contem a logica de negocio e sao injetados via DI.

\`\`\`typescript
@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly hasher: PasswordHasher,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(dto: CreateUserDto): Promise<User> {
    const existing = await this.usersRepository.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('Email ja cadastrado');
    }

    const hashedPassword = await this.hasher.hash(dto.password);
    const user = await this.usersRepository.save(
      User.create(dto.name, dto.email, hashedPassword),
    );

    this.eventEmitter.emit('user.created', new UserCreatedEvent(user));

    return user;
  }
}
\`\`\`

## 4. DTOs com class-validator

DTOs (Data Transfer Objects) validam e tipam dados de entrada/saida.

\`\`\`typescript
import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateUserDto {
  @IsString()
  @MinLength(2)
  readonly name: string;

  @IsEmail()
  @Transform(({ value }) => value.toLowerCase())
  readonly email: string;

  @IsString()
  @MinLength(8)
  readonly password: string;

  @IsOptional()
  @IsString()
  readonly phone?: string;
}
\`\`\`

### Principios:
- **Sempre valide** entrada com class-validator.
- **Transforme** dados com class-transformer (trim, lowercase, etc.).
- Separe DTOs de **input** (CreateUserDto) e **output** (UserResponseDto).

## 5. Pipes, Guards e Interceptors

### Pipes (validacao e transformacao)
\`\`\`typescript
// Global validation pipe (main.ts)
app.useGlobalPipes(new ValidationPipe({
  whitelist: true,           // Remove propriedades nao decoradas
  forbidNonWhitelisted: true, // Erro se propriedade desconhecida
  transform: true,            // Transforma tipos automaticamente
}));
\`\`\`

### Guards (autorizacao)
\`\`\`typescript
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<string[]>('roles', context.getHandler());
    if (!requiredRoles) return true;

    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.some(role => user.roles.includes(role));
  }
}

// Uso
@UseGuards(RolesGuard)
@SetMetadata('roles', ['admin'])
@Delete(':id')
async remove(@Param('id') id: string): Promise<void> { /* ... */ }
\`\`\`

### Interceptors (pre/pos processamento)
\`\`\`typescript
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const now = Date.now();
    return next.handle().pipe(
      tap(() => console.log(\`Executed in \${Date.now() - now}ms\`)),
    );
  }
}
\`\`\`

## 6. Injecao de Dependencia e Modularidade

\`\`\`typescript
// Definir interface (port)
export interface UserRepository {
  findById(id: string): Promise<User | null>;
  save(user: User): Promise<User>;
}

export const USER_REPOSITORY = Symbol('USER_REPOSITORY');

// Implementacao
@Injectable()
export class TypeOrmUserRepository implements UserRepository {
  constructor(
    @InjectRepository(UserEntity)
    private readonly repo: Repository<UserEntity>,
  ) {}

  async findById(id: string): Promise<User | null> {
    const entity = await this.repo.findOne({ where: { id } });
    return entity ? UserMapper.toDomain(entity) : null;
  }

  async save(user: User): Promise<User> {
    const entity = UserMapper.toEntity(user);
    const saved = await this.repo.save(entity);
    return UserMapper.toDomain(saved);
  }
}

// Registrar no Module
@Module({
  providers: [
    {
      provide: USER_REPOSITORY,
      useClass: TypeOrmUserRepository,
    },
    UsersService,
  ],
})
export class UsersModule {}

// Injetar no Service
@Injectable()
export class UsersService {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
  ) {}
}
\`\`\`

## 7. Repository Pattern com TypeORM/Prisma

### TypeORM
\`\`\`typescript
@Injectable()
export class TypeOrmUserRepository {
  constructor(
    @InjectRepository(UserEntity)
    private readonly repo: Repository<UserEntity>,
  ) {}

  async findActiveUsers(): Promise<User[]> {
    const entities = await this.repo.find({ where: { isActive: true } });
    return entities.map(UserMapper.toDomain);
  }
}
\`\`\`

### Prisma
\`\`\`typescript
@Injectable()
export class PrismaUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findActiveUsers(): Promise<User[]> {
    const records = await this.prisma.user.findMany({
      where: { isActive: true },
    });
    return records.map(UserMapper.toDomain);
  }
}
\`\`\`

## 8. Boas Praticas NestJS

- **Um modulo por feature**: mantenha boundaries claros.
- **DTOs em tudo**: nunca aceite \`any\` em Controllers.
- **Exception Filters**: trate erros de forma centralizada.
- **Config Module**: use \`@nestjs/config\` para variaveis de ambiente.
- **Testes**: cada Service deve ter testes unitarios com mocks dos repositories.
- **Swagger**: decore DTOs e Controllers com \`@nestjs/swagger\` para documentacao automatica.
`;

export function register(server: McpServer): void {
  server.resource(
    "nestjs-patterns",
    "senior-mind://references/nestjs-patterns",
    {
      description:
        "Patterns NestJS: Modules, Controllers, Services, DTOs com class-validator, Pipes, Guards, Interceptors, DI e Repository Pattern",
      mimeType: "text/markdown",
    },
    async () => ({
      contents: [
        {
          uri: "senior-mind://references/nestjs-patterns",
          mimeType: "text/markdown",
          text: NESTJS_PATTERNS_CONTENT,
        },
      ],
    })
  );
}
