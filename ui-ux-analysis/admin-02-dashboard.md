# Admin — Aba "Visão Geral" (Dashboard)

**Arquivo:** `/Users/caioapfelbaum/Downloads/o-salve-e-pra-jesus-main/src/components/AdminPanel.tsx` (linhas ~756–931)
**Rota:** `/admin` → "Visão Geral"
**Metodologia:** análise baseada somente em código-fonte (preview MCP foi negado).

> Observação de escopo: o briefing menciona "recent-registrations list", mas o markup atual do dashboard **não possui** lista de cadastros recentes — o painel contém apenas 2 cartões KPI e 3 gráficos de pizza (donut). A ausência dessa lista é tratada como achado (ver item #4).

---

## Achados (observação → correção)

1. **KPIs limitados a 2 números — baixa densidade estratégica.**
   - *Obs:* O painel mostra apenas `Total de Cadastros` e `Aceitaram a Jesus`. Métricas já computadas em memória (`frequentamIgreja`, `naoFrequentamIgreja`, `temBiblia`, `naoTemBiblia`, `aindaConhecendo`, `jaCaminha`) não viram KPI; só aparecem dentro dos donuts.
   - *Fix:* Expor 4–6 KPI cards em grid `grid-cols-2 md:grid-cols-3 xl:grid-cols-6` incluindo % de conversão (`aceitaramJesus/total`), "Sem Bíblia", "Não Frequenta Igreja" e "Novos nos últimos 7 dias".

2. **KPI sem delta temporal nem taxa.**
   - *Obs:* `<p className="text-5xl ...">{totalCadastros}</p>` mostra valor absoluto sem comparar a período anterior e sem mostrar %.
   - *Fix:* Adicionar linha secundária: `+12 (7d) · ▲ 8%` com ícone trending e texto `text-xs text-gray-400`. Calcular com `created_at` dos últimos 7/30 dias.

3. **Ausência total de seletor de período (time range).**
   - *Obs:* Nenhum controle de data; o dashboard mostra sempre o acumulado total desde o início. `data` é consumido integralmente em linha 756.
   - *Fix:* Barra superior com segmented control "7d · 30d · 90d · Tudo · Personalizado" controlando `useMemo` que filtra `data` por `created_at` antes de calcular KPIs e séries dos gráficos.

4. **Falta lista de cadastros recentes (quick-glance).**
   - *Obs:* Admin precisa clicar em "Cadastros" ou "CRM" para ver quem entrou hoje — rotina diária perde contexto.
   - *Fix:* Card "Últimos 10 cadastros" abaixo dos gráficos com nome, cidade, timestamp relativo ("há 3h") e badge "Aceitou Jesus", linkando para a linha na aba Cadastros.

5. **Donuts usam cinza `#333333` como cor semântica de "negativo" — contraste ruim no fundo escuro.**
   - *Obs:* `dataIgreja` e `dataBiblia` usam `#333333` para "Não Frequenta" e "Tem Bíblia" (inversão confusa); essa cor mal se distingue do background `bg-urban-gray`. Em `dataBiblia` a ordem está invertida (destaque vai para "Não Tem" em roxo, "Tem" fica em cinza) — decisão consciente mas não comunicada.
   - *Fix:* Subir contraste para cinza `#6B7280` (gray-500) ou usar uma cor semântica (vermelho suave `#EF4444/80` para faltas). Documentar com subtítulo "Destaque: quem ainda precisa receber" para explicar a inversão de `dataBiblia`.

6. **Legenda truncada e duplicada — rótulo carrega a contagem entre parênteses.**
   - *Obs:* `name: \`Aceitaram (${aceitaramJesus})\`` injeta o número no label. O tooltip mostra "Aceitaram (42): 42" — redundante. Em mobile, strings longas tipo "Já Cristão/Outros (12)" quebram a legenda.
   - *Fix:* Manter `name` limpo ("Aceitaram") e renderizar valor via `<Legend formatter>` ou label custom no Pie. Tooltip usa `value` nativo.

7. **Donuts sem valor central — desperdício do `innerRadius={65}`.**
   - *Obs:* O miolo do donut está vazio; admin precisa passar mouse sobre cada fatia para ler números.
   - *Fix:* Renderizar `<text>` SVG centralizado com o total e o % da fatia "hero" (ex.: `72%\nAceitaram`). Recharts: `<Label position="center" content={...}/>`.

8. **Anel de apenas 5px (`innerRadius=65, outerRadius=70`) — difícil de enxergar e de clicar nas fatias.**
   - *Obs:* `paddingAngle={8}` + `cornerRadius={40}` em um anel de 5px gera segmentos quase puntiformes; os `drop-shadow` acabam dominando visualmente.
   - *Fix:* `innerRadius={55}, outerRadius={85}` (anel de 30px), reduzir `paddingAngle` para 2–4. Manter glow apenas no hover.

9. **Drill-down existe, mas é invisível.**
   - *Obs:* Os cards e donuts são clicáveis (`onClick={() => { setActiveTab('registrations'); setFilterRegistrations(...); }}`) — excelente. Porém não há `cursor-pointer` explícito no título, nem ícone de "ver detalhes", nem `aria-label`. Usuário descobre por acidente.
   - *Fix:* Adicionar ícone `<ArrowUpRight size={14}/>` no canto superior-direito de cada card, `title="Ver cadastros filtrados"` e `role="button" tabIndex={0}` com handler de `onKeyDown` (Enter/Space) para acessibilidade.

10. **Estado vazio inexistente — gráficos quebram visualmente com `data=[]`.**
    - *Obs:* Se `totalCadastros === 0`, os donuts renderizam um anel vazio sem mensagem; cards KPI mostram "0" gigante sem contexto.
    - *Fix:* Guardar com `totalCadastros === 0 ? <EmptyState/> : <Charts/>`. EmptyState com ilustração, "Nenhum cadastro ainda" e CTA "Compartilhar link de cadastro".

11. **Loading state centralizado mas sem skeleton.**
    - *Obs:* `isTabLoading` renderiza apenas um `<Loader2>` central (linha 852–854); perde-se a estrutura espacial e há layout shift quando os dados carregam.
    - *Fix:* Skeleton com 2 cards KPI shimmer e 3 círculos skeleton nos slots dos donuts (mesmo `h-56` e grid) — zero layout shift.

12. **Mobile: KPIs viram 1 coluna, mas texto `text-5xl` + padding 6 ocupa tela inteira.**
    - *Obs:* `grid-cols-1 md:grid-cols-2` e `text-5xl` fazem cada card tomar ~40% da viewport em 375px; rolagem fica longa só para ver 2 números.
    - *Fix:* Em mobile reduzir para `text-3xl`, padding `p-4`, e manter 2 colunas com `grid-cols-2` (números curtos cabem). Gráficos podem virar carousel horizontal com `snap-x` em vez de stack vertical.

13. **Títulos dos gráficos com `opacity-70` + `tracking-widest uppercase` — legibilidade baixa.**
    - *Obs:* `text-white ... opacity-70 tracking-widest uppercase` no título do card do gráfico (ex.: "DECISÃO POR CRISTO") sacrifica legibilidade por estética; contrast ratio cai a ~3:1.
    - *Fix:* Remover `opacity-70`, reduzir tracking para `tracking-wide`, adicionar subtítulo `text-xs text-gray-400` explicando a métrica (ex.: "distribuição total de respostas").

14. **Hover `hover:scale-[1.05]` nos KPIs é excessivo para card full-width.**
    - *Obs:* Escalar 5% um card largo causa reflow percebido nos vizinhos e desalinha visualmente; em mobile é especialmente agressivo.
    - *Fix:* Usar `hover:scale-[1.01]` + `hover:border-urban-yellow/60` para feedback sutil; reservar escalas maiores para elementos pequenos.

15. **Sem export / sem ação em lote a partir do dashboard.**
    - *Obs:* Admin que identifica "120 sem Bíblia" no gráfico precisa ir até Cadastros, refiltrar e exportar lá. Nenhum CTA de exportar CSV / enviar WhatsApp em massa parte do dashboard.
    - *Fix:* Em cada card de gráfico, menu `⋯` com "Exportar subgrupo (CSV)" e "Abrir em CRM com filtro". Aproveita que o filtro já é aplicado no clique.

16. **Três gráficos idênticos — falta hierarquia visual.**
    - *Obs:* `grid-cols-1 md:grid-cols-2 xl:grid-cols-3` distribui peso igual entre "Decisão por Cristo" (métrica-chave da missão) e "Tem Bíblia?" (operacional).
    - *Fix:* Destacar "Decisão por Cristo" como card hero (span 2) com valor central grande + trend, e deixar "Igreja" e "Bíblia" como cards compactos ao lado.

17. **Legendas do Recharts em mobile podem passar por cima dos dados.**
    - *Obs:* `wrapperStyle={{ paddingTop: '10px' }}` + altura fixa `h-56` — em 375px as 3 legendas de `dataJesus` embrulham em 2 linhas e a pizza fica espremida.
    - *Fix:* Em breakpoint mobile aumentar o container para `h-72` quando `<Legend>` quebra, ou esconder Legend e renderizar lista custom abaixo do gráfico com cor + label + valor alinhados.

---

## Top 3 prioridades

1. **Adicionar seletor de período (7d/30d/90d/Tudo).** É o calcanhar-de-aquiles do painel: hoje nenhum número responde "como foi esta semana?". Baixo esforço (um `useMemo` filtrando por `created_at`), altíssimo ganho de utilidade.
2. **Enriquecer KPIs — 4 a 6 cards com valor + delta + %.** Aproveita variáveis já computadas (`frequentamIgreja`, `temBiblia`, `aindaConhecendo`) e introduz taxa de conversão (aceitaram/total), que é a métrica-norte da missão. Inclui delta semanal e ícone de trend.
3. **Corrigir os donuts: anel espesso + valor no centro + cores semânticas legíveis.** Substituir `#333333` por cinza claro/cor semântica, aumentar o anel para 30px, renderizar número central (hero metric por gráfico) e limpar a string de `name` duplicando valor. Resolve 5 dos 17 achados de uma vez.
