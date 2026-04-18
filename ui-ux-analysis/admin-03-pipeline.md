# Análise UI/UX — Pipeline CRM (Acompanhamento de Discípulos)

Escopo: apenas a aba `crm_pipeline` do `AdminPanel.tsx` (linhas ~933–1043). 4 colunas kanban (Novo / Contatado / Em Acompanhamento / Concluído) com drag-and-drop, dropdown de status por card, busca global e modal de detalhe ao clicar no card.

---

## Observações e correções

1. **Densidade do card é baixa e inconsistente (obs).** Cada card tem `p-4 + space-y-3` e empilha: ícone grip + nome, badge "Aceitou Jesus", WhatsApp, cidade•bairro, data, "Acompanhando: X", badges, e ainda um `<select>`. Resulta em cards muito altos (>180 px) que limitam ver 3–4 cards por coluna em `max-h-[65vh]`.
   **Fix:** colapsar para 2 linhas de metadado (linha 1: WhatsApp + data compacta; linha 2: cidade • bairro). Reduzir `p-4` → `p-3`, `space-y-3` → `space-y-2`. Mover o dropdown para trás de um menu de ação (•••) revelado em hover/long-press. Meta: altura ≤ 120 px.

2. **Nome pode quebrar em muitas linhas (obs).** `break-words leading-snug` sem `line-clamp` faz nomes longos ocuparem 3+ linhas, empurrando o conteúdo e desalinhando cards.
   **Fix:** aplicar `line-clamp-2` no `<h5>` e mostrar nome completo via `title={item.name}` e no modal.

3. **`GripVertical` ao lado do nome confunde hierarquia (obs).** O ícone ocupa espaço ao lado do título e não é o affordance mais claro — o card inteiro já é `draggable`.
   **Fix:** mover o grip para a lateral esquerda do card (barra vertical de 4 px) ou para o canto superior-esquerdo em `opacity-40`, e deixar o nome começar na borda. Affordance fica óbvio sem roubar espaço do título.

4. **Dropdown de status dentro do card é redundante com o DnD e atrapalha o alvo de clique (obs).** O `<select>` no rodapé do card dispara `e.stopPropagation()` mas ainda é uma área de toque grande que compete com o clique no card. Usuário com dúvida muda status pelo select E pelo drag, duplicando o modelo mental.
   **Fix:** remover o `<select>` do card. Manter a mudança de estágio por drag (desktop) + botões "mover para →" no modal de detalhe. Em mobile, substituir drag por um menu "Mover para..." acessado via long-press ou ícone de chevron no card.

5. **DnD não tem alternativa mobile (obs).** `draggable` nativo de HTML5 não funciona em iOS/Android. Em telas estreitas o `overflow-x-auto` sugere kanban, mas o usuário mobile fica sem caminho para mover cards (a menos que descubra o `<select>` pequeno).
   **Fix:** detectar touch e expor um botão "Mover" no card que abre um bottom-sheet com as 4 etapas. Ou adotar `@dnd-kit/core` que suporta touch pointer events.

6. **Indicação visual de drag-over é sutil (obs).** `ring-1 ring-urban-yellow/60` + leve tint amarelo se confunde com o `ring-white/6` padrão em monitores escuros e para usuários com baixa sensibilidade a contraste.
   **Fix:** aumentar para `ring-2` + borda tracejada + placeholder "Soltar aqui" no topo da coluna durante arraste. Opcional: leve inset shadow amarela.

7. **Busca única, sem filtros de estágio ou dono (obs).** Só existe input de texto que casa nome/whatsapp/cidade/bairro/email. Não há filtro por "Acompanhando (owner)", "Sem Bíblia", "Aceitou Jesus", período.
   **Fix:** adicionar chips de filtro abaixo da busca: "Meus discípulos" (owner = usuário logado), "Sem Bíblia", "Aceitou Jesus", "Últimos 7 dias". Mesmos chips já existem na aba Registrations (linhas 1203–1234) — reaproveitar.

8. **Visibilidade do owner é fraca (obs).** "Acompanhando: Fulano" é mais uma linha de texto amarelo entre metadados. Em colunas densas perde-se quem está responsável por quê — principal pergunta de um kanban de discipulado.
   **Fix:** mostrar avatar (iniciais) de 20 px no canto superior direito do card; sem owner, mostrar chip vazio "Atribuir" clicável. No modal, campo dedicado. Isso também destravaria o filtro "Meus discípulos" do item 7.

9. **Contagem por coluna é o único total — falta total geral e SLAs (obs).** `cards.length` no header da coluna informa volume, mas não há total do funil, conversão Novo→Concluído, nem tempo parado em cada etapa.
   **Fix:** barra fina acima do kanban com: total elegíveis, % em cada etapa, idade média em "Em Acompanhamento". No card, badge discreta "7d parado" quando `updated_at` > X dias (requer campo).

10. **Largura fixa das colunas (`min(88vw,320px)`) em desktop desperdiça espaço (obs).** Em 1440 px só cabem 4 colunas de 320 px = 1280 px com gap, mas a classe `auto-cols-[min(88vw,320px)]` força 88 vw em mobile (bom) e 320 px fixo em desktop. Em 1920 px sobra muito vazio nos lados.
   **Fix:** usar `clamp(280px, 22vw, 360px)` para que colunas respirem em telas largas e ainda mostrem mais cards antes de rolar.

