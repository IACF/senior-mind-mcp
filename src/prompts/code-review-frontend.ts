import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { config } from "../config.js";

export function register(server: McpServer): void {
  server.prompt(
    "code-review-frontend",
    "Gera um template de code review para frontend focado em Composition API/hooks, reatividade, componentizacao e performance",
    {
      code: z.string().describe("Codigo frontend a ser revisado"),
      framework: z.enum(["vue", "react"]).describe("Framework frontend"),
    },
    ({ code, framework }) => {
      const frameworkLabel = framework === "vue" ? "Vue 3" : "React 18";

      let template = `# Code Review — Frontend (${frameworkLabel})\n\n`;
      template += `**Revisor**: ${config.developerName}\n`;
      template += `**Framework**: ${frameworkLabel}\n\n`;
      template += `---\n\n`;

      template += `## Codigo a revisar\n\n`;
      template += `\`\`\`${framework === "vue" ? "vue" : "tsx"}\n${code}\n\`\`\`\n\n`;
      template += `---\n\n`;

      if (framework === "vue") {
        template += `## 1. Composition API\n\n`;
        template += `- [ ] **script setup**: Usa \`<script setup lang="ts">\`?\n`;
        template += `- [ ] **ref vs reactive**: \`ref\` para primitivos, \`reactive\` para objetos?\n`;
        template += `- [ ] **computed**: Valores derivados usam \`computed\` (nao watch + estado)?\n`;
        template += `- [ ] **watch vs watchEffect**: Escolha adequada de watcher?\n`;
        template += `- [ ] **Lifecycle hooks**: \`onMounted\`, \`onUnmounted\` usados corretamente?\n\n`;

        template += `## 2. Reatividade\n\n`;
        template += `- [ ] **Perda de reatividade**: Desestruturacao de reactive sem \`toRefs\`?\n`;
        template += `- [ ] **ref.value**: Acesso correto no script (.value) vs template (sem .value)?\n`;
        template += `- [ ] **Watchers excessivos**: Poderia usar \`computed\` em vez de \`watch\`?\n`;
        template += `- [ ] **Efeitos colaterais**: Side effects isolados em watchers/lifecycle hooks?\n\n`;

        template += `## 3. Componentizacao\n\n`;
        template += `- [ ] **Props tipadas**: \`defineProps<T>()\` com interface TypeScript?\n`;
        template += `- [ ] **Emits tipados**: \`defineEmits<T>()\` com tipos?\n`;
        template += `- [ ] **Composables**: Logica reutilizavel extraida em composables (use*)?\n`;
        template += `- [ ] **Tamanho**: Componente tem menos de 200 linhas?\n`;
        template += `- [ ] **Responsabilidade unica**: Componente faz UMA coisa?\n`;
        template += `- [ ] **provide/inject**: Usado para evitar prop drilling profundo?\n\n`;

        template += `## 4. Performance\n\n`;
        template += `- [ ] **v-for + key**: Listas usam :key unica e estavel?\n`;
        template += `- [ ] **v-if vs v-show**: Escolha adequada (toggle frequente = v-show)?\n`;
        template += `- [ ] **Lazy loading**: Componentes pesados usam \`defineAsyncComponent\`?\n`;
        template += `- [ ] **Eventos**: Listeners removidos no \`onUnmounted\`?\n\n`;
      } else {
        template += `## 1. Hooks\n\n`;
        template += `- [ ] **useState**: Estado minimo? Valores derivados calculados direto?\n`;
        template += `- [ ] **useEffect**: Dependencias corretas? Cleanup implementado?\n`;
        template += `- [ ] **useCallback/useMemo**: Usado apenas quando necessario (nao prematuramente)?\n`;
        template += `- [ ] **useRef**: Para valores mutaveis que nao causam re-render?\n`;
        template += `- [ ] **Regras dos hooks**: Chamados apenas no top level? Nunca em condicionais?\n\n`;

        template += `## 2. Reatividade e Estado\n\n`;
        template += `- [ ] **Estado minimo**: Deriva o que pode via calculo/useMemo em vez de useState + useEffect?\n`;
        template += `- [ ] **Estado local vs global**: Estado perto de onde e usado?\n`;
        template += `- [ ] **Atualizacao funcional**: \`setState(prev => ...)\` quando depende do valor anterior?\n`;
        template += `- [ ] **Imutabilidade**: Estado atualizado de forma imutavel (spread, map, filter)?\n\n`;

        template += `## 3. Componentizacao\n\n`;
        template += `- [ ] **Props tipadas**: Interface TypeScript para props?\n`;
        template += `- [ ] **Custom hooks**: Logica reutilizavel extraida em hooks (use*)?\n`;
        template += `- [ ] **Container/Presentational**: Logica separada de apresentacao?\n`;
        template += `- [ ] **Tamanho**: Componente tem menos de 200 linhas?\n`;
        template += `- [ ] **Responsabilidade unica**: Componente faz UMA coisa?\n`;
        template += `- [ ] **Children/Composition**: Usa children e composicao em vez de props complexas?\n\n`;

        template += `## 4. Performance\n\n`;
        template += `- [ ] **Keys estaveis**: Listas usam key unica e estavel (nunca index se reordena)?\n`;
        template += `- [ ] **React.memo**: Componentes que re-renderizam sem necessidade?\n`;
        template += `- [ ] **Lazy loading**: \`React.lazy\` + \`Suspense\` para code splitting?\n`;
        template += `- [ ] **useEffect desnecessario**: Logica derivada que deveria ser calculo direto?\n\n`;
      }

      template += `## 5. Qualidade Geral\n\n`;
      template += `- [ ] **TypeScript**: Tudo tipado? Sem \`any\`?\n`;
      template += `- [ ] **Nomes**: Componentes PascalCase, funcoes camelCase, constantes UPPER_SNAKE?\n`;
      template += `- [ ] **Acessibilidade**: Atributos ARIA, semantica HTML, labels em forms?\n`;
      template += `- [ ] **Tratamento de erros**: Loading states, error boundaries, fallbacks?\n`;
      template += `- [ ] **Testes**: Componente tem testes unitarios?\n\n`;

      template += `---\n\n`;
      template += `## Resumo\n\n`;
      template += `| Categoria | Status | Observacoes |\n`;
      template += `|---|---|---|\n`;
      template += `| ${framework === "vue" ? "Composition API" : "Hooks"} | ✅/⚠️/❌ | |\n`;
      template += `| Reatividade | ✅/⚠️/❌ | |\n`;
      template += `| Componentizacao | ✅/⚠️/❌ | |\n`;
      template += `| Performance | ✅/⚠️/❌ | |\n`;
      template += `| Qualidade Geral | ✅/⚠️/❌ | |\n\n`;

      template += `> ${config.developerName}, preencha o status e observacoes de cada categoria apos a revisao.\n`;

      return {
        messages: [
          {
            role: "user" as const,
            content: { type: "text" as const, text: template },
          },
        ],
      };
    }
  );
}
