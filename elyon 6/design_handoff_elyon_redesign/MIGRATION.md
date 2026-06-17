# MAPA DE MIGRAÇÃO — Protótipo "Clarity" → Repositório `Elyon-Nous`

> **Objetivo:** levar o redesign do protótipo (`prototype/*.jsx` — HTML+React+Babel,
> referência de design) para o codebase real **Next.js 14 + Tailwind + TypeScript**, em
> PRs pequenas e revisáveis, terminando em deploy na Vercel.
>
> **Regra de ouro:** o protótipo é **referência visual**, não código de produção. Não copie
> JSX literal — recrie cada peça com os componentes/estado/dados que já existem no repo.
> A lógica (APIs, store, dados) **já existe**; o trabalho é **re-tematizar + completar telas**.

---

## Stack confirmada (do repo)
- **Next.js 14** (App Router) · rotas em `app/(elyon)/<area>/page.tsx`
- **Tailwind** (`tailwind.config.ts`) + CSS vars (`lib/cssVars.ts`)
- **Sistema de modo** Simplificada/Avançada: `lib/viewMode.ts`, `lib/modeTheme.ts`, `components/dashboard/ModeToast.tsx`
- **Charts:** Recharts (`GrowthChart`, `RevenueChart`, `FunnelChart`, `StatCard`)
- **Shell:** `layout.tsx` + `DashboardSidebar.tsx` / `DashboardTopbar.tsx` (confirmar se o que está no ar é esse ou a pasta `components/dashboard/v2/`)
- **Deploy:** Vercel (`vercel.json`) — push em branch = Preview Deploy; merge na `main` = produção.

> ⚠️ **Confirmar antes de começar:** abra `app/(elyon)/layout.tsx` e veja **quais componentes
> de shell ele realmente importa** (Sidebar/Topbar "legado" vs. `v2/`). Aplique o redesign
> no que está montado no layout. Este mapa assume o shell que o `layout.tsx` usa hoje.

---

## PR 0 — Tokens (faça primeiro; muda ~70% do visual sozinho)

| Protótipo (origem) | Repo (destino) | O que fazer |
|---|---|---|
| `prototype/app.css` → bloco `:root` | `tailwind.config.ts` (theme.extend.colors/borderRadius/boxShadow) **e** `lib/cssVars.ts` | Substituir pelos valores Clarity (abaixo). |
| `prototype/app.css` → `@keyframes`, `.live-dot`, `.sheen`, `.count-up`, `.eyebrow`, `.mono` | CSS global do app (`app/globals.css` ou equivalente) | Portar as utilities/animações novas. |

**Valores-chave (de `prototype/app.css`):**
```
--blue #2B5BE3   --blue-600 #1E47C4   --blue-soft #EBF0FE   --blue-line #CCDAFB
--green #0E9E6E  --green-soft #E3F6EE  --amber #D9870B
--canvas #F4F4F2 (quente)  --paper #FFF  --line #E6E5E0
--ink #18191D    --ink-2 #565862       --ink-3 #898C97
--ink-surface #181A20  --ink-line #2C2F38  --on-ink #F4F5F7  --on-ink-2 #A6ABB8  (superfície escura)
raios: sm 8 / md 12 / lg 16 / xl 22     sombras: sh-1/2/3 difusas, sh-ink p/ superfície escura
fontes: Schibsted Grotesk (sans) + JetBrains Mono (números)
```
> Aceite: app inteiro muda de cor/raio/sombra sem quebrar layout. Deploy de preview só com PR 0 já vale a pena revisar.

---

## PR 1 — Shell (Sidebar + Topbar)

| Protótipo | Repo | O que fazer |
|---|---|---|
| `prototype/shell.jsx › Sidebar` | `components/dashboard/DashboardSidebar.tsx` (ou `v2/SidebarV2`) | Grupos **Operação / Criação / Sistema**, item ativo, colapsar, troca de cliente, logout. |
| `prototype/shell.jsx › Topbar` | `components/dashboard/DashboardTopbar.tsx` (ou `v2/TopbarV2`) | Título+sub, período, créditos, notificações. |
| `prototype/shell.jsx › ModeSwitch` | `DashboardTopbar` + `components/dashboard/ModeToast.tsx` + `lib/viewMode.ts` | **Toggle de modo com ícones + botão "?" explicando quando usar cada modo** + toast ao trocar. |
| `prototype/shell.jsx › LiveSync` | novo: `components/dashboard/LiveSyncBadge.tsx` | Selo **AO VIVO** + popover de sync por canal (ligar nos timestamps reais de conexão). |

---

## PR 2 — Charts & cards base

| Protótipo | Repo | O que fazer |
|---|---|---|
| `prototype/charts.jsx › Sparkline/Line` | `GrowthChart.tsx`, `RevenueChart.tsx` | Linha 2.2, só ponto final destacado (halo), sparkline sutil. |
| `prototype/charts.jsx › Bars/Gauge/ProgressBar` | `FunnelChart.tsx` + novos helpers | Estilo Clarity; Gauge p/ scores (CRO, saúde). |
| `prototype/ui.jsx › StatCard` | `components/dashboard/StatCard.tsx` | Label+delta no topo, **número grande** em linha própria (mono, tabular-nums, count-up). |
| `prototype/ui.jsx › Card/Badge/Button/Input/SectionHead` | onde estiverem os primitives | Alinhar raios/sombras/hover. |

---

## PR 3 — Telas existentes (re-tematizar)

