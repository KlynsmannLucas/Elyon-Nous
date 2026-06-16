# PROMPT ÚNICO PARA O CLAUDE CODE — Elyon Nous · Redesign do Frontend

> **Como usar:** cole TUDO abaixo da linha no Claude Code, rodando dentro do repositório
> `elyon-dashboard`. Anexe também a pasta `prototype/` e o `README.md` deste pacote como
> contexto. O `README.md` traz specs detalhados e os valores exatos de cor/raio/sombra/etc.

---

## ⚡ ATUALIZAÇÃO — Redesign "CLARITY" (jun/2026, versão MAIS RECENTE)

> O `prototype/` deste pacote já está nesta versão nova. Onde houver conflito, **vale o que
> está no `prototype/app.css` (`:root`) e nos `.jsx`** — esta seção resume o que mudou:

1. **Tokens reajustados** (use exatamente os de `prototype/app.css`):
   - Azul primário **`#2B5BE3`** (era `#2C5FE0`) · azul-500 `#5485FF` · azul-soft `#EBF0FE`.
   - Âmbar **`#D9870B`** · canvas **quente** `#F4F4F2` (era frio `#F4F5F7`) · linhas `#E6E5E0`.
   - Raios mais precisos (md=12, sm=8, lg=16) e sombras mais difusas/baixo-contraste.
2. **Superfície escura "command center"** — novos tokens `--ink-surface #181A20`,
   `--ink-line #2C2F38`, `--on-ink`/`--on-ink-2`/`--on-ink-3`. Usada com parcimônia: **só
   no herói do Briefing (tela Hoje)** e momentos de ação. Tudo o mais segue light.
3. **Briefing do NOUS (Hoje) = herói escuro**: orb + eyebrow azul + selo **"ATUALIZADO
   AGORA"** (live-dot) + headline branca + resumo + CTAs (primário azul + ghost-on-dark)
   e um bloco de destaque **"Ganhos rápidos +R$ 41,8 mil → Revisar e aprovar"**
   (dado virando ação em R$). Ver `screens-hoje.jsx › BriefingHero`.
4. **Toggle de modo claro** (`shell.jsx › ModeSwitch`): dois botões **com ícone**
   (Simplificada = olho, Avançada = grade) + botão **"?"** com popover explicando
   **quando usar cada modo** + toast ao trocar. Resolve "saber quando mudar de modo".
5. **Indicador "AO VIVO"** (`shell.jsx › LiveSync`): pill verde com `live-dot` na topbar e
   popover com horário de sync por canal — passa a sensação de produto atualizado em tempo real.
6. **"O que mudou desde ontem"** (`screens-hoje.jsx › WhatChanged`): linha de cards com
   **texto completo** (corrige o corte de "ROAS geral subiu…" da versão anterior).
7. **KPIs e charts refinados**: `StatCard` com label+delta no topo e **número grande** em
   linha própria (mono, `tabular-nums`, count-up) + sparkline mais sutil (`strokeW≈1.6`).
   Linhas com traço 2.2 e **apenas o ponto final destacado** (com halo).
8. **Novas utilities CSS** (em `app.css`): `.live-dot` (anel pulsante), `.sheen` (brilho
   sutil de "recém-atualizado"), `.count-up` (entrada de números), `@keyframes liveRing/sheen`.
   Respeite `prefers-reduced-motion`.

> O restante do documento (arquitetura, telas, padrões) continua válido — só atualize os
> valores de token e adote os 8 itens acima.

---

Você vai **reimplementar o frontend do Elyon Nous** no codebase atual (Next.js + React +
Tailwind, componentes `.tsx` em `components/dashboard/`), seguindo um redesign de alta
fidelidade que está em `design_handoff_elyon_redesign/`. **Não mude a stack** (Clerk auth,
Stripe billing, Supabase DB, integrações de IA Claude/Gemini/OpenAI) — só a camada de
apresentação, os tokens visuais e a estrutura de navegação.

## Regras de ouro
1. Os arquivos em `prototype/` são **referência de design em HTML + React (via Babel)**.
   NÃO copie como código de produção. Recrie cada tela com os padrões e libs do nosso
   codebase, em `.tsx` tipado.
