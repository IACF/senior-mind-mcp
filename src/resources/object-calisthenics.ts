import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

const OBJECT_CALISTHENICS_CONTENT = `# Object Calisthenics - As 9 Regras de Jeff Bay

Object Calisthenics sao 9 regras de exercicio para escrever codigo orientado a objetos melhor.
Sao restricoes intencionais que forcam boas praticas de design.

## Regra 1: Um Nivel de Indentacao por Metodo

Cada metodo deve ter no maximo um nivel de indentacao. Se voce precisa de mais, extraia para outro metodo.

### Mau exemplo:
\`\`\`typescript
function processOrders(orders: Order[]): void {
  for (const order of orders) {
    if (order.isValid()) {
      for (const item of order.items) {
        if (item.inStock()) {
          item.reserve();
        }
      }
    }
  }
}
\`\`\`

### Bom exemplo:
\`\`\`typescript
function processOrders(orders: Order[]): void {
  orders.filter(o => o.isValid()).forEach(processOrder);
}

function processOrder(order: Order): void {
  order.items.filter(i => i.inStock()).forEach(i => i.reserve());
}
\`\`\`

## Regra 2: Nao Use ELSE

Elimine a palavra-chave \`else\`. Use early return, polimorfismo ou Strategy pattern.

### Mau exemplo:
\`\`\`typescript
function getDiscount(customer: Customer): number {
  if (customer.isPremium()) {
    return 0.2;
  } else if (customer.isRegular()) {
    return 0.1;
  } else {
    return 0;
  }
}
\`\`\`

### Bom exemplo:
\`\`\`typescript
function getDiscount(customer: Customer): number {
  if (customer.isPremium()) return 0.2;
  if (customer.isRegular()) return 0.1;
  return 0;
}
\`\`\`

## Regra 3: Encapsule Tipos Primitivos

Encapsule tipos primitivos que tenham significado de dominio em objetos de valor (Value Objects).

### Mau exemplo:
\`\`\`typescript
function createUser(name: string, email: string, age: number): User {
  if (age < 0 || age > 150) throw new Error("Idade invalida");
  if (!email.includes("@")) throw new Error("Email invalido");
  // ...
}
\`\`\`

### Bom exemplo:
\`\`\`typescript
class Email {
  constructor(private readonly value: string) {
    if (!value.includes("@")) throw new InvalidEmailError(value);
  }
  toString(): string { return this.value; }
}

class Age {
  constructor(private readonly value: number) {
    if (value < 0 || value > 150) throw new InvalidAgeError(value);
  }
  toNumber(): number { return this.value; }
}

function createUser(name: string, email: Email, age: Age): User { /* ... */ }
\`\`\`

## Regra 4: Colecoes de Primeira Classe

Qualquer classe que contenha uma colecao nao deve conter outras variaveis de instancia.
Encapsule colecoes em suas proprias classes.

### Mau exemplo:
\`\`\`typescript
class Order {
  items: OrderItem[] = [];
  // ... outros campos misturados
}
\`\`\`

### Bom exemplo:
\`\`\`typescript
class OrderItems {
  constructor(private readonly items: OrderItem[]) {}

  total(): Money {
    return this.items.reduce((sum, item) => sum.add(item.price()), Money.zero());
  }

  count(): number {
    return this.items.length;
  }

  hasItem(productId: string): boolean {
    return this.items.some(i => i.productId === productId);
  }
}
\`\`\`

## Regra 5: Um Ponto por Linha (Lei de Demeter)

Nao encadeie chamadas em objetos que nao sao seus. Cada linha deve ter no maximo um ponto
(exceto fluent interfaces e builders).

### Mau exemplo:
\`\`\`typescript
const city = order.getCustomer().getAddress().getCity();
\`\`\`

### Bom exemplo:
\`\`\`typescript
// O Order sabe como obter a cidade de entrega
const city = order.deliveryCity();
\`\`\`

## Regra 6: Nao Abrevie

Use nomes completos e descritivos. Se o nome fica longo demais, talvez a classe/metodo tenha responsabilidades demais.

### Mau exemplo:
\`\`\`typescript
class UsrMgr {
  getUsr(id: string): Usr { /* ... */ }
  delUsr(id: string): void { /* ... */ }
}
\`\`\`

### Bom exemplo:
\`\`\`typescript
class UserRepository {
  findById(id: string): User { /* ... */ }
  remove(id: string): void { /* ... */ }
}
\`\`\`

## Regra 7: Mantenha Entidades Pequenas

- Classes: no maximo 50 linhas.
- Pacotes/modulos: no maximo 10 arquivos.
- Metodos: no maximo 5 linhas (ideal).

Se ultrapassar, e sinal de que a entidade tem responsabilidades demais — hora de extrair.

## Regra 8: Nao Mais que 2 Variaveis de Instancia

Uma classe deve ter no maximo 2 variaveis de instancia (campos). Isso forca alta coesao.

### Mau exemplo:
\`\`\`typescript
class Order {
  customer: Customer;
  items: OrderItem[];
  discount: number;
  shippingAddress: Address;
  status: OrderStatus;
}
\`\`\`

### Bom exemplo:
\`\`\`typescript
class Order {
  constructor(
    private readonly customer: Customer,
    private readonly details: OrderDetails,
  ) {}
}

class OrderDetails {
  constructor(
    private readonly items: OrderItems,
    private readonly shipping: ShippingInfo,
  ) {}
}
\`\`\`

## Regra 9: Sem Getters/Setters (Tell, Don't Ask)

Nao peca dados a um objeto para tomar decisoes — diga ao objeto o que fazer.

### Mau exemplo:
\`\`\`typescript
if (account.getBalance() >= amount) {
  account.setBalance(account.getBalance() - amount);
}
\`\`\`

### Bom exemplo:
\`\`\`typescript
account.withdraw(amount); // O Account decide se pode ou nao
\`\`\`

## Resumo das 9 Regras

| # | Regra | Beneficio Principal |
|---|---|---|
| 1 | Um nivel de indentacao | Metodos pequenos e focados |
| 2 | Nao use ELSE | Codigo linear, menos complexidade ciclomatica |
| 3 | Encapsule primitivos | Validacao no dominio, type safety |
| 4 | Colecoes de primeira classe | Comportamento encapsulado |
| 5 | Um ponto por linha | Baixo acoplamento (Lei de Demeter) |
| 6 | Nao abrevie | Legibilidade e clareza |
| 7 | Entidades pequenas | Alta coesao |
| 8 | Max 2 variaveis de instancia | Forca decomposicao |
| 9 | Sem getters/setters | Tell, Don't Ask |
`;

export function register(server: McpServer): void {
  server.resource(
    "object-calisthenics",
    "senior-mind://references/object-calisthenics",
    {
      description:
        "As 9 regras de Object Calisthenics de Jeff Bay: restricoes para escrever codigo OO melhor, com exemplos de boas e mas praticas",
      mimeType: "text/markdown",
    },
    async () => ({
      contents: [
        {
          uri: "senior-mind://references/object-calisthenics",
          mimeType: "text/markdown",
          text: OBJECT_CALISTHENICS_CONTENT,
        },
      ],
    })
  );
}
