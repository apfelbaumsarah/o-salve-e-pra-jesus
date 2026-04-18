# Admin Panel — Orações, Voluntários e Configurações

Análise de UI/UX focada em três abas secundárias do `AdminPanel.tsx`. Fonte principal: `/Users/caioapfelbaum/Downloads/o-salve-e-pra-jesus-main/src/components/AdminPanel.tsx` (linhas 827–828 para sidebar, 1044–1075 para Settings, 249–280 e 490–546 para Orações, 646, 1321–1332, 1557 para Voluntários). Preview MCP não foi usado — análise feita direto no código.

**Acessibilidade na sidebar (linhas 820–829):** os botões ativos são Visão Geral, Pipeline CRM, Cadastros, Sem Bíblia, Orações e Voluntários. Banners, Lives, Eventos e Equipe estão comentados. **Configurações NÃO tem botão na sidebar** — a aba `settings` só é renderizada (linha 1044) se `activeTab === 'settings'`, mas nenhum `SidebarButton` chama `setActiveTab('settings')`. Na prática, a tela de Configurações está órfã: só é alcançável por código/console. Esse é o problema #1 antes de qualquer refinamento.

---

## Orações (`activeTab === 'prayers'`)

- **Clareza de propósito boa, mas o "quem pediu" se perde.** O card mostra o pedido entre aspas com borda azul (bom reforço visual, linha 1323–1326), porém usa `line-clamp-1` — pedidos longos são truncados sem expandir, e intercessor precisa abrir o modal (botão Info) para ler o texto completo. Para uma aba cuja razão de existir é LER o pedido, truncar em 1 linha é contra-produtivo.
- **Merge de duas fontes (registrations + prayer_requests) é invisível ao usuário.** A lógica em `loadTabData` (linhas 151–181) junta pedidos vindos do cadastro com pedidos avulsos, mas não há badge/filtro indicando origem. Um admin não consegue distinguir "pedido de quem se cadastrou" de "pedido anônimo" visualmente, e isso muda o tipo de follow-up possível (WhatsApp só funciona para `registrations`).
- **Toggle "prayer_done" tem bom affordance mas zero confirmação.** O botão verde com check (linhas 1357–1370) usa estados on/off claros e título "Reabrir"/"Marcar como Feito". Porém `togglePrayerStatus` (linha 542) atualiza direto sem toast/snackbar — o usuário só sabe que funcionou porque o card ganha opacidade 30% e strike-through. Em lista longa, fica difícil perceber o que mudou; falta um "Marcada como orada" efêmero.
- **Estado vazio genérico.** Quando não há orações cai no fallback "Nenhum dado encontrado aqui." (linha 1246). Para uma aba emocional como Orações, o empty state poderia ser acolhedor ("Todas as orações foram cobertas em oração 🙏" ou "Nenhum pedido de oração pendente").
- **Filtro por status "orada/pendente" inexistente.** A lista ordena com pendentes no topo (linhas 173–178), mas não há pílulas para filtrar "Pendentes | Oradas | Todas". Em volumes maiores isso vira rolagem infinita — os admins só querem ver as pendentes.

## Voluntários (`activeTab === 'volunteers'`)

- **Aba reusa o layout de "cadastros" sem adaptar a hierarquia.** O card mostra nome + WhatsApp + `• {city} (Idade: {age})` (linha 1321) e uma faixa amarela com `how_to_help.join(', ')` truncada em 1 linha (1328–1332). Perde-se a informação mais valiosa de um voluntário: **em que ele quer ajudar**. Deveria ser destaque visual, não rodapé truncado.
- **Não há toggle de "status do voluntário" / "ativo/inativo".** O briefing menciona "toggle volunteer status", mas no código não existe função equivalente a `togglePrayerStatus` para voluntários. O único status é o CRM compartilhado (`novo/contatado/acompanhamento/concluido`) via modal — não é um toggle rápido, e o vocabulário ("Contatado", "Concluído") é herdado do pipeline de discipulado e **não encaixa** em gestão de voluntários (onde faria mais sentido "Disponível / Escalado / Inativo").
- **Ausência de agrupamento/filtro por área de ajuda.** `how_to_help` é um array — seria trivial oferecer pílulas "Música | Logística | Oração" para filtrar. Sem isso, coordenador precisa abrir card por card para saber quem faz o quê.
- **Idade aparece entre parênteses no meio do subtítulo.** "• São Paulo (Idade: 34)" mistura dois atributos distintos em uma mesma linha. Idade merece slot próprio (ou ser omitida quando `N/A`, que é o fallback atual — hoje aparece "Idade: N/A" poluindo cards).
- **CTA de ação primária confuso.** As três ações no card (Info, WhatsApp, Lixeira) são iguais às de Cadastros, então o voluntário parece um "cadastro qualquer". Falta uma ação específica tipo "Escalar para evento" ou "Adicionar nota de voluntariado".

