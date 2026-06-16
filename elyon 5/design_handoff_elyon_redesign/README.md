# Handoff: Elyon Nous — Redesign do Frontend (light "terminal de dados premium")

## Visão geral
Este pacote contém o **redesign completo do frontend do Elyon Nous** — plataforma de inteligência
de marketing/tráfego pago com IA para gestores e agências. O redesign tem três objetivos:

1. **Trocar a identidade visual** do tema escuro atual (navy `#080D1A` + roxo `#7C3AED`) por um
   tema **light, editorial, "terminal de dados premium"** — sem roxo, com acentos **azul + verde**.
2. **Enxugar a navegação** de ~15 abas para **6 áreas por objetivo** + sistema.
3. Reforçar que é uma plataforma que **toma decisão baseada em dados, marketing e ciência de dados**,
   com a IA (NOUS) como **copiloto sempre presente**, e criar uma **home diária que vicia**.

---

## Sobre os arquivos deste pacote
Os arquivos em `prototype/` são **referências de design feitas em HTML + React (via Babel)** — protótipos
que mostram o visual e o comportamento pretendidos. **Não são código de produção para copiar e colar.**

A tarefa é **recriar estes designs no codebase real do Elyon** (Next.js + React + Tailwind, componentes
`.tsx` em `components/dashboard/`), usando os padrões e bibliotecas que vocês já têm. O protótipo usa
estilos inline e SVG puro só porque é um arquivo standalone; no app real devem virar componentes Tailwind
+ a lib de gráficos de vocês (Recharts/visx/etc.).

Para rodar o protótipo localmente: abra `prototype/index.html` em um servidor estático (ex.: `npx serve prototype`)
ou qualquer http-server. Ele começa na tela de **Login** → **Onboarding** → **Dashboard**. O estado
(tela/aba/modo) persiste em `localStorage` sob a chave `elyon_nous_state_v2`.

## Fidelidade
**Alta fidelidade (hifi).** Cores, tipografia, espaçamento, raios, sombras e interações são finais.
Recrie a UI pixel-a-pixel usando as libs/padrões do codebase. As animações de entrada são um "nice-to-have"
(respeitam `prefers-reduced-motion`).

---

## Design Tokens

Todos os tokens estão em `prototype/app.css` (bloco `:root`). Migre para CSS variables no `globals.css`
e/ou para o `theme.extend` do `tailwind.config`.

### Cores — superfícies
| Token | Hex | Uso |
|---|---|---|
| `--canvas` | `#F4F5F7` | fundo do app (off-white cool) |
| `--canvas-2` | `#EEF0F3` | poços recuados, trilhas de barra |
| `--paper` | `#FFFFFF` | cards |
| `--paper-2` | `#FBFCFD` | variação sutil de card |

### Cores — texto (ink)
| Token | Hex | Uso |
|---|---|---|
| `--ink` | `#161B26` | texto primário |
| `--ink-2` | `#5A6473` | secundário |
| `--ink-3` | `#8A93A3` | terciário / legendas |
| `--ink-4` | `#AAB2BF` | esmaecido |

### Cores — linhas
| Token | Hex |
|---|---|
| `--line` | `#E6E8EC` (borda hairline padrão) |
| `--line-2` | `#EEF0F3` (divisória fraca) |
| `--line-strong` | `#D7DAE0` |

### Cores — acentos (SEM ROXO)
| Token | Hex | Uso |
|---|---|---|
| `--blue` | `#2C5FE0` | ação primária / dado primário |
| `--blue-600` | `#1E4FD0` | hover |
| `--blue-soft` | `#EAF0FE` | tint de fundo |
| `--blue-line` | `#CBDBFB` | borda de tint |
| `--green` | `#0E9E6E` | positivo / crescimento |
| `--green-600` | `#0B855D` | hover |
| `--green-soft` | `#E4F6EE` | tint |
| `--green-line` | `#BBE7D3` | borda de tint |

### Cores — status
`--red #E1483F` (+ `--red-soft #FCEBEA`) · `--amber #E08B0B` (+ `--amber-soft #FCF1DC`) ·
`--teal #0E9CB0` · `--slate #64748B`

### Cores — paleta categórica de gráficos (data-viz)
`--dv-1 #2C5FE0` (azul) · `--dv-2 #0E9E6E` (verde) · `--dv-3 #0E9CB0` (teal) ·
`--dv-4 #E08B0B` (âmbar) · `--dv-5 #E1483F` (vermelho) · `--dv-6 #64748B` (slate).
Use nessa ordem para séries categóricas.

