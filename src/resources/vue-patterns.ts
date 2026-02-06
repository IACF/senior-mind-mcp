import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

const VUE_PATTERNS_CONTENT = `# Vue 3 - Patterns e Boas Praticas

## 1. Composition API

A Composition API e a forma recomendada de organizar logica em Vue 3, substituindo a Options API para componentes complexos.

### ref e reactive

\`\`\`vue
<script setup lang="ts">
import { ref, reactive } from 'vue'

// ref: para valores primitivos ou que precisam ser reatribuidos
const count = ref(0)
const name = ref<string>('')

// reactive: para objetos — nao pode ser reatribuido
const form = reactive({
  email: '',
  password: '',
  rememberMe: false,
})

// Acesso: ref usa .value no script, reactive acessa direto
count.value++
form.email = 'user@test.com'
</script>

<template>
  <!-- No template, ref e acessado sem .value -->
  <p>{{ count }}</p>
  <p>{{ form.email }}</p>
</template>
\`\`\`

### computed

Valores derivados que sao recalculados automaticamente quando suas dependencias mudam.

\`\`\`vue
<script setup lang="ts">
import { ref, computed } from 'vue'

const items = ref<CartItem[]>([])

// Computed e somente leitura por padrao
const totalPrice = computed(() =>
  items.value.reduce((sum, item) => sum + item.price * item.quantity, 0)
)

const hasItems = computed(() => items.value.length > 0)

// Computed com getter e setter
const fullName = computed({
  get: () => \`\${firstName.value} \${lastName.value}\`,
  set: (value: string) => {
    const [first, ...rest] = value.split(' ')
    firstName.value = first
    lastName.value = rest.join(' ')
  },
})
</script>
\`\`\`

### watch e watchEffect

\`\`\`vue
<script setup lang="ts">
import { ref, watch, watchEffect } from 'vue'

const searchQuery = ref('')
const selectedId = ref<number | null>(null)

// watch: reage a mudancas especificas
watch(searchQuery, async (newQuery, oldQuery) => {
  if (newQuery.length >= 3) {
    results.value = await searchApi(newQuery)
  }
}, { debounce: 300 })

// watch profundo em objetos
watch(form, (newForm) => {
  saveFormDraft(newForm)
}, { deep: true })

// watchEffect: rastreia dependencias automaticamente
watchEffect(async () => {
  if (selectedId.value) {
    const data = await fetchUser(selectedId.value)
    user.value = data
  }
})
</script>
\`\`\`

## 2. Script Setup e Organizacao de Componentes

\`<script setup>\` e a forma recomendada — menos boilerplate, melhor type inference.

### Estrutura recomendada de um componente:

\`\`\`vue
<script setup lang="ts">
// 1. Imports
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import type { User } from '@/types'
import UserCard from '@/components/UserCard.vue'

// 2. Props e Emits
const props = defineProps<{
  userId: string
  showDetails?: boolean
}>()

const emit = defineEmits<{
  select: [user: User]
  delete: [id: string]
}>()

// 3. Composables
const router = useRouter()

// 4. Estado reativo
const user = ref<User | null>(null)
const isLoading = ref(false)

// 5. Computed
const displayName = computed(() =>
  user.value ? \`\${user.value.firstName} \${user.value.lastName}\` : ''
)

// 6. Metodos
async function fetchUser(): Promise<void> {
  isLoading.value = true
  try {
    user.value = await usersApi.getById(props.userId)
  } finally {
    isLoading.value = false
  }
}

function handleSelect(): void {
  if (user.value) {
    emit('select', user.value)
  }
}

// 7. Lifecycle hooks
onMounted(() => {
  fetchUser()
})
</script>

<template>
  <div v-if="isLoading" class="loading">Carregando...</div>
  <UserCard
    v-else-if="user"
    :user="user"
    :show-details="showDetails"
    @click="handleSelect"
  />
</template>
\`\`\`

## 3. Composables Pattern

Composables extraem logica reativa reutilizavel em funcoes. Convencao: prefixo \`use\`.

\`\`\`typescript
// composables/useAsync.ts
import { ref, type Ref } from 'vue'

interface UseAsyncReturn<T> {
  data: Ref<T | null>
  error: Ref<string | null>
  isLoading: Ref<boolean>
  execute: () => Promise<void>
}

export function useAsync<T>(asyncFn: () => Promise<T>): UseAsyncReturn<T> {
  const data = ref<T | null>(null) as Ref<T | null>
  const error = ref<string | null>(null)
  const isLoading = ref(false)

  async function execute(): Promise<void> {
    isLoading.value = true
    error.value = null
    try {
      data.value = await asyncFn()
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Erro desconhecido'
    } finally {
      isLoading.value = false
    }
  }

  return { data, error, isLoading, execute }
}
\`\`\`

\`\`\`typescript
// composables/usePagination.ts
import { ref, computed } from 'vue'

export function usePagination(totalItems: Ref<number>, perPage = 10) {
  const currentPage = ref(1)

  const totalPages = computed(() => Math.ceil(totalItems.value / perPage))
  const offset = computed(() => (currentPage.value - 1) * perPage)
  const hasNextPage = computed(() => currentPage.value < totalPages.value)
  const hasPrevPage = computed(() => currentPage.value > 1)

  function nextPage(): void {
    if (hasNextPage.value) currentPage.value++
  }

  function prevPage(): void {
    if (hasPrevPage.value) currentPage.value--
  }

  return {
    currentPage,
    totalPages,
    offset,
    hasNextPage,
    hasPrevPage,
    nextPage,
    prevPage,
  }
}
\`\`\`

### Uso no componente:
\`\`\`vue
<script setup lang="ts">
const { data: users, isLoading, execute: fetchUsers } = useAsync(() =>
  usersApi.list()
)

onMounted(fetchUsers)
</script>
\`\`\`

## 4. Props Tipadas e Emits

### Props com defaults:
\`\`\`vue
<script setup lang="ts">
interface Props {
  title: string
  items: Item[]
  variant?: 'primary' | 'secondary'
  maxItems?: number
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  maxItems: 10,
})
</script>
\`\`\`

### Emits tipados:
\`\`\`vue
<script setup lang="ts">
const emit = defineEmits<{
  update: [value: string]
  submit: [data: FormData]
  'update:modelValue': [value: boolean]
}>()
</script>
\`\`\`

## 5. Provide / Inject

Para compartilhar dados entre componentes ancestral e descendentes sem prop drilling.

\`\`\`typescript
// Chave tipada (symbols.ts)
import type { InjectionKey, Ref } from 'vue'

export const ThemeKey: InjectionKey<Ref<'light' | 'dark'>> = Symbol('theme')

// Componente pai
import { provide, ref } from 'vue'
import { ThemeKey } from '@/symbols'

const theme = ref<'light' | 'dark'>('light')
provide(ThemeKey, theme)

// Componente filho (qualquer profundidade)
import { inject } from 'vue'
import { ThemeKey } from '@/symbols'

const theme = inject(ThemeKey) // Ref<'light' | 'dark'> | undefined
\`\`\`

## 6. Boas Praticas Vue 3

- **Prefira Composition API** com \`<script setup>\` para novos componentes.
- **Extraia composables** quando logica e reutilizada ou o componente fica grande.
- **Tipe tudo**: use TypeScript para props, emits, refs e composables.
- **Componentes pequenos**: se um componente tem mais de 200 linhas, considere dividir.
- **v-model customizado**: use \`defineModel()\` (Vue 3.4+) ou \`update:modelValue\`.
- **Evite watchers excessivos**: prefira \`computed\` quando possivel.
- **Nomeie eventos com kebab-case** no template, camelCase no script.
`;

export function register(server: McpServer): void {
  server.resource(
    "vue-patterns",
    "senior-mind://references/vue-patterns",
    {
      description:
        "Patterns Vue 3: Composition API (ref, reactive, computed, watch), script setup, composables, props tipadas, emits e provide/inject",
      mimeType: "text/markdown",
    },
    async () => ({
      contents: [
        {
          uri: "senior-mind://references/vue-patterns",
          mimeType: "text/markdown",
          text: VUE_PATTERNS_CONTENT,
        },
      ],
    })
  );
}