## Configurações (`activeTab === 'settings'`)

- **Crítico: a tela não tem entrada na navegação.** Como mencionado acima, todos os botões de sidebar que apontam para `settings` foram comentados. O form existe, mas nenhum usuário comum chega até ele — inclusive o admin principal. Isso anula qualquer análise de usabilidade até que se restaure um botão.
- **Sem agrupamento de campos relacionados.** Os 7 campos (site_name, logo, fonts URL, font family, Instagram, YouTube, donation image — linhas 1051–1071) estão todos em um grid 2-colunas sem seções. Deveriam existir grupos: **Identidade** (nome + logo), **Tipografia** (Google Fonts URL + font family), **Redes Sociais** (IG + YT), **Doação** (imagem). Hoje é um "form pile".
- **Feedback de salvar é `alert()` nativo.** `handleSaveSettings` (linha 392/395) usa `alert('Configurações salvas!')` / `alert('Erro ao salvar configurações.')`. Num painel que usa framer-motion e design customizado, o alert do browser quebra a consistência visual e trava a thread. Deveria ser toast inline com os mesmos padrões do CRM (`saveStatusMsg` já existe no resto do app).
- **Sem live-preview das mudanças visuais.** O usuário cola uma Google Fonts URL + nome de fonte e não vê NADA mudando até salvar e o site público recarregar. Logo tem preview (linha 1056 `<img>`), mas fonte, nome do site e redes sociais não têm. Um painel lateral "Prévia" renderizando um header fake com `font-family: {settings.font_family}` resolveria.
- **Upload de logo/doação sem validação nem progresso.** `handleFileChange` (linha 401) cria um `URL.createObjectURL` para preview (ok), mas não limita tamanho, tipo (só `accept="image/*"` no input) nem mostra progresso durante o upload para o Supabase Storage. Em conexões lentas com imagem grande, o botão só mostra spinner — sem %, sem nome do arquivo, sem cancelar.
- **`Google Fonts URL` + `Nome da Fonte (CSS)` são dois campos frágeis acoplados.** Se admin cola URL do Google Fonts mas erra o `font_family` (case-sensitive, espaço etc.), a tipografia quebra silenciosamente no site. Deveria haver (a) parser que extrai `family=...` da URL automaticamente, ou (b) dropdown com fontes populares, ou no mínimo (c) validação visível.
- **Mobile: grid 2-colunas vira 1 coluna corretamente, mas botão de salvar de 5rem com texto "SALVAR CONFIGURAÇÕES GERAIS" ocupa largura inteira e é o único CTA.** Aceitável, mas sem scroll-to-error se falhar — e como o feedback é `alert`, o usuário no mobile pode nem entender o que aconteceu.

---

## Top 3 correções prioritárias

1. **Restaurar acesso à aba Configurações.** Descomentar (ou recriar) o `SidebarButton` que aponta para `setActiveTab('settings')` — hoje a tela inteira está inacessível pela UI. Sem isso, tudo o mais em Configurações é letra morta.
2. **Trocar `alert()` por toast inline + adicionar live-preview em Configurações.** Reaproveitar o padrão `saveStatusMsg` já usado no CRM (linha 45) para feedback visual não-bloqueante, e renderizar um painel de preview mostrando nome do site + fonte aplicada em tempo real. Isso cobre feedback de salvar, consistência visual e validação implícita de fonts.
3. **Diferenciar Voluntários de Cadastros com status e filtro próprios.** Criar um status set específico para voluntários (ex: Disponível / Escalado / Inativo) com toggle rápido no card (análogo ao `togglePrayerStatus` de Orações), e promover `how_to_help` a destaque visual com pílulas de filtro por área. Hoje a aba é só um "cadastro colorido diferente" e não serve para coordenação real.
