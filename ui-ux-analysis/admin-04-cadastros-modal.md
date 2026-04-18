# UI/UX — Admin Panel · Cadastros + Modal de Detalhe

Escopo: aba **Cadastros** (que também alimenta o filtro **Sem Bíblia**) e o modal de detalhe/edição (`selectedRegistration`). Arquivo analisado: `src/components/AdminPanel.tsx` (linhas ~1180–1651 + `visibleData` em ~781, `STATUS_CONFIG` em ~582, `exportToCSV` em ~554).

> Observação: não uso emoji no código nem em labels fixas de UI; os marcadores deste documento são apenas estrutura editorial em PT-BR.

---

## 1. Filter chips (linha ~1203–1234)

**Obs 1 — Cinco cores concorrem pela mesma hierarquia visual.**
Os chips ativos usam branco, verde neon (`#00FF66`), ciano, roxo e âmbar, cada um com glow `shadow-[0_0_15px_...]`. Em "Todos" (branco) o usuário não percebe que existe um estado padrão — os outros chips parecem "ligados" mesmo quando inativos (opacity 0.7 com cor forte). O filtro "Sem Bíblia" em âmbar compete visualmente com "Aceitaram a Jesus".
**Fix:** tratar chips inativos como neutros (`text-gray-400`, ícone monocromático) e reservar a cor apenas para o estado ativo + um pequeno dot indicador de cor quando inativo. Considerar agrupar: "Status espiritual" (Aceitou / Conhecendo) vs "Interesse" (Atualizações) vs "Ação pastoral" (Sem Bíblia).

**Obs 2 — Chips não mostram contagem.**
O header (`sourceRows.length` na linha 1083) informa o total geral, mas nenhum chip mostra "Aceitaram a Jesus (47)". O usuário tem que clicar para descobrir o tamanho de cada bucket.
**Fix:** adicionar badge numérico em cada chip (`{count}`) calculado em memo sobre `sourceRows` — mesma fórmula do `visibleData.filter`.

**Obs 3 — Filtros são mutuamente exclusivos, mas parecem toggleáveis.**
Não há indicação de que clicar em outro chip substitui o filtro. Uso real comum: "aceitou Jesus **E** está sem Bíblia" — hoje impossível.
**Fix:** permitir multi-seleção (chip vira checkbox-like) ou deixar claro que é filtro único com label "Filtrar por:". Multi-seleção agrega muito valor aqui.

---

## 2. Lista / densidade de linha (linhas ~1255–1416)

**Obs 4 — Linha alta demais; baixa densidade.**
Cada card é `p-6 rounded-2xl` com avatar 48px, título `text-lg`, subtítulo em coluna, ficando ~96–120px de altura. Em 1080p cabem ~6 registros. Para uma aba de CRM com centenas de cadastros, isso obriga rolagem constante.
**Fix:** oferecer toggle "Confortável / Compacto" (linha 48–56px estilo tabela) e, em densidade compacta, colocar WhatsApp + badges na mesma linha do nome.

**Obs 5 — Badges podem empilhar até 4 na mesma linha.**
Um cadastro pode mostrar simultaneamente "Aceitou Jesus", "Conhecendo Jesus" (mutuamente exclusivos pela lógica, OK), "Sem Bíblia", "Tem pedido de oração" e o status CRM — resultando em flex-wrap e aumento de altura vertical.
**Fix:** consolidar em um bloco "tags" com ícones (sem texto quando espaço é crítico) e tooltip; o status CRM já é suficiente como "chip principal" à direita.

**Obs 6 — "Tem pedido de oração" é texto plano, não clicável.**
Linha 1320 mostra "• Tem pedido de oração" apenas como marcador. O usuário precisa abrir o modal para ler o pedido.
**Fix:** transformar em botão/link que expande inline ou abre o modal já ancorado na seção de oração; ou exibir preview truncado (`line-clamp-1`) já na listagem.

**Obs 7 — Data sem afordância de ordenação.**
`formatDate(item.created_at)` é exibida à direita sem nenhum cue de que a lista está ordenada por data. Na verdade, a lista é ordenada por `status` CRM (linha 803–804), não por data — comportamento inesperado dado que a query SQL (linha 200) busca `order('created_at', { ascending: false })`.
**Fix:** adicionar controle de ordenação explícito acima da lista ("Ordenar por: Mais recentes / Status / Nome") e mostrar seta/etiqueta do critério ativo. Corrigir a inconsistência entre a ordem da query e a reordenação no cliente.

---

## 3. Bulk actions

**Obs 8 — Não existem ações em massa.**
Não há checkbox na linha, nem seleção múltipla, nem "Selecionar todos os visíveis". Em fluxo real ("300 pessoas sem Bíblia" → quero marcar 50 como entregues OU atribuir responsável), o admin teria que clicar 50 modais.
**Fix:** adicionar coluna de checkbox e toolbar flutuante quando `selected > 0` com: Atribuir responsável, Mudar status, Marcar Bíblia entregue, Exportar seleção CSV, Deletar.

---

## 4. Busca (linhas 1087–1096)