### Raios (border-radius)
`--r-xs 6px` · `--r-sm 9px` · `--r-md 13px` · `--r-lg 18px` · `--r-xl 24px` · `--r-pill 999px`.
Cards usam `--r-md`; pílulas/badges `--r-pill`; botões `--r-sm`.

### Sombras
- `--sh-1` (card em repouso): `0 1px 2px rgba(20,28,46,.04), 0 1px 3px rgba(20,28,46,.05)`
- `--sh-2` (card hover): `0 2px 6px rgba(20,28,46,.05), 0 6px 18px rgba(20,28,46,.06)`
- `--sh-3` (destaque/popover): `0 8px 24px rgba(20,28,46,.10), 0 24px 56px rgba(20,28,46,.10)`
- `--sh-pop`: `0 12px 40px rgba(20,28,46,.16)`

### Espaçamento
Sem escala de tokens nomeada — usar grid de **4px**. Valores recorrentes: gaps de cards **16px**;
padding de card **18px** (compacto **14–15px**); gaps internos **9–12px**; gutter da `<main>` **22–26px**.

### Tipografia
- **Sans (UI/títulos):** `"Schibsted Grotesk"`, fallback `system-ui, -apple-system, sans-serif`.
- **Mono (números/dados/eyebrows):** `"JetBrains Mono"`, fallback `ui-monospace, "SF Mono", monospace`.
  **Sempre** com `font-variant-numeric: tabular-nums` em números (alinhamento de colunas).
- Ambas carregadas via Google Fonts (`<link>` no `index.html`).

Escala usada:
| Papel | Tamanho / peso | Notas |
|---|---|---|
| Número grande (KPI hero) | 26–30px / 700 | mono, `letter-spacing: -.02em` |
| H1 de tela | 23px / 700 | sans, `-.02em` |
| Título de card / SectionHead | 15px / 600 | sans, `-.01em` |
| Corpo | 13–14px / 400–500 | |
| `.eyebrow` (rótulo) | 10.5px / 500 | **mono, UPPERCASE, `letter-spacing:.14em`, cor `--ink-3`** |
| Legendas | 11–12px | `--ink-3` |

---

## Arquitetura de navegação (a mudança estrutural)

De ~15 abas para **6 áreas + 2 de sistema**. Mapa de consolidação (abas antigas → nova área):

| Nova área | Ícone | Absorve do app atual |
|---|---|---|
| **Hoje** | home | Visão Geral + Pulse do dia + Insights da IA |
| **Desempenho** | chart | Resultados/Performance + Campanhas (Meta/Google) + Audiências + Mix de Canais + Funil + Criativos — em **sub-abas** |
| **Diagnóstico** | pulse | Análise Profunda (auditoria) + Saúde do Negócio + causas-raiz + SWOT |
| **Mercado** | globe | Concorrentes + benchmarks + Share of Voice + oportunidades |
| **Plano de Ação** | check | Estratégia + Ações Prioritárias + Projeções + Painel Financeiro |
| **Relatórios** | doc | Relatórios + Portal (compartilhamento) + Export PDF |
| *(sistema)* **Integrações** | plug | Conexões (OAuth Meta/Google) |
| *(sistema)* **Configurações** | gear | Perfil + Preferências do NOUS + Plano + Memória |

O **NOUS** deixa de ser uma aba e vira **copiloto fixo** (rail à direita em telas largas ≥1280px,
drawer com backdrop em telas estreitas, orb flutuante quando recolhido).

A tela **Planos** não fica na sidebar (princípio "menos abas") — é acessível pelo card "Plano" em Configurações.

---

## Telas / Views

> Layout global: **Sidebar** (esq, 232px / 66px colapsada) · coluna central com **Topbar** (64px, sticky,
> fundo `rgba(255,255,255,.8)` + `backdrop-filter: blur(12px)`) e `<main>` rolável (max-width do conteúdo **1240px**) ·
> **NOUS rail** (dir, 340px) quando docked. Arquivo: `prototype/app.jsx` + `prototype/shell.jsx`.