11. **Coluna ficando muito longa: scroll vertical interno conflita com drag (obs).** `max-h-[65vh] overflow-y-auto` na lista de cards: arrastar um card para o topo/fundo da coluna não auto-scrolla, e arrastar para outra coluna pode barrar no limite do scroll interno.
   **Fix:** implementar auto-scroll durante drag (detectar proximidade da borda) e subir o drop-target para o wrapper da coluna inteira (não só a área de cards), para que drop funcione mesmo quando a coluna está cheia.

12. **Scroll horizontal sem affordance (obs).** `overflow-x-auto scrollbar-hidden` esconde a barra; em mobile o usuário pode não perceber que há 4 colunas. Primeira coluna ocupa 88 vw e a próxima quase não aparece espiando na borda.
   **Fix:** reduzir `auto-cols-[min(88vw,320px)]` para `min(82vw,320px)` para sempre deixar ~15 vw da próxima coluna visível. Adicionar dots-indicator (● ○ ○ ○) ou setas sutis nas laterais em mobile.

13. **Transição card → modal é instantânea (obs).** Click no card chama `setSelectedRegistration(item)` e o modal aparece sem shared-element/fade, perdendo contexto espacial (qual card virou qual modal?).
   **Fix:** adicionar `layoutId={`card-${item.id}`}` com Framer Motion (já usado no arquivo) no card e no header do modal para fazer transição suave. Fallback: fade-in + scale de 0.96 → 1.

14. **Clique no card é o único gatilho de edição — não há atalhos (obs).** Para marcar "ligou hoje" ou adicionar nota, precisa abrir modal, editar, salvar. Fluxo demorado para updates curtos.
   **Fix:** ícone de lápis inline no card (aparecendo em hover) que abre quick-add de nota sem modal; Enter salva. Em mobile, um botão "+ nota" no card expandido.

15. **Badges são 3 estilos diferentes (obs).** "Aceitou Jesus" é `[10px] bg-[#00FF66]/10 border`, "Sem Bíblia" é `[10px] bg-amber-400/12 border`, "Atualizações" é `[10px] bg-purple-500/12` sem borda. Falta consistência.
   **Fix:** definir token `Badge` com variantes `success|warning|info` e aplicar. Remover "Atualizações" do card (informação fria para o pipeline) e mover para o modal; manter apenas "Aceitou Jesus" e "Sem Bíblia" que são acionáveis para discipulado.

16. **Empty state é genérico em todas as 4 colunas (obs).** Mesma frase "Nenhum cadastro nesta etapa." em todas. Perde oportunidade de orientar o próximo passo.
   **Fix:** copy contextual: Novo → "Ninguém aguardando. Novos cadastros aparecem aqui."; Contatado → "Arraste alguém de Novo após o primeiro contato."; Em Acompanhamento → "Puxe discípulos ativos para cá."; Concluído → "Celebre os formados aqui." Ícone sutil acima do texto.

17. **Busca filtra só dentro das 4 colunas elegíveis — sem feedback do resultado global (obs).** Se o usuário procura alguém que não aceitou Jesus nem está "conhecendo", o filtro retorna zero sem explicar que a pessoa existe mas não é elegível para o pipeline.
   **Fix:** quando `normalizedSearchTerm` não retorna nada, mostrar abaixo da busca: "Nenhum discípulo encontrado. X pessoas no cadastro geral correspondem à busca — ver em Cadastros." com link para `/admin` → Cadastros pré-filtrado.

18. **Contador da coluna não reage à busca de forma óbvia (obs).** Após digitar na busca, `cards.length` cai, mas não há total "2 de 17" para mostrar o contexto. Usuário pode achar que cards sumiram.
   **Fix:** badge da coluna virar `{filtered}/{total}` quando há busca ativa; restaurar para `{total}` quando limpa.

19. **Acessibilidade de teclado ausente (obs).** `draggable` HTML5 não é acessível por teclado; card é um `<div>` clicável sem `role="button"`, sem `tabIndex`, sem `onKeyDown` (Enter/Space).
   **Fix:** adicionar `role="button"`, `tabIndex={0}`, handler de Enter/Space abrindo o modal; atalhos `←/→` para mover entre estágios quando o card está focado. Garante conformidade WCAG 2.1 2.1.1.

20. **`cursor-grab`/`active:cursor-grabbing` em mobile é sem efeito (obs).** O estilo existe mas touch devices ignoram, reforçando a falta de DnD mobile (item 5).
   **Fix:** trocar por `md:cursor-grab` e, em mobile, usar ícone dedicated move no card (ver item 5).

---

## Top 3 correções prioritárias

1. **DnD acessível e mobile (itens 5, 11, 19, 20).** Adotar `@dnd-kit` com pointer sensor (touch + mouse + keyboard), auto-scroll, e teclado `←/→` para mover entre colunas. Sem isso, a aba é quebrada em mobile e inacessível — e mobile é onde o discipulador está.

2. **Redesign do card com hierarquia clara (itens 1, 2, 3, 4, 8, 15).** Altura ≤120 px, `line-clamp-2` no nome, avatar do owner no canto, badges padronizados (só "Aceitou Jesus" e "Sem Bíblia"), grip lateral, dropdown de status removido (substituído por DnD + ação no modal). Dobra a densidade visível por coluna e elimina o modelo mental duplicado.

3. **Filtros e totais do funil (itens 7, 9, 18).** Chips de filtro (Meus / Sem Bíblia / Aceitou Jesus / período) + barra de métricas (total, conversão, tempo médio por etapa) + contador `filtrados/total` por coluna. Transforma o kanban de lista visual em ferramenta de gestão real do discipulado.
