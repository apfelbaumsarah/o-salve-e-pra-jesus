# Relatório Geral UX/UI — Painel Admin

Consolidação das 5 análises individuais (shell, dashboard, pipeline, cadastros+modal, orações/voluntários/settings) em um mapa priorizado para execução. Todas as observações-base estão nos 5 .md nesta pasta; referências de linha apontam para `src/components/AdminPanel.tsx`.

> Ressalva metodológica comum: subagentes não obtiveram permissão para o MCP Claude Preview, então as 5 análises foram feitas sobre código-fonte (1699 linhas). Nenhum screenshot validou pixel-a-pixel, mas as observações citam linhas exatas e são verificáveis.

---

## Temas transversais (problemas que aparecem em múltiplas abas)

### T1. Acessibilidade estrutural ausente
- `outline-none` em todos os inputs sem `focus-visible:ring` substituto (shell, cadastros, settings).
- Sidebar não é `<nav>`, itens ativos só diferenciam por cor (sem `aria-current`).
- Drawer mobile não tem overlay, trap de foco, ESC, nem `aria-modal`.
- Cards de pipeline e linhas de lista são `<div>` clicáveis sem `role="button"`, `tabIndex`, ou handler de teclado.
- Mensagens de erro/sucesso não vivem em regiões `aria-live`.
- Contraste `text-gray-400/500` sobre fundo preto está no limite do WCAG AA em textos pequenos.

### T2. Feedback pós-ação inconsistente
- Settings usa `alert()` nativo (quebra a linguagem visual do restante do painel).
- Save do modal de cadastro usa toast transitório só no próprio botão.
- Toggle de `prayer_done` não dá feedback além de opacity na linha.
- Drill-down de KPI muda de aba sem confirmação/animação.
→ Padronizar um sistema de toast global (`role="status"` + timer + undo onde faz sentido).

### T3. Mobile é um afterthought em todas as abas
- DnD da pipeline não funciona em touch.
- Chips de filtro quebram em 3+ linhas antes da lista aparecer.
- Cards do pipeline se escondem sem indicador de scroll horizontal.
- Modal de detalhe com `text-5xl` no header quebra em nomes longos.
- Drawer mobile sem ESC/overlay (shell).

### T4. Ações em massa e produtividade
- Nenhuma aba tem seleção múltipla / bulk actions.
- Mudar status de cadastros exige 5 cliques por registro (fora da Pipeline).
- CSV exporta `data` bruto ignorando filtro/busca ativos.
- Dashboard não liga para Cadastros com pré-filtro a partir dos donuts (pulando um passo óbvio).

### T5. Arquitetura de informação confusa
- "Sem Bíblia" é um sub-filtro disfarçado de aba top-level na sidebar.
- Configurações está órfã — **nenhum botão da sidebar aponta para ela** (shell + settings confirmam).
- Vários itens comentados em sidebar (Banners, Lives, Eventos, Equipe) indicam ausência de critério formal.
- "Voluntários" reusa a UI de Cadastros com vocabulário errado ("Contatado/Concluído" faz sentido para discipulado, não para coordenação de voluntários).
- Ícones ambíguos (`Box` para Pipeline, `BookOpen` para "Sem Bíblia").

### T6. Copy e estados vazios
- Empty state genérico "Nenhum dado encontrado aqui" reusado em todas as listas.
- Pipeline tem 4 colunas com a mesma frase vazia.
- Orações (aba emocional) recebe copy transacional.
- Loading global é um `<Loader2>` central, sem `role="status"` nem skeleton.

---

## Top 10 prioridades (priorizadas por impacto × esforço)