### 1. Login — `screens-auth.jsx` › `Login`
- **Propósito:** entrada. Dois CTAs: "Entrar no painel" (→ app) e "Criar conta / Configurar" (→ onboarding).
- **Layout:** grid 2 colunas `1.15fr / 1fr`. Esquerda = painel de marca com gradientes radiais sutis
  (`--blue-soft` no topo-esq, `--green-soft` na base-dir), orb do NOUS, headline 40px/700 ("A inteligência
  que **decide** com seus dados." — "decide" em `--blue`), 3 selos de feature, e 2 **FloatChips** de métrica
  (ROAS 3,2x, Receita 7d) com sparkline. Direita = formulário (e-mail, senha, manter conectado, esqueci a senha).
- **Componentes:** `Field` + `Input` (com ícone), `Button` (primary lg full / ghost lg full), `Logo`, `NousOrb`.

### 2. Onboarding — `screens-auth.jsx` › `Onboarding`
- **Propósito:** configurar conta. **4 passos** com stepper no topo: **Canais → Negócio → Meta → Pronto**.
  - **Canais:** grid 2×2 de cards selecionáveis (Meta/Google/TikTok/LinkedIn) com `ChannelMark`, estado
    conectado (borda `--blue` + glow `--blue-soft` + check).
  - **Negócio:** nome (Input) + chips de nicho selecionáveis (pílulas).
  - **Meta:** 3 cards-objetivo (Escalar / Reduzir CPA / Começar do zero) com ícone.
  - **Pronto:** orb "pensando" + `ProgressBar` animada 0→100% com 4 marcos (Conectando/Lendo dados/Benchmarks/Pronto);
    ao chegar a 100% chama `onDone()` automaticamente.
- **⚠️ Gap RESOLVIDO:** a tela 0 do onboarding tem o **fork inicial "Você já anuncia hoje?"** com fast-lane (já anuncio:
  nome+nicho → conectar Meta → auditoria automática) vs. iniciante (wizard guiado de 7 passos). **Implementado.**

### 3. Hoje (home diária) — `screens-hoje.jsx` › `Hoje`
- **Propósito:** o "voltar todo dia". É a tela mais importante.
- **Layout (de cima p/ baixo):**
  1. **Saudação** ("Bom dia, {nome}") + data + **Streak** (chip âmbar "12 dias seguidos", ícone fogo).
  2. **BriefingHero** — card com gradiente `--blue-soft → --green-soft`, orb, eyebrow "Briefing do NOUS · hoje",
     headline + parágrafo-resumo, CTAs ("Ver meu plano de hoje", "Perguntar ao NOUS"). No modo **Avançado**,
     rodapé com 3 **ChangeChips** ("o que mudou": ROAS subiu / CPA em alta / criativos em fadiga).
  3. **Faixa de KPIs** — `StatCard` em grid fluido (`auto-fit, minmax(150px,1fr)`). Simplificado = 4 KPIs; Avançado = 6.
  4. **Grid principal** (`1fr / 1.35fr`, empilha <920px): esq = **HealthCard** + **Goals**; dir = **PriorityActions** + **AlertsList**.
- **HealthCard:** `Gauge` radial (score 0–100, cor verde/âmbar/vermelho por faixa) + sparkline de 7 dias +
  barras de pilares (Aquisição/Conversão/Retenção/Eficiência/Criativos/Dados&IA). Delta em "pts".
- **PriorityActions:** lista rankeada; cada item = rank, título, urgência (badge), "porquê", **impacto em R$**
  (verde, mono, grande), pontos de esforço (1–3), botão "Ver". Header mostra **ganho potencial somado**.
- **Goals:** 3 metas com `ProgressBar` + % (gamificação leve).
- **AlertsList:** 3 alertas proativos coloridos por tom (bad/warn/good) com ícone, título, corpo.

### 4. Desempenho — `screens-desempenho.jsx` › `Desempenho`
Container com **SubTabs**: Visão geral · Campanhas · Canais · Criativos · Funil.
- **Visão geral:** faixa de 6 KPIs · LineChart área (Receita × Investimento) · Donut de distribuição por canal · Bars de ROAS por canal.
- **Campanhas:** 4 KPIs + **DataTable** (campanha c/ `ChannelMark`, investimento, receita, conv., ROAS colorido, CPA, CTR, `StatusBadge`). Ações: Filtros, Exportar.
- **Canais:** grid de cards por canal (investido, ROAS, CPA) + Bars de conversões + Donut de atribuição.
- **Criativos:** grid de cards (placeholder de criativo listrado, badge de fadiga, hook, CTR, ROAS) + **curva de fadiga** (LineChart vermelho) + performance por formato (Donut). CTA "Gerar variações".
  - **⚠️ Gap RESOLVIDO:** clique numa linha da tabela para o **drill-down** — ROAS por objetivo, **fase de aprendizado**, ad sets, geografia, posicionamentos e pixel. Novas sub-abas **Audiências** e **Alocador de Verba (IA)**.
- **Funil:** componente **Funnel** (5 etapas) + DataTable por etapa (usuários, %, queda) + **card de insight do NOUS** (maior gargalo + impacto R$).

### 5. Diagnóstico — `screens-misc.jsx` › `Diagnostico`
- **NousBanner** (hipótese da IA, gradiente azul→verde, CTA "Ver plano recomendado").
- **Radar** de maturidade por pilar (você vs. benchmark do setor, linha tracejada).
- **Gauge** de saúde geral + card "Maior gargalo" (conv. atual vs. setor + impacto R$ em vermelho).
- **Causas-raiz** (lista com severidade alta/média).
- **SWOT** em grid 2×2 colorido (Forças/Fraquezas/Oportunidades/Ameaças).
  - **⚠️ Gap RESOLVIDO** como sub-aba **Auditoria profunda**: **11 dimensões**, nota, desperdício de verba, checklist de tracking, **segunda opinião (Gemini)** e evolução vs. auditorias anteriores.

### 6. Mercado — `screens-misc.jsx` › `Mercado`
- 3 cards de topo: Demanda do mercado (índice + sparkline) + 2 benchmarks (você × mercado, delta).
- **Share of Voice** (barras horizontais por concorrente, sua empresa destacada em azul + badge "Você").
- **Oportunidades** (segmentos com % de crescimento, CPL estimado, facilidade de entrada).

### 7. Plano de Ação — `screens-misc.jsx` › `PlanoAcao`
- 4 KPIs de topo (planejadas / em andamento / concluídas / impacto total R$).
- **Modo Simplificado:** checklist marcável (checkbox → risca + esmaece).
- **Modo Avançado:** **Kanban** 3 colunas (Planejado / Em andamento / Concluído) + **Matriz impacto × esforço**
  (scatter SVG, quadrante "ganhos rápidos") + **Roadmap 90 dias** (barras Gantt-like JUN/JUL/AGO).
  - **⚠️ Gap RESOLVIDO** como sub-aba **Estratégia 90 dias**: tese, **matriz Escalar/Corrigir/Testar/Cortar**, **bloco Persona** (idade/gênero/renda/regiões/interesses), ranking de canais e plano **7/30/90**.

### 8. Relatórios — `screens-misc.jsx` › `Relatorios`
- NousBanner (resumo sugerido) · LineChart Receita × Investimento · lista de exportações (PDF/Excel/Slides/Agendar) · grid de modelos de relatório.
  - **⚠️ Gap RESOLVIDO:** **Portal do cliente** ao final — link compartilhável + seções visíveis (toggles).

### 9. Integrações — `screens-misc.jsx` › `Integracoes`
- 3 KPIs (conectadas/saudáveis/atenção) + DataTable de plataformas (status, saúde, última sincronização). CTA "Conectar nova".

### 10. Configurações — `screens-misc.jsx` › `Config`
- Card Workspace (nome/segmento/setor/fuso/moeda) · Preferências do NOUS (toggles) · Card Plano (Enterprise R$2.997, CTA "Ver planos" → tela Planos).
  - **⚠️ Gap RESOLVIDO:** **Memória viva (RAG)** ao final de Configurações; **créditos de IA** no topbar; seletor **multi-cliente** na sidebar.

### 11. Planos — `screens-planos.jsx` › `Planos`
- **JourneyStepper** (Diagnóstico → Acompanhamento → Operação) + toggle Mensal/Anual(−20%).
- NousBanner de recomendação + **4 PlanCards**: Diagnóstico (Grátis), Plataforma (R$297), **Agency (R$997, destacado "Recomendado para agências")**, Enterprise (R$2.997, "Seu plano"). Recriação em tema light do print fornecido.

### NOUS rail (copiloto) — `nous.jsx` › `NousRail`
- **Header:** orb + "NOUS · online" + tabs **Insights / Perguntas**.
- **Insights:** card "Briefing de hoje" + lista de InsightCards.
- **Perguntas:** chat (bolhas usuário/NOUS, indicador de digitação) + chips de sugestões + input com botão enviar.
- **Estados:** docked (≥1280px) / drawer com backdrop (estreito) / orb flutuante (recolhido).
- As respostas do chat são **mock por palavra-chave** (`pick()` em `NousRail`) — no app real, plugar no endpoint do Claude.

---

## Componentes reutilizáveis (mapa)
| Componente | Arquivo | O que é |
|---|---|---|
| `Icon` | `ui.jsx` | ícones SVG stroke (currentColor), dicionário `ICONS` |
| `ChannelMark` | `ui.jsx` | marca quadrada do canal (Meta/Google/TikTok/LinkedIn) |
| `Card` | `ui.jsx` | superfície branca, borda hairline, hover eleva |
| `SectionHead` | `ui.jsx` | título + sub + ícone + slot à direita |
| `Delta` | `ui.jsx` | chip ↑/↓ % colorido por sentido (`good: up/down/neutral`) |
| `Badge` | `ui.jsx` | pílula tonal (good/bad/warn/blue/neutral) com dot opcional |
| `Button` | `ui.jsx` | primary/green/soft/ghost/dark · sm/md/lg · ícone esq/dir |
| `Avatar`, `Segmented`, `StatCard`, `Field`, `Input` | `ui.jsx` | — |
| `ToastProvider` (`window.toast({tone,title,body})`) | `polish.jsx` | feedback global de ações |
| `Modal`, `DropdownMenu`, `MenuItem`, `MenuLabel`, `MenuDivider` | `polish.jsx` | sistema de overlays |
| `PeriodPicker`, `NotificationsPanel`, `EmptyState` | `polish.jsx` | controles da topbar + estado vazio |
| `SourceBadge` | `ui.jsx` | badge de origem do dado (Dados reais / Estimativa / Fallback IA) |
| `ClientSwitcher`, `CreditsPill` | `shell.jsx` | seletor multi-cliente + saldo de créditos de IA |
| `Audiencias`, `AlocadorIA`, `CampanhaDetalhe` | `screens-extra.jsx` | públicos, alocador IA, drill-down de campanha |
| `AuditBlock`, `EstrategiaBlock`, `MemoriaBlock`, `PortalBlock` | `screens-extra.jsx` | auditoria 11D, estratégia 90d, memória RAG, portal |
| `Sparkline`, `LineChart`, `Donut`, `Funnel`, `Bars`, `Gauge`, `Radar`, `ProgressBar` | `charts.jsx` | gráficos SVG, responsivos via `useWidth()` |
| `NousOrb`, `NousRail`, `InsightCard` | `nous.jsx` | marca animada + copiloto |
| `Logo`, `Sidebar`, `Topbar` | `shell.jsx` | shell |

> No app real, substitua os gráficos SVG caseiros pela lib de vocês (Recharts/visx) — **mantendo a paleta
> `--dv-*`, os eixos finos `--line`, labels mono `--ink-3` e tooltips em `--paper`**. O importante é o *estilo*, não a implementação.

---

## Interações & comportamento
- **Navegação:** clique na sidebar troca `area`; `<main>` faz scroll suave ao topo. Sub-abas trocam view com fade.
- **Modo Simplificada × Avançada:** `Segmented` na topbar. Afeta **densidade** (nº de KPIs, pilares mostrados),
  **linguagem** (ex.: "O que fazer agora" vs. "Ações prioritárias") e **layout** (Plano = checklist vs. kanban).
- **NOUS:** abre/fecha; em telas estreitas vira drawer (backdrop fecha ao clicar). Chat com delay de "digitando" ~1,1s.
- **Animações:** entrada `fadeUp/fadeIn/scaleIn/slideIn` com delays escalonados (`.d1`–`.d8`); gráficos animam o traçado
  (`drawLine`) e o preenchimento; **tudo dentro de `@media (prefers-reduced-motion: no-preference)` na prática** —
  respeite reduced-motion (já há um reset no CSS).
- **Hover:** cards elevam (`--sh-1`→`--sh-2`, translateY -1px); linhas de tabela ganham fundo `--canvas`; botões escurecem.
- **Responsivo:** classes `.split`, `.split-wide`, `.split-narrow`, `.cols-3`, `.auto-kpi`, `.auto-cards`
  colapsam para 1 coluna <920px; controles secundários da topbar (`.tb-md`) somem <1120px; NOUS vira drawer <1280px.

## State management
Estado no protótipo é local (`useState`) + persistência em `localStorage` (`elyon_nous_state_v2`):
`{ screen, area, mode, collapsed, nousOpen }`. No app real:
- `screen`/`area` → rotas Next.js (App Router): `/hoje`, `/desempenho`, `/diagnostico`, `/mercado`, `/plano`, `/relatorios`, `/integracoes`, `/config`, `/planos`.
- `mode` (simple/pro) → preferência do usuário (Supabase/Clerk metadata).
- Dados → todos os números vêm de `prototype/data.js` (`window.DATA`) **apenas como mock**; substituir pelos dados reais
  das contas conectadas. A forma de `DATA` (kpis, health.pillars, channelMix, funnel, actions, alerts, goals, campaigns,
  creatives, diagnosis, market, plans) serve como **contrato de dados sugerido** para os componentes.

---

## Padrões de UX do spec a implementar (importante)
Estes padrões do documento original **ainda não estão no protótipo** e devem ser adicionados na implementação:
- **Badges de origem do dado:** "Dados reais" (verde `--green`), "Estimativa/Benchmark" (âmbar `--amber`),
  "Fallback IA" (slate). Usar o componente `Badge` já existente (tones good/warn/neutral). Colocar no canto dos cards/KPIs.
- **Multi-cliente:** seletor de cliente no topo (a sidebar já tem o bloco "Cliente ativo" — transformá-lo em dropdown).
- **Indicador de créditos de IA** no topbar.
- **Morning briefing por e-mail** (Resend) espelhando o BriefingHero.
- **Snapshot diário (cron)** alimentando os chips "vs. ontem"/"vs. semana".

---

## Stack de destino (do projeto atual)
Next.js + React + Tailwind · componentes em `components/dashboard/*.tsx` · Auth Clerk · Billing Stripe ·
DB Supabase · IA Claude (principal) + Gemini (apoio) + OpenAI (embeddings). O redesign **não muda a stack** —
muda tokens (globals.css/tailwind), estrutura de navegação e os componentes de apresentação.

### Caminho de implementação sugerido
1. **Tokens primeiro:** substituir o `globals.css` (navy/roxo) pelas variáveis deste pacote; mapear no `tailwind.config`.
   Isso já vira a chave do visual no app inteiro.
2. **Shell:** Sidebar (6+2) + Topbar + NOUS rail.
3. **Hoje** (maior impacto de retenção) → **Desempenho** → **Diagnóstico** → demais.
4. Trocar gráficos caseiros pela lib de vocês mantendo a paleta `--dv-*`.
5. Adicionar os padrões de UX faltantes (badges de origem, multi-cliente, créditos).

---

## Fontes & assets
- **Fontes:** Schibsted Grotesk + JetBrains Mono (Google Fonts). No app, importar via `next/font` ou `@import`.
- **Logo / NousOrb:** marcas **originais** em SVG inline (`shell.jsx` `Logo`, `nous.jsx` `NousOrb`) — substituíveis
  pelo logo oficial do Elyon quando disponível. Gradiente da marca: `#2C5FE0 → #0E9CB0`.
- **Marcas de canal:** `ChannelMark` desenha um quadrado com inicial (cores aproximadas das plataformas) —
  trocar pelos logos oficiais se desejado.
- **Criativos:** placeholders listrados; substituir por imagens reais do Storage.
- Nenhum asset binário neste pacote além das fontes (via CDN).

## Arquivos neste pacote
```
prototype/
  index.html              ← entrada; ordem de carga dos scripts
  app.css                 ← TODOS os tokens + utilitários + responsivo
  data.js                 ← mock data (window.DATA) = contrato de dados sugerido
  polish.jsx              ← Toast, Modal, DropdownMenu, PeriodPicker, NotificationsPanel, EmptyState
  charts.jsx              ← Sparkline, LineChart, Donut, Funnel, Bars, Gauge, Radar, ProgressBar
  ui.jsx                  ← Icon, Card, Badge, Button, StatCard, Segmented, Input… + dicionário ICONS
  nous.jsx                ← NousOrb, NousRail (copiloto), InsightCard
  shell.jsx               ← Logo, Sidebar, Topbar
  screens-auth.jsx        ← Login, Onboarding
  screens-hoje.jsx        ← Hoje (home diária)
  screens-desempenho.jsx  ← Desempenho (sub-abas) + SubTabs, DataTable
  screens-misc.jsx        ← Diagnóstico (+ Auditoria 11D), Mercado, PlanoAcao (+ Estratégia), Relatorios (+ Portal), Integracoes, Config (+ Memória)
  screens-extra.jsx       ← Audiencias, AlocadorIA, CampanhaDetalhe (drill-down), AuditBlock, EstrategiaBlock, MemoriaBlock, PortalBlock
  screens-planos.jsx      ← Planos + JourneyStepper + PlanCard
  app.jsx                 ← root, roteamento de áreas, persistência
```