**Obs 9 — Busca opaca em `Object.values(item)` (linha 793–795).**
Busca em todos os campos stringificados — incluindo `id` UUID, flags boolean, timestamps. Resultado: buscar "true" retorna todo mundo que aceitou Jesus; buscar um pedaço de UUID também casa.
**Fix:** limitar escopo a `name, whatsapp, email, city, neighborhood, prayer_request, admin_notes`. Dar feedback ("3 resultados") junto do campo. Adicionar debounce ~200ms (hoje é a cada keystroke e re-renderiza toda a lista com `motion.div layout`).

**Obs 10 — Sem "limpar busca" inline.**
O "Limpar busca" aparece apenas no empty state (linha 1251). Quando há resultados, o usuário tem que apagar o texto à mão.
**Fix:** X clicável dentro do input quando `searchTerm.length > 0`.

---

## 5. Exportar CSV (linha 1112–1117)

**Obs 11 — Botão verde igualmente proeminente a "Adicionar novo" nas outras abas.**
`bg-green-500 ... street-border` com label caps EXPORTAR CSV é tão forte quanto a CTA amarela de outras abas. Em Cadastros não há "Adicionar novo" (bem — são cadastros públicos), então o verde domina o header sem ter essa hierarquia.
**Fix:** transformar em botão secundário (outline/ghost com ícone `Download`) e adicionar submenu: "Exportar visíveis" vs "Exportar todos". Hoje exporta `data` inteiro, ignorando o filtro ativo — incoerente com o mental model do usuário que vê "Sem Bíblia".

**Obs 12 — CSV não respeita o filtro ativo nem a busca.**
`exportToCSV` opera sobre `data`, não sobre `visibleData`. Se o usuário filtra "Sem Bíblia" e clica Exportar, recebe o CSV com **todos** os cadastros.
**Fix:** trocar a fonte para `visibleData` (ou oferecer as duas opções explicitamente). Incluir as colunas do CRM: `status`, `owner`, `admin_notes`.

---

## 6. Status inline vs modal

**Obs 13 — Mudança de status só existe dentro do modal (linha 1506–1519) para Cadastros.**
Curiosamente, a aba Pipeline/CRM tem `<select>` inline (linha ~1023) para trocar status sem abrir modal. Na lista de Cadastros, o único caminho é clicar no ícone Info, abrir o modal, selecionar o chip, clicar SALVAR ACOMPANHAMENTO, fechar. 5 cliques para mudar de "novo" → "contatado".
**Fix:** expor o dropdown de status inline na linha (equivalente ao da Pipeline), ou menu de contexto "…" com ações rápidas (mudar status, atribuir). O modal continua válido para edição detalhada.

**Obs 14 — "Marcar Bíblia entregue" só aparece quando o filtro é `noBible` (linha 1371).**
Regra frágil. Se o admin está no filtro "Todos" e vê alguém sem Bíblia, precisa mudar de filtro para conseguir marcar. E uma vez marcado, o card desaparece da lista "Sem Bíblia" sem confirmação/undo.
**Fix:** mostrar o botão sempre que `hasNoBible(item)` for true, independente do filtro. Adicionar toast com "Desfazer" após 5s.

---

## 7. Modal de detalhe (linhas 1457–1650)

**Obs 15 — IA do modal: Acompanhamento (CRM) vem antes dos dados de contato.**
Ordem atual: header → bloco CRM (status/owner/notas + SALVAR) → grid de contato → oração. Em geral faz sentido (CRM é a ação principal), mas o botão de "SALVAR ACOMPANHAMENTO" (linha 1541) fica no meio do modal, obrigando scroll se o admin só queria confirmar o WhatsApp.
**Fix:** manter CRM no topo, mas colapsar "Dados de contato" em expansor ou trazer os 2 campos críticos (WhatsApp + Cidade) para um "resumo" ao lado do nome no header.

**Obs 16 — Copy de campo (isCopy) sem feedback visual (linha 1687–1699).**
`DetailItem` tem flag `isCopy` declarada mas o componente nunca implementa clique/cópia (não há `onClick`, `navigator.clipboard` etc.). É afordância prometida e não cumprida.
**Fix:** implementar cópia real com ícone `Copy` visível e feedback ("Copiado!"). Ou remover a prop enganosa.

**Obs 17 — Único CTA no rodapé é WhatsApp (linha 1640–1646).**
Não há "Ligar" (`tel:`), "E-mail" (`mailto:`), nem "Abrir no Pipeline", nem "Deletar deste contexto". O rodapé fixo seria ótimo para multi-ação.
**Fix:** rodapé com cluster: WhatsApp (principal), Ligar, E-mail, "Ver no pipeline", overflow menu com Deletar. Considerar gerar link WhatsApp com mensagem pré-preenchida usando um template editável por admin ("Olá {nome}, aqui é da equipe Salve…").