2. **Fidelidade alta**: cores, tipografia, espaçamento, raios, sombras e interações são
   finais. Os valores exatos estão em `prototype/app.css` (`:root`) e no `README.md`.
3. **Tema light "terminal de dados premium"**. Remova o tema escuro atual
   (navy `#080D1A` + roxo `#7C3AED`). **Nada de roxo.** Acentos: **azul `#2C5FE0`** +
   **verde `#0E9E6E`**. Status: vermelho `#E1483F`, âmbar `#E08B0B`, teal `#0E9CB0`.
4. **Tipografia** via `next/font`: **Schibsted Grotesk** (UI) + **JetBrains Mono**
   (números/dados/eyebrows, sempre com `tabular-nums`).
5. **Gráficos**: use a lib que já temos (Recharts/visx) com a paleta `--dv-*`, eixos finos
   `--line`, labels mono `--ink-3`, tooltips em `--paper`. O importante é o **estilo**,
   não a implementação.

## Arquitetura de navegação
**6 áreas + 2 de sistema** (era ~15 abas — enxugamos):
- **Hoje** · **Desempenho** · **Diagnóstico** · **Mercado** · **Plano de Ação** ·
  **Relatórios** + (sistema) **Integrações** · **Configurações**.
- **Planos** acessível pelo card "Plano" em Configurações (não fica na sidebar).
- **NOUS** é copiloto fixo (rail à direita ≥1280px, drawer com backdrop no estreito,
  orb flutuante quando recolhido). **Não é uma aba.**

Rotas (App Router): `/hoje` `/desempenho` `/diagnostico` `/mercado` `/plano` `/relatorios`
`/integracoes` `/config` `/planos` (+ `/login`, `/onboarding`).

## Telas — ordem de implementação
1. **Tokens primeiro.** Substitua `globals.css` pelas CSS variables de `prototype/app.css`
   (bloco `:root`) e mapeie no `tailwind.config.theme.extend`. Isso já vira a chave do
   visual no app inteiro.