| # | Prioridade | Impacto | Esforço | Aba origem |
|---|---|---|---|---|
| **1** | **Restaurar botão "Configurações" na sidebar** (hoje a aba está inacessível via UI) | Alto | Trivial | Settings/Shell |
| **2** | **Acessibilidade básica: `autoComplete`/`htmlFor` no login, `aria-label` no toggle, `role="alert"` em erros, `focus-visible:ring` global, overlay+ESC+trap no drawer mobile** | Alto | Médio | Shell |
| **3** | **DnD acessível e mobile (`@dnd-kit/core` com touch + keyboard)** — sem isso, a Pipeline é quebrada em celular, onde o discipulador está | Alto | Médio-alto | Pipeline |
| **4** | **Mudança de status inline na lista de Cadastros + checkbox de seleção múltipla + toolbar de bulk** (atribuir, mudar status, marcar Bíblia, exportar seleção) | Alto | Médio | Cadastros |
| **5** | **Seletor de período no Dashboard (7d/30d/90d/Tudo) + enriquecer KPIs para 4–6 cards com delta semanal** | Alto | Médio | Dashboard |
| **6** | **CSV respeitar filtro+busca + chips com contagem por bucket** (dois bugs de confiança no painel) | Alto | Baixo | Cadastros |
| **7** | **Padronizar feedback: trocar `alert()` de Settings por toast + toast global de save + live-preview em Settings** | Médio-alto | Médio | Settings + transversal |
| **8** | **Redesign do card da Pipeline: altura ≤120px, line-clamp-2 no nome, avatar do owner, badges padronizados, remover `<select>` redundante** | Médio-alto | Médio | Pipeline |
| **9** | **Reorganizar sidebar (seções CRM/Conteúdo/Equipe), aria-current, skip-link, trocar ícones ambíguos, remover itens comentados** | Médio | Baixo-médio | Shell |
| **10** | **Diferenciar Voluntários de Cadastros: status próprio (Disponível/Escalado/Inativo), filtro por `how_to_help`, promover a área de ajuda a destaque no card** | Médio | Médio | Voluntários |

---

## Quick wins (< 1h cada, alto valor)

1. Restaurar botão "Configurações" na sidebar (#1 do ranking).
2. Trocar `alert()` por toast no Settings.
3. `aria-label="Abrir menu"` + `aria-expanded` no botão mobile do menu.
4. Botão "Sair do Painel" — tirar vermelho destrutivo, usar neutro.
5. `line-clamp-2` no nome dos cards da Pipeline.
6. `exportToCSV` usar `visibleData` em vez de `data`.
7. Empty state da aba Orações com copy acolhedor.
8. Ícone da Pipeline: `Box` → `Columns`/`Kanban`.
9. Corrigir typo "as" → "às" em data (LiveStream, mas aplicável a qualquer formatDate).
10. Botão "Marcar Bíblia entregue" aparecer sempre que `hasNoBible=true` (hoje só aparece no filtro noBible).

---

## Roadmap sugerido em 3 ondas

**Onda 1 — Semana 1-2: Destrava e polimento crítico**
- Todos os 10 quick wins acima.
- Top 10 itens #1, #2, #6, #9.
- Resultado: painel acessível por teclado, Settings alcançável, CSV coerente, sidebar organizada.

**Onda 2 — Semana 3-4: Produtividade operacional**
- Top 10 #4 (bulk actions + inline status em Cadastros).
- Top 10 #5 (time range + KPIs enriquecidos no Dashboard).
- Top 10 #7 (sistema de toast global + live-preview em Settings).
- Resultado: operação diária de admin muito mais rápida; Dashboard responde "como foi esta semana?".

**Onda 3 — Semana 5-6: Pipeline como ferramenta de gestão**
- Top 10 #3 (DnD acessível + mobile).
- Top 10 #8 (redesign do card).
- Top 10 #10 (Voluntários com status próprio).
- Filtros e totais do funil na Pipeline (conversão, tempo parado).
- Resultado: Pipeline vira uma ferramenta de acompanhamento real, não uma lista visual.

---

## Anexo — arquivos individuais
- [admin-01-shell.md](admin-01-shell.md) — login, sidebar, drawer, layout global (17 obs + Top 3)
- [admin-02-dashboard.md](admin-02-dashboard.md) — KPIs, donuts, drill-down (17 obs + Top 3)
- [admin-03-pipeline.md](admin-03-pipeline.md) — kanban de discipulado, DnD, cards (20 obs + Top 3)
- [admin-04-cadastros-modal.md](admin-04-cadastros-modal.md) — lista + filtros + modal de detalhe (26 obs + Top 3)
- [admin-05-prayers-volunteers-settings.md](admin-05-prayers-volunteers-settings.md) — 3 abas secundárias (17 obs + Top 3)

Total: **97 observações concretas** com fix acionável, 15 Top-3s originais, consolidados em 6 temas transversais e 10 prioridades globais.