**Obs 18 — WhatsApp hardcoded `wa.me/55` (linhas 1394, 1641).**
Prefixo `55` forçado assume Brasil. Se um cadastro vier com DDI diferente (raro mas possível), o link gera número errado. Também: `whatsapp?.replace(/\D/g, '')` pode resultar em string vazia → link quebrado `https://wa.me/55`.
**Fix:** se já contém DDI (>11 dígitos), não prefixar; se vazio, desabilitar botão com tooltip "Sem número".

**Obs 19 — Feedback de save é transitório e fica no botão (linha 1551).**
`saveStatusMsg === 'ok'` muda o botão para verde com "✓ Salvo!", depois volta (imagino que por timer). Sem toast persistente, se o usuário olhou pra outro lugar, perdeu a confirmação. Erro vira "✕ Erro ao Salvar" sem detalhar o motivo.
**Fix:** toast de sistema (top-right) além da mudança do botão; em erro, mostrar mensagem real da API e manter form dirty para retry. Detectar estado "dirty" ao fechar o modal ("Você tem alterações não salvas — sair mesmo assim?").

**Obs 20 — Header do modal: título `text-5xl` é agressivo.**
Nome em `font-display text-5xl leading-none` ocupa metade do header. Nomes longos ("Maria Aparecida dos Santos Silva") quebram em 3 linhas no mobile.
**Fix:** `text-3xl md:text-4xl` com `break-words` e `max-w-full`; reservar `text-5xl` para dashboards/hero.

---

## 8. Delete (linhas 1423–1452)

**Obs 21 — Confirmação exige senha para não-admin (linha 1430–1440), mas o texto não explica o porquê.**
"Digite sua senha" sem contexto; usuário pensa que a sessão expirou.
**Fix:** copy: "Por segurança, confirme sua senha para excluir este cadastro." Mostrar o nome do item a ser deletado no modal ("Deletar **Maria Silva**?").

**Obs 22 — Delete não é acessível a partir do modal de detalhe.**
O ícone de lixeira só existe na linha (1408–1412). Se o admin abriu o modal e decidiu excluir, precisa fechar, encontrar a linha de novo, clicar no X.
**Fix:** overflow menu no header do modal com "Excluir cadastro".

**Obs 23 — Sem soft-delete / undo.**
Exclusão é permanente. Perder um cadastro de alguém que aceitou Jesus é particularmente grave nesse contexto.
**Fix:** `deleted_at` soft-delete + Lixeira recuperável por 30 dias, ou ao menos toast com "Desfazer" por alguns segundos.

---

## 9. Mobile

**Obs 24 — Card empilha verticalmente com 4 botões de ação em linha (linha 1339).**
`flex ... w-full md:w-auto justify-between md:justify-end` — em telas estreitas, o cluster de 3 botões (Bíblia opcional, Info, WhatsApp) fica apertado junto à data.
**Fix:** em mobile, transformar o card inteiro em tap-target que abre o modal, e deixar apenas WhatsApp como ação de atalho (mais usada); mover "Info" para o próprio card (swipe ou botão fantasma). Ou agrupar em menu "…".

**Obs 25 — Chips de filtro rolam horizontalmente sem indicação.**
`flex flex-wrap` em mobile empilha em 3 linhas, consumindo viewport antes da lista aparecer.
**Fix:** em mobile virar scroll horizontal (`overflow-x-auto`) com indicador de scroll, ou virar `<select>`/bottomsheet com os 5 filtros.

---

## 10. Empty states (linhas 1244–1253)

**Obs 26 — Empty state genérico não diferencia filtro vazio de base vazia.**
"Nenhum dado encontrado aqui." é o mesmo para "não há cadastros no sistema" e para "não há cadastros aceitaram Jesus ainda".
**Fix:** copy contextual por filtro: "Ninguém marcou 'Aceitou Jesus' ainda." + sugestão ("Ver todos os cadastros"). Ícone ilustrativo ajuda a suavizar.

---

## Top 3 Priority Fixes

1. **Mudança de status inline + ações em massa.** Hoje mudar status exige 5 cliques por registro; multiplicado por dezenas/centenas, é o maior custo operacional da tela. Adicionar `<select>` de status inline (como já existe na Pipeline, linha 1023) e checkbox de seleção múltipla com toolbar de bulk (Atribuir, Mudar status, Marcar Bíblia entregue, Exportar seleção).

2. **CSV respeitar filtro + busca, e chips com contagem.** Dois bugs de alinhamento entre mental model e comportamento real que corroem a confiança no painel: o CSV ignora o filtro ativo (exporta tudo), e os chips não mostram quantos há em cada bucket. Trocar `exportToCSV` para operar sobre `visibleData` e adicionar badge numérico nos chips (`Aceitaram a Jesus (47)`).

3. **Modal: feedback de save consistente, copy de contato funcional, e ações completas no rodapé.** A prop `isCopy` do `DetailItem` é uma promessa visual não implementada; o feedback de "salvo" fica só no próprio botão (fácil de perder); e o rodapé só oferece WhatsApp. Implementar cópia real com toast "Copiado!", adicionar toast global de save, e expandir o rodapé com Ligar, E-mail, overflow menu (Excluir, Ver no Pipeline). Detectar estado dirty ao fechar.
