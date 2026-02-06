import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

const REACT_PATTERNS_CONTENT = `# React 18 - Patterns e Boas Praticas

## 1. Hooks Fundamentais

### useState
\`\`\`tsx
import { useState } from 'react'

function Counter() {
  const [count, setCount] = useState(0)

  // Atualizacao funcional (quando depende do valor anterior)
  const increment = () => setCount(prev => prev + 1)

  // Estado com tipo explicito
  const [user, setUser] = useState<User | null>(null)

  // Estado com inicializacao lazy (funcao executada apenas uma vez)
  const [items, setItems] = useState<Item[]>(() => loadFromStorage())

  return <button onClick={increment}>Count: {count}</button>
}
\`\`\`

### useEffect
\`\`\`tsx
import { useState, useEffect } from 'react'

function UserProfile({ userId }: { userId: string }) {
  const [user, setUser] = useState<User | null>(null)

  // Executa quando userId muda
  useEffect(() => {
    let cancelled = false

    async function fetchUser() {
      const data = await usersApi.getById(userId)
      if (!cancelled) {
        setUser(data)
      }
    }

    fetchUser()

    // Cleanup: previne updates em componente desmontado
    return () => { cancelled = true }
  }, [userId])

  return user ? <h1>{user.name}</h1> : <p>Carregando...</p>
}
\`\`\`

### useCallback e useMemo
\`\`\`tsx
import { useCallback, useMemo } from 'react'

function ProductList({ products, onSelect }: Props) {
  // useMemo: memoriza valor computado (recalcula so quando products muda)
  const sortedProducts = useMemo(
    () => [...products].sort((a, b) => a.price - b.price),
    [products]
  )

  // useCallback: memoriza funcao (mesma referencia entre renders)
  const handleSelect = useCallback(
    (id: string) => {
      onSelect(id)
    },
    [onSelect]
  )

  return (
    <ul>
      {sortedProducts.map(product => (
        <ProductItem
          key={product.id}
          product={product}
          onSelect={handleSelect}
        />
      ))}
    </ul>
  )
}
\`\`\`

### useRef
\`\`\`tsx
import { useRef, useEffect } from 'react'

function TextInput() {
  // Ref para elemento DOM
  const inputRef = useRef<HTMLInputElement>(null)

  // Ref para valor mutavel que nao causa re-render
  const renderCount = useRef(0)

  useEffect(() => {
    renderCount.current += 1
    inputRef.current?.focus()
  })

  return <input ref={inputRef} />
}
\`\`\`

## 2. Custom Hooks

Custom hooks extraem logica reutilizavel. Convencao: prefixo \`use\`.

### Regras dos Hooks:
1. **So chame hooks no nivel mais alto** — nunca dentro de loops, condicoes ou funcoes aninhadas.
2. **So chame hooks em componentes React ou outros hooks** — nunca em funcoes normais.

### Exemplos:

\`\`\`tsx
// hooks/useAsync.ts
function useAsync<T>(asyncFn: () => Promise<T>, deps: unknown[] = []) {
  const [state, setState] = useState<{
    data: T | null
    error: string | null
    isLoading: boolean
  }>({ data: null, error: null, isLoading: true })

  useEffect(() => {
    let cancelled = false
    setState(prev => ({ ...prev, isLoading: true, error: null }))

    asyncFn()
      .then(data => {
        if (!cancelled) setState({ data, error: null, isLoading: false })
      })
      .catch(err => {
        if (!cancelled) setState({ data: null, error: err.message, isLoading: false })
      })

    return () => { cancelled = true }
  }, deps)

  return state
}

// Uso
function UsersList() {
  const { data: users, isLoading, error } = useAsync(
    () => usersApi.list(),
    []
  )

  if (isLoading) return <Spinner />
  if (error) return <Error message={error} />
  return <UserTable users={users!} />
}
\`\`\`

\`\`\`tsx
// hooks/useDebounce.ts
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debouncedValue
}

// Uso
function SearchBar() {
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebounce(query, 300)

  useEffect(() => {
    if (debouncedQuery) searchApi(debouncedQuery)
  }, [debouncedQuery])

  return <input value={query} onChange={e => setQuery(e.target.value)} />
}
\`\`\`

## 3. Padroes de Componentes

### Container / Presentational

Separe logica (container) de apresentacao (presentational).

\`\`\`tsx
// Container: logica e dados
function UsersPageContainer() {
  const { data: users, isLoading } = useAsync(() => usersApi.list(), [])

  const handleDelete = useCallback(async (id: string) => {
    await usersApi.delete(id)
    // refetch...
  }, [])

  return (
    <UsersPage
      users={users ?? []}
      isLoading={isLoading}
      onDelete={handleDelete}
    />
  )
}

// Presentational: so renderiza com base nas props
function UsersPage({ users, isLoading, onDelete }: UsersPageProps) {
  if (isLoading) return <Spinner />

  return (
    <div>
      <h1>Usuarios</h1>
      {users.map(user => (
        <UserCard key={user.id} user={user} onDelete={onDelete} />
      ))}
    </div>
  )
}
\`\`\`

### Compound Components

Componentes que compartilham estado implicito via Context.

\`\`\`tsx
const TabsContext = createContext<{
  activeTab: string
  setActiveTab: (tab: string) => void
} | null>(null)

function Tabs({ defaultTab, children }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab)

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className="tabs">{children}</div>
    </TabsContext.Provider>
  )
}

function TabList({ children }: { children: React.ReactNode }) {
  return <div className="tab-list">{children}</div>
}

function Tab({ value, children }: { value: string; children: React.ReactNode }) {
  const { activeTab, setActiveTab } = useContext(TabsContext)!
  return (
    <button
      className={activeTab === value ? 'active' : ''}
      onClick={() => setActiveTab(value)}
    >
      {children}
    </button>
  )
}

function TabPanel({ value, children }: { value: string; children: React.ReactNode }) {
  const { activeTab } = useContext(TabsContext)!
  return activeTab === value ? <div>{children}</div> : null
}

// Uso
<Tabs defaultTab="profile">
  <TabList>
    <Tab value="profile">Perfil</Tab>
    <Tab value="settings">Config</Tab>
  </TabList>
  <TabPanel value="profile"><ProfileForm /></TabPanel>
  <TabPanel value="settings"><SettingsForm /></TabPanel>
</Tabs>
\`\`\`

### Render Props

Compartilhar logica via funcao como children ou prop.

\`\`\`tsx
function MouseTracker({ children }: { children: (pos: Position) => React.ReactNode }) {
  const [position, setPosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const handler = (e: MouseEvent) => setPosition({ x: e.clientX, y: e.clientY })
    window.addEventListener('mousemove', handler)
    return () => window.removeEventListener('mousemove', handler)
  }, [])

  return <>{children(position)}</>
}

// Uso
<MouseTracker>
  {({ x, y }) => <p>Mouse: {x}, {y}</p>}
</MouseTracker>
\`\`\`

## 4. Performance

### React.memo
Previne re-renders quando props nao mudam.

\`\`\`tsx
const UserCard = React.memo(function UserCard({ user, onSelect }: Props) {
  return (
    <div onClick={() => onSelect(user.id)}>
      <h3>{user.name}</h3>
      <p>{user.email}</p>
    </div>
  )
})
\`\`\`

### Quando usar memoizacao:

| Situacao | Ferramenta |
|---|---|
| Componente re-renderiza com mesmas props | \`React.memo\` |
| Calculo derivado caro | \`useMemo\` |
| Callback passado como prop para filho memo | \`useCallback\` |
| Lista grande com muitos itens | Virtualizacao (react-window) |

### Regras de ouro:
- **Nao otimize prematuramente** — meca antes (React DevTools Profiler).
- **useMemo/useCallback** tem custo — so use quando ha beneficio mensuravel.
- **Keys estaveis** em listas: nunca use indice como key se a lista reordena.
- **Lazy loading**: use \`React.lazy()\` + \`Suspense\` para code splitting.

\`\`\`tsx
const AdminPanel = React.lazy(() => import('./AdminPanel'))

function App() {
  return (
    <Suspense fallback={<Spinner />}>
      <AdminPanel />
    </Suspense>
  )
}
\`\`\`

## 5. Boas Praticas React 18

- **Componentes funcionais** sempre — nunca use class components em codigo novo.
- **TypeScript**: tipe todas as props, estado e retornos de hooks.
- **Um componente por arquivo** — nomeie o arquivo igual ao componente.
- **Extraia custom hooks** quando logica e reutilizada ou o componente fica complexo.
- **Evite useEffect para logica derivada** — use \`useMemo\` ou calcule durante o render.
- **Estado minimo**: derive o que puder via \`useMemo\`/calculo direto em vez de \`useState\` + \`useEffect\`.
- **Error Boundaries**: envolva secoes criticas para tratamento de erro gracioso.
- **Coloque estado perto de onde e usado** — evite state lifting desnecessario.
`;

export function register(server: McpServer): void {
  server.resource(
    "react-patterns",
    "senior-mind://references/react-patterns",
    {
      description:
        "Patterns React 18: Hooks (useState, useEffect, useCallback, useMemo, useRef), custom hooks, Container/Presentational, Compound Components, Render Props e performance",
      mimeType: "text/markdown",
    },
    async () => ({
      contents: [
        {
          uri: "senior-mind://references/react-patterns",
          mimeType: "text/markdown",
          text: REACT_PATTERNS_CONTENT,
        },
      ],
    })
  );
}
