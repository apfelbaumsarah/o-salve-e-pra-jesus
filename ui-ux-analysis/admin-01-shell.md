# Admin Shell — Análise UI/UX (login, sidebar, header, layout global)

Escopo: apenas o "casco" do painel (`src/components/AdminPanel.tsx`). Abas individuais (Dashboard, Pipeline, Cadastros etc.) estão fora do escopo.

Observação metodológica: as ferramentas do Claude Preview foram negadas por permissão (`preview_resize`), então a análise é baseada 100% na leitura do código-fonte (linhas ~22–845 + `SidebarButton` em 1658). Todas as referências apontam para `src/components/AdminPanel.tsx`.

---

## Observações e correções (obs → fix)

1. **Login sem `autoComplete` / heurísticas de password manager** (L697–716)
   Obs: os `<input>` de e-mail e senha não têm `autoComplete="email"` / `autoComplete="current-password"`, nem `name` ou `id`. 1Password/iCloud Keychain/Chrome não conseguem preencher com confiança, e não há `<label htmlFor>` associado (o `<label>` é irmão, não conectado).
   Fix: adicionar `id`, `name`, `autoComplete`, e transformar em `<label htmlFor="email">` + `<input id="email" name="email" autoComplete="email">`. Para a senha: `autoComplete="current-password"`.

2. **Toggle de senha sem estado acessível** (L717–723)
   Obs: o botão "olho" não expõe `aria-label`, `aria-pressed` nem `aria-controls`. Para leitores de tela é um botão vazio.
   Fix: `aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}`, `aria-pressed={showPassword}`, `aria-controls="password"`. Considerar também `tabIndex` garantido e foco visível (hoje só muda cor).

3. **Mensagem de erro de login não é anunciada** (L727–729)
   Obs: `{loginError && <p ...>}` aparece visualmente, mas não vive em uma região ARIA-live, então usuários de leitor de tela não recebem feedback ao falhar o login. Além disso, a mensagem é genérica ("E-mail ou senha inválidos.") — ok para segurança, mas não há link "esqueci minha senha".
   Fix: envolver em `role="alert"` ou `aria-live="assertive"`, e `aria-describedby` no input de senha. Adicionar link "Esqueci minha senha" (fluxo de reset via Supabase).

4. **Botão de submit do login não reflete estado desabilitado visualmente** (L731–737)
   Obs: `disabled={isLoggingIn}` é aplicado, mas não há classe `disabled:opacity-…` nem `cursor-not-allowed`. Botão parece clicável mesmo travado; o único feedback é o `Loader2`.
   Fix: adicionar `disabled:opacity-60 disabled:cursor-not-allowed`, e `aria-busy={isLoggingIn}`. Considerar também um texto "ENTRANDO…" ao lado do spinner para clareza.

5. **Sidebar sem semântica de navegação** (L809–840)
   Obs: o `<aside>` não contém um `<nav aria-label="Navegação principal">`, e os itens são `<button>` soltos dentro de um `<div>`. Tecnologias assistivas não enxergam isso como menu de navegação, e não há landmark distinto do logout.
   Fix: envolver a lista de abas em `<nav aria-label="Seções do painel">` com `<ul>/<li>`, separando o bloco de usuário/logout em outra região (`<div role="region" aria-label="Conta">`).

6. **Active state do `SidebarButton` só usa cor** (L1660–1668)
   Obs: o item ativo é indicado por `bg-urban-yellow text-urban-black`. Não há `aria-current="page"`, não há indicador não-dependente de cor (barra lateral, ícone cheio, bold diferencial). Usuários com daltonismo dependem exclusivamente de matiz.
   Fix: adicionar `aria-current={active ? 'page' : undefined}`, uma barra vertical (`before:` pseudo-elemento de 3px amarelo) à esquerda e peso tipográfico maior no ativo.