2. **Shell:** Sidebar (6+2), Topbar (título, seletor de período funcional, toggle
   **Simplificada × Avançada**, **multi-cliente**, **créditos de IA**, botão "Perguntar
   ao NOUS", **notificações** com dropdown), NOUS rail.
3. **Hoje** (maior impacto de retenção): briefing do NOUS, score de saúde (gauge +
   pilares), KPIs, ações prioritárias com impacto em R$, metas, alertas, streak.
4. **Desempenho** (sub-abas): Visão geral · Campanhas (com **drill-down dinâmico** ao
   clicar uma linha: ROAS por objetivo, fase de aprendizado, ad sets, geo, posicionamentos,
   saúde do pixel) · Audiências · Canais · Criativos · Funil · **Alocador de Verba (IA)**.
5. **Diagnóstico** (sub-abas): Visão geral (radar, gargalo, causas, SWOT) + **Auditoria
   profunda** (11 dimensões, nota, desperdício de verba, checklist de tracking, **2ª
   opinião do Gemini**, evolução vs. auditorias anteriores).
6. **Mercado**: demanda, benchmarks você × mercado, Share of Voice, oportunidades.
7. **Plano de Ação** (sub-abas): Execução (kanban + matriz impacto×esforço + roadmap;
   checklist no modo Simplificado) + **Estratégia 90 dias** (tese, matriz
   Escalar/Corrigir/Testar/Cortar, persona-alvo, ranking de canais, plano 7/30/90).
8. **Relatórios**: resumo do NOUS, gráficos, exportações (PDF/Excel/Slides/agendar),
   modelos e **Portal do cliente** (link compartilhável + seções visíveis).
9. **Integrações**: conexões OAuth com status/saúde/sincronização e **modal "Conectar nova"**.
10. **Configurações**: workspace, preferências do NOUS (toggles funcionais), plano
    (→ tela Planos) e **Memória viva (RAG)**.
11. **Login + Onboarding**: Login com painel de marca, form valida no Enter.
    Onboarding começa com o fork **"Você já anuncia hoje?"** → *Já anuncio* (fast-lane:
    nome+nicho → conectar → auditoria automática) ou *Ainda não anuncio* (wizard guiado
    de 7 passos). Botão "Pular" sempre presente.
12. **Planos**: jornada Diagnóstico → Acompanhamento → Operação + 4 planos (Diagnóstico
    Grátis, Plataforma R$ 297, Agency R$ 997 destacado, Enterprise R$ 2.997).

## Padrões transversais (todas as telas)
- **Badges de origem do dado** em cards/KPIs: "Dados reais" (verde), "Estimativa/Benchmark"
  (âmbar), "Fallback IA" (slate). Use o componente `SourceBadge` do protótipo como
  referência de aparência.
- **Multi-cliente**: todo dado é do cliente ativo; troca pelo seletor (ClientSwitcher).
- **Modos Simplificada × Avançada** persistidos no perfil do usuário: muda densidade,
  linguagem e layout (não só esconde coisas).
- **Toast system** para feedback (aplicar alocação, recomendação, copiar link, ação
  concluída, exportar, mudança de período/modo). Toasts no canto inferior direito.
- **Modals padronizados**: Filtros (Campanhas), Exportar (Campanhas/Relatórios),
  Conectar nova (Integrações) — todos com backdrop blur, Esc fecha, click-out fecha.
- **DropdownMenus** com click-outside e Esc: seletor de período, notificações, multi-cliente.
- **Notificações**: dropdown ancorado no sino com contador de não lidas, marcação em
  massa, click navega para a área relevante.
- **Atalhos de teclado**: Esc fecha NOUS drawer/modal/dropdown; Enter envia formulários.
- **Persistência**: tela atual, área, modo, período, cliente ativo, sidebar colapsada,
  NOUS aberto/fechado — tudo no perfil do usuário (Supabase) ou localStorage (UI prefs).
- **Créditos de IA**: cada operação de IA (NOUS chat, sugestões, auditoria) consome
  créditos; mostrar saldo na topbar (CreditsPill).
- **Snapshot diário** (cron) alimentando "vs. ontem"/"vs. semana".
- **Morning briefing por e-mail** (Resend) espelhando o card de briefing do NOUS.
- **Chat do NOUS** plugado ao endpoint do Claude (no protótipo as respostas são mock
  por palavra-chave em `nous.jsx › NousRail.pick()`).
- **`prefers-reduced-motion`** respeitado — sem animações infinitas decorativas.

## Dados
`prototype/data.js` (`window.DATA`) é **mock** e serve como **contrato de dados sugerido**
para os componentes (formato de `kpis`, `health`, `channelMix`, `funnel`, `actions`,
`alerts`, `goals`, `campaigns`, `creatives`, `audiences`, `audienceMatrix`, `allocator`,
`campaignDetail`, `audit`, `strategy`, `memory`, `portal`, `diagnosis`, `market`, `clients`,
`credits`, `plans`, `journey`). Substitua pelos dados reais das contas conectadas
mantendo o shape.

## Definição de pronto (checklist final)
- [ ] Tokens light aplicados em todo o app, sem nenhum vestígio de roxo.
- [ ] 6 áreas + 2 de sistema navegáveis, com as sub-abas e drill-downs descritos.
- [ ] NOUS presente em todas as telas (rail/drawer/orb).
- [ ] Badges de origem, multi-cliente, créditos e dois modos funcionando.
- [ ] Period picker, notificações com contador, modais (Filtros/Exportar/Conectar nova).
- [ ] Toasts em todas as ações principais.
- [ ] Esc fecha tudo; Enter envia formulários.
- [ ] Gráficos com a lib do projeto, no estilo do protótipo.
- [ ] Responsivo (sidebar colapsa; rail vira drawer <1280px; grids colapsam <920px).
- [ ] `prefers-reduced-motion` respeitado.
- [ ] Build limpa, sem erros no console.

Leia o `README.md` deste pacote para os specs detalhados de cada tela, todos os tokens e o
mapa de componentes. Comece pelos **tokens**, depois **shell** (sidebar+topbar+NOUS), depois
**Hoje**, e siga a ordem da seção "Telas".