| Protótipo | Repo (rota) | Destaque |
|---|---|---|
| `screens-hoje.jsx › BriefingHero` | `app/(elyon)/hoje/page.tsx` | **Briefing escuro "command center"** + selo "ATUALIZADO AGORA" + bloco "Ganhos rápidos → Revisar e aprovar". |
| `screens-hoje.jsx › WhatChanged` | `app/(elyon)/hoje/page.tsx` | "O que mudou" em cards com **texto completo** (corrige o corte). |
| `screens-desempenho.jsx` | `app/(elyon)/desempenho/page.tsx` | Sub-abas, filtros, export, drill-down — só re-estilo. |
| `screens-misc.jsx` (Diagnóstico) | `app/(elyon)/diagnostico/page.tsx` | — |
| `screens-misc.jsx` (Mercado) | `app/(elyon)/mercado/page.tsx` | — |
| `screens-misc.jsx` (Plano) | `app/(elyon)/plano/page.tsx` | — |
| `screens-misc.jsx` (Relatórios) | `app/(elyon)/relatorios/page.tsx` | Ligar botões de export (já há `@react-pdf` + `xlsx`). |
| `screens-misc.jsx` (Integrações/Config) | `integracoes/page.tsx`, `config/page.tsx` | — |
| `screens-auth.jsx` | rota de auth (Clerk) | Split hero claro + form. |

---

## PR 4 — Módulos que faltam no layout novo (lógica já existe!)

> Estes `Tab*.tsx` **já existem no repo** mas não têm rota própria no grupo `(elyon)`.
> Criar a rota + aplicar o estilo Clarity (referência no protótipo `screens-studio2.jsx`).

| Protótipo (referência visual) | Repo (lógica existente) | Criar rota |
|---|---|---|
| `screens-studio2.jsx › ABTest` | `components/dashboard/TabABTest.tsx` | `app/(elyon)/abtest/page.tsx` |
| `screens-studio2.jsx › CRO` | `components/dashboard/TabCRO.tsx` | `app/(elyon)/cro/page.tsx` |
| `screens-studio2.jsx › Conteudo` | `components/dashboard/TabConteudo.tsx` + `lib/niche_content.ts` | `app/(elyon)/conteudo/page.tsx` |
| `screens-studio2.jsx › Financeiro` | `components/dashboard/TabFinanceiro.tsx` | `app/(elyon)/financeiro/page.tsx` |
| `screens-studio.jsx › CriarCampanha` | `components/dashboard/TabCriarCampanha.tsx` + `app/api/campaign/generate` | `app/(elyon)/criar/page.tsx` (ou `novo/`) |
| `screens-studio.jsx › Biblioteca` | `components/dashboard/TabAssets.tsx` + `app/api/assets/*` | `app/(elyon)/biblioteca/page.tsx` |

**+ Adicionar esses itens à navegação** (na Sidebar, grupos Criação/Sistema) — espelha o `nav` do protótipo (`prototype/data.js`).

---

## PR 5 — Polimento & QA
- Estados de **loading / empty / erro** (skeletons) nas telas novas.
- `prefers-reduced-motion` respeitado (já no CSS do protótipo).
- Acessibilidade: foco visível, `aria-label` nos ícones-botão.
- Testar nos dois modos (Simplificada/Avançada) e com sidebar colapsada.

---

## PR 6 — Landing page "Clarity" (`landing/ELYON LP Clarity.html`)

> A LP foi **migrada para a mesma linguagem do produto** (clara/editorial, azul-verde,
> Schibsted) — o arquivo `landing/ELYON LP Clarity.html` é HTML/CSS/JS puro e serve de
> **referência 1:1**. Conteúdo de vendas mantido; só o front mudou.

| Referência (origem) | Repo (destino) | O que fazer |
|---|---|---|
| `landing/ELYON LP Clarity.html` (head `:root`) | rota de marketing (`app/landing/` ou `app/(marketing)/page.tsx`) | Reusar os **mesmos tokens** do PR 0 — LP e app compartilham a paleta. |
| Hero + mock do produto | componente `<HeroMock/>` | O mock já reflete o **novo dashboard Clarity** (KPIs, selo AO VIVO, briefing escuro do NOUS). |
| Seletor de benchmark / abas de recurso / calculadora de ROI | ilhas client-side | Lógica simples em JS no arquivo — portar como componentes client (`'use client'`). |
| **Planos** | seção de pricing | **Valores reais e atuais:** Diagnóstico (Grátis) · Plataforma (R$297) · **Agency (R$997 — recomendado)** · Enterprise (R$2.997). Bater com Stripe. |
| CTAs | — | Todos apontam para `elyon-nous.vercel.app/sign-up`, `/sign-in`, `/checkout?plan=…`. Ajustar para as rotas reais. |

> A LP pode ir ao ar **independente** do dashboard (PRs 0–5) — é só uma rota estática.

---

## Ordem & deploy
1. Branch `redesign-clarity` a partir da `main`.
2. PRs na ordem **0 → 6** (cada uma gera um Preview Deploy na Vercel pra validar isolada). A LP (PR 6) é independente e pode ir a qualquer momento.
3. Confirme env vars na Vercel (Clerk, Stripe, Supabase, Sentry, Anthropic).
4. Aprovado → merge na `main` → produção automática.

> Dica p/ Claude Code: faça **uma PR por vez**, rode `npm run build` e `npm run lint`
> antes de cada commit, e cole screenshots do protótipo (`prototype/index.html`) como
> alvo visual de cada tela.