7. **Agrupamento e ordem da sidebar misturam conceitos** (L820–829)
   Obs: "Cadastros" e "Sem Bíblia" são, na prática, a mesma tela com filtros diferentes — aparecem como dois itens top-level paralelos. Pipeline CRM vem antes de Cadastros, mas "Sem Bíblia" (um sub-filtro) aparece imediatamente após Cadastros sem indentação. "Orações" e "Voluntários" ficam ao final sem agrupamento. Vários itens estão comentados (Banners, Lives, Eventos, Equipe) — evidencia falta de critério formal de IA.
   Fix: agrupar em seções com heading `"CRM" / "Conteúdo" / "Equipe"`, colocar "Sem Bíblia" como sub-item recolhível dentro de Cadastros (ou como filtro chip na própria página), e remover código comentado (mover para um feature-flag ou apagar).

8. **Ícones ambíguos** (L821, L823)
   Obs: "Pipeline CRM" usa `Box` (caixa) — não remete a pipeline/kanban. "Sem Bíblia" usa `BookOpen` — mesmo ícone que tipicamente representaria "ter Bíblia". Pode confundir.
   Fix: trocar `Box` por `Columns` / `Kanban` / `GitBranch`. Para "Sem Bíblia", usar `BookX` ou `BookOpen` com um badge/slash, ou um ícone de alerta (`AlertCircle`) mais coerente com "precisa de Bíblia".

9. **Sem link "pular para o conteúdo" (skip link)** (L807–847)
   Obs: usuários de teclado precisam tabular por todos os botões da sidebar antes de chegar ao conteúdo. Não há skip link.
   Fix: adicionar um `<a href="#main" class="sr-only focus:not-sr-only ...">Ir para conteúdo</a>` no topo e `id="main"` no container `<div class="flex-1 md:ml-64 ...">`.

10. **Drawer mobile sem overlay/backdrop e sem trap de foco** (L809–818, L842–845)
    Obs: no mobile, quando `isSidebarOpen=true` a sidebar desliza sobre o conteúdo, mas não existe um overlay escurecido/clicável para fechar. Tocar fora não fecha. Além disso, o foco do teclado não é enviado para dentro do drawer (nem retorna para o botão Menu ao fechar), e a tecla `Esc` não fecha. Não há `aria-modal`/`role="dialog"` nem bloqueio de scroll do `<body>`.
    Fix: adicionar `<div class="fixed inset-0 bg-black/60 md:hidden" onClick={close}>` enquanto aberto; mover foco para o botão `X` ao abrir e devolver ao `MenuIcon` ao fechar; `useEffect` para `keydown Escape`; travar `document.body.style.overflow` enquanto aberto.

11. **Header mobile não anuncia "abrir menu"** (L842–845)
    Obs: `<button onClick={() => setIsSidebarOpen(true)}><MenuIcon /></button>` — botão sem rótulo textual nem `aria-label`, e sem `aria-expanded`/`aria-controls` ligando-o à sidebar.
    Fix: `aria-label="Abrir menu"`, `aria-expanded={isSidebarOpen}`, `aria-controls="admin-sidebar"`; adicionar `id="admin-sidebar"` ao `<aside>`.

12. **Focus ring global ausente / `outline-none` nos inputs** (L699, L711, L1681)
    Obs: inputs usam `outline-none focus:border-urban-yellow` — a borda amarela é só 1px em fundo preto, baixo contraste focal, e `outline-none` remove o anel padrão do browser sem substituir adequadamente. Botões da sidebar e submit não têm `focus-visible:ring`.
    Fix: substituir por `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-urban-yellow focus-visible:ring-offset-2 focus-visible:ring-offset-urban-black` em todos os controles interativos (inputs, `SidebarButton`, toggle de senha, submit, logout, menu mobile).

