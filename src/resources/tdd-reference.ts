import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

const TDD_REFERENCE_CONTENT = `# TDD - Test-Driven Development

## 1. Ciclo Red-Green-Refactor (Kent Beck)

O TDD segue um ciclo rigoroso de tres etapas, repetido continuamente:

### Red (Vermelho)
- Escreva um teste que **falha**.
- O teste deve descrever o comportamento desejado ANTES de implementar.
- Execute o teste e confirme que ele falha pelo motivo certo.

### Green (Verde)
- Escreva o **minimo de codigo** necessario para o teste passar.
- Nao se preocupe com elegancia — faca funcionar primeiro.
- "Make it work" — pode ser hardcoded, pode ser feio.

### Refactor (Refatorar)
- Com os testes verdes, **melhore o codigo** sem alterar o comportamento.
- Remova duplicacao, melhore nomes, aplique padroes.
- Execute os testes apos cada mudanca para garantir que continuam verdes.

\`\`\`
    ┌──────────┐
    │   RED    │ ← Escreva teste que falha
    └────┬─────┘
         │
    ┌────▼─────┐
    │  GREEN   │ ← Faca o teste passar (minimo)
    └────┬─────┘
         │
    ┌────▼─────┐
    │ REFACTOR │ ← Melhore o codigo (testes verdes)
    └────┬─────┘
         │
         └──→ Volta para RED
\`\`\`

## 2. Estrategias de Implementacao

### Fake It ('Til You Make It)
Retorne um valor hardcoded para fazer o teste passar, depois generalize.

\`\`\`typescript
// Red: teste espera soma(2, 3) === 5
// Green (Fake It):
function soma(a: number, b: number): number {
  return 5; // hardcoded!
}
// Proximo teste forca generalizacao:
// soma(1, 1) === 2 → agora precisa implementar de verdade
function soma(a: number, b: number): number {
  return a + b;
}
\`\`\`

### Triangulation
Use multiplos testes com dados diferentes para "triangular" a implementacao correta.

\`\`\`typescript
// Teste 1: soma(0, 0) === 0
// Teste 2: soma(1, 2) === 3
// Teste 3: soma(-1, 1) === 0
// Com 3 pontos, a implementacao se revela naturalmente
\`\`\`

### Obvious Implementation
Quando a implementacao e obvia, va direto — sem fake it.
Use quando voce tem **alta confianca** na solucao.

\`\`\`typescript
// Obvio: nao precisa de Fake It
function isEmpty(str: string): boolean {
  return str.length === 0;
}
\`\`\`

## 3. Tipos de Teste

### Testes Unitarios
- Testam **uma unidade** (funcao, classe, metodo) isoladamente.
- Rapidos (milissegundos), sem dependencias externas.
- Usam mocks/stubs para isolar a unidade.
- Devem compor a maioria da suite (base da piramide).

\`\`\`typescript
describe('UserService', () => {
  it('deve criar um usuario com email valido', async () => {
    const mockRepo = { save: vi.fn().mockResolvedValue(mockUser) };
    const service = new UserService(mockRepo);

    const result = await service.create({ name: 'Ana', email: 'ana@test.com' });

    expect(result.name).toBe('Ana');
    expect(mockRepo.save).toHaveBeenCalledOnce();
  });
});
\`\`\`

### Testes de Integracao
- Testam a **interacao entre componentes** (service + repository + DB).
- Mais lentos, podem usar banco de dados real (em memoria ou container).
- Verificam que as partes funcionam juntas.

\`\`\`typescript
describe('UsersController (integration)', () => {
  it('POST /users deve criar e retornar usuario', async () => {
    const response = await request(app.getHttpServer())
      .post('/users')
      .send({ name: 'Ana', email: 'ana@test.com', password: '12345678' })
      .expect(201);

    expect(response.body.name).toBe('Ana');
    expect(response.body.id).toBeDefined();
  });
});
\`\`\`

### Testes End-to-End (E2E)
- Testam o **sistema completo** do ponto de vista do usuario.
- Mais lentos e frageis — use com moderacao.
- Validam fluxos criticos de negocio.

### Piramide de Testes
\`\`\`
        /\\
       /E2E\\        ← Poucos (fluxos criticos)
      /──────\\
     /Integracao\\   ← Medio (componentes juntos)
    /────────────\\
   / Unitarios    \\ ← Muitos (rapidos, isolados)
  /────────────────\\
\`\`\`

## 4. Boas Praticas

### Padrao AAA (Arrange-Act-Assert)

Cada teste deve ter tres secoes claramente definidas:

\`\`\`typescript
it('deve calcular desconto para cliente premium', () => {
  // Arrange - prepara o cenario
  const customer = new Customer('Ana', CustomerType.PREMIUM);
  const order = new Order(customer, Money.of(100));

  // Act - executa a acao
  const discount = order.calculateDiscount();

  // Assert - verifica o resultado
  expect(discount).toEqual(Money.of(20));
});
\`\`\`

### Test Doubles

| Tipo | Descricao | Quando usar |
|---|---|---|
| **Stub** | Retorna valores pre-definidos | Quando precisa controlar o que uma dependencia retorna |
| **Mock** | Verifica que metodos foram chamados | Quando o comportamento (chamada) importa |
| **Spy** | Envolve o real e registra chamadas | Quando quer o comportamento real + verificacao |
| **Fake** | Implementacao simplificada funcional | Quando precisa de logica real mas simplificada (ex.: in-memory DB) |
| **Dummy** | Objeto que preenche parametro | Quando o parametro existe mas nao e usado no teste |

\`\`\`typescript
// Stub
const userRepo = { findById: vi.fn().mockResolvedValue(mockUser) };

// Mock (verifica chamada)
expect(emailService.send).toHaveBeenCalledWith(expectedEmail);

// Spy
const spy = vi.spyOn(logger, 'info');
service.process();
expect(spy).toHaveBeenCalledWith('Processing started');

// Fake
class InMemoryUserRepository implements UserRepository {
  private users: Map<string, User> = new Map();

  async save(user: User): Promise<User> {
    this.users.set(user.id, user);
    return user;
  }

  async findById(id: string): Promise<User | null> {
    return this.users.get(id) ?? null;
  }
}
\`\`\`

## 5. Regras de Ouro do TDD

1. **Nunca escreva codigo de producao sem um teste que falha primeiro.**
2. **Escreva apenas o suficiente de teste para falhar** (nao mais).
3. **Escreva apenas o suficiente de codigo para passar** (nao mais).
4. **Refatore somente com testes verdes.**
5. **Cada teste deve ter um unico motivo para falhar.**
6. **Testes sao documentacao viva** — nomeie-os como especificacoes.
7. **Testes devem ser rapidos** — se demoram, voce para de rodar.
`;

export function register(server: McpServer): void {
  server.resource(
    "tdd-reference",
    "senior-mind://references/tdd-reference",
    {
      description:
        "Referencia TDD: ciclo Red-Green-Refactor de Kent Beck, estrategias (Fake It, Triangulation, Obvious Implementation), tipos de teste, AAA e test doubles",
      mimeType: "text/markdown",
    },
    async () => ({
      contents: [
        {
          uri: "senior-mind://references/tdd-reference",
          mimeType: "text/markdown",
          text: TDD_REFERENCE_CONTENT,
        },
      ],
    })
  );
}