13. **Contraste de textos secundários no tema escuro** (L692, L696, L833, L1675)
    Obs: `text-gray-400` sobre `bg-urban-black`/`bg-urban-gray` fica no limite do WCAG AA para texto pequeno; `text-gray-500` usado em labels (`text-xs font-bold uppercase`) e no "Logado como" (`text-[10px]`) provavelmente falha AA (contraste < 4.5:1). Placeholder `••••••••` em `gray-*` idem.
    Fix: elevar labels para `text-gray-300`/`text-white/70`; textos de apoio ≥ `text-gray-400` apenas em fontes ≥ 16px bold. Rodar Lighthouse/axe para confirmar.

14. **Breakpoint único (md) + largura fixa da sidebar** (L811, L847)
    Obs: sidebar é `w-64` fixa e o conteúdo compensa com `md:ml-64`. Entre 768px (md) e ~1024px, a sidebar ocupa ~25% da viewport, e o `max-w-6xl` do conteúdo fica espremido. Não há breakpoint intermediário para colapsar em sidebar "ícones only" ou ajustar padding.
    Fix: introduzir variante colapsada (ex.: `lg:w-64 md:w-16` com apenas ícones + `title`/tooltip); ou subir o breakpoint para `lg:` (≥1024) deixando tablet no modo drawer. Ajustar `p-4 md:p-8` progressivamente.

15. **Loading screens inconsistentes e sem texto** (L672–678, L851–854)
    Obs: o loading global (`loading || isCheckingAccess`) e o `isTabLoading` mostram apenas um `Loader2` girando — sem `role="status"`, sem `aria-live`, sem label tipo "Carregando painel". Leitores de tela não falam nada; usuários em conexão lenta ficam sem contexto.
    Fix: `<div role="status" aria-live="polite"><Loader2 ... /><span class="sr-only">Carregando…</span></div>`. Considerar skeleton screens no lugar do spinner cheio para reduzir percepção de espera.

16. **Tela "sem acesso" reaproveita o card de login** (L680–754)
    Obs: quando o usuário está logado mas não tem `hasAccess`, mostra-se o formulário de login *junto* com a mensagem "A conta X não tem permissão". Isso é confuso — o usuário tenta logar de novo e nada muda.
    Fix: bifurcar os dois estados. Se `user && !hasAccess`, mostrar tela dedicada de "Sem permissão" (ícone diferente, mensagem clara, botão "Sair desta conta" como CTA primário, sem formulário).

17. **Botão "Sair do Painel" com cor de erro** (L836–838)
    Obs: usa `bg-red-500/10 text-red-500 hover:bg-red-500` — vermelho é linguagem de ação destrutiva/perigo; logout não é perigoso. Pode causar hesitação.
    Fix: usar neutro (`bg-white/5 text-gray-300 hover:bg-white/10`). Reservar vermelho para deletar/remover.

---

## Top 3 prioridades de correção

1. **Acessibilidade básica do login + drawer mobile** (itens 1, 2, 3, 10, 11, 12)
   Impacto alto em usabilidade para teclado/leitores de tela e em preenchimento automático. Inclui: `autoComplete`/`htmlFor` no login, `aria-label`/`aria-pressed` no toggle de senha, `role="alert"` na mensagem de erro, overlay + ESC + trap de foco no drawer, `aria-label`/`aria-expanded` no botão menu, `focus-visible:ring` global. Baixo esforço, grande retorno.

2. **Navegação semântica + active state não-dependente-de-cor** (itens 5, 6, 9)
   Envolver itens em `<nav>` com `<ul>/<li>`, adicionar `aria-current="page"`, indicador visual extra (barra lateral) no item ativo, e um skip link. Melhora conformidade WCAG e também a percepção de hierarquia na UI.

3. **Arquitetura de informação da sidebar + drawer mobile completo** (itens 7, 8, 10, 14)
   Agrupar por seções ("CRM", "Conteúdo", "Equipe"), transformar "Sem Bíblia" em sub-filtro/chip dentro de Cadastros, trocar ícones ambíguos (`Box` → `Kanban`), remover itens comentados, e implementar drawer mobile de verdade (overlay + trap + ESC + `aria-modal`). Define o "esqueleto" correto antes de polir as abas internas.
