# PROMPT ÚNICO PARA O CLAUDE CODE

> Copie tudo abaixo da linha e cole no Claude Code, dentro do repositório `elyon-dashboard`.
> Anexe também a pasta `prototype/` e o arquivo `README.md` deste pacote.

---

Você vai **reimplementar o frontend do Elyon Nous** no codebase atual (Next.js + React + Tailwind,
componentes em `components/dashboard/*.tsx`), seguindo um redesign de alta fidelidade que está em
`design_handoff_elyon_redesign/`. **Não mude a stack, a auth (Clerk), o billing (Stripe), o banco
(Supabase) nem as integrações de IA (Claude/Gemini/OpenAI)** — só a camada de apresentação, os tokens
visuais e a estrutura de navegação.

## Regras de ouro
1. Os arquivos em `prototype/` são **referência de design em HTML/React-via-Babel** — NÃO copie como
   código de produção. Recrie cada tela com os padrões e componentes do nosso codebase, em `.tsx`.
2. Fidelidade **alta**: cores, tipografia, espaçamento, raios, sombras e interações são finais.
   Os valores exatos estão em `prototype/app.css` (`:root`) e no `README.md`.
3. **Tema light "terminal de dados premium"**. Remova completamente o tema escuro atual
   (navy `#080D1A` + roxo `#7C3AED`). **Nada de roxo.** Acentos são **azul `#2C5FE0`** + **verde `#0E9E6E`**.
4. Tipografia: **Schibsted Grotesk** (UI/títulos) + **JetBrains Mono** (números/dados/eyebrows, sempre
   com `tabular-nums`). Carregue via `next/font`.
5. Gráficos: use a lib que já temos (Recharts/visx) — mas **respeite o estilo** do protótipo: paleta
   `--dv-*`, eixos finos `--line`, labels mono `--ink-3`, tooltips em `--paper`, linhas suaves.

## Passo a passo (nesta ordem)
1. **Tokens primeiro.** Substitua `globals.css` pelas CSS variables de `prototype/app.css` e mapeie no
   `tailwind.config`. Isso já vira a chave do visual no app inteiro.
2. **Shell:** Sidebar com **6 áreas** (Hoje, Desempenho, Diagnóstico, Mercado, Plano de Ação, Relatórios)
   + 2 de sistema (Integrações, Configurações). Topbar com: título, **toggle Simplificada × Avançada**,
   **seletor de período**, **seletor multi-cliente**, **indicador de créditos de IA**, botão "Perguntar
   ao NOUS" e sino. **NOUS** é copiloto fixo (rail à direita ≥1280px; drawer no estreito; orb flutuante
   quando recolhido) — NÃO é uma aba.
3. **Hoje** (maior impacto de retenção): briefing do NOUS, score de saúde (gauge + pilares), KPIs,
   ações prioritárias com impacto em R$, metas (gamificação), alertas, streak. No modo Avançado mostra
   chips "o que mudou".
4. **Desempenho** (sub-abas): Visão geral · Campanhas (com **drill-down** por campanha: ROAS por objetivo,
   fase de aprendizado, ad sets, geo, posicionamentos, saúde do pixel) · Audiências · Canais · Criativos
   (com curva de fadiga) · Funil · **Alocador de Verba (IA)**.
5. **Diagnóstico** (sub-abas): Visão geral (radar maturidade vs. benchmark, gargalo, causas-raiz, SWOT)
   + **Auditoria profunda** (11 dimensões, nota, desperdício de verba, checklist de tracking, **segunda
   opinião do Gemini**, evolução vs. auditorias anteriores).
6. **Mercado:** demanda, benchmarks você × mercado, Share of Voice, oportunidades.
7. **Plano de Ação** (sub-abas): Execução (kanban + matriz impacto×esforço + roadmap; checklist no modo
   Simplificado) + **Estratégia 90 dias** (tese, matriz Escalar/Corrigir/Testar/Cortar, **persona-alvo**,
   ranking de canais, plano 7/30/90).
8. **Relatórios:** resumo do NOUS, gráficos, exportações (PDF/Excel/Slides/agendar), modelos e
   **Portal do cliente** (link compartilhável + seções visíveis).
9. **Integrações:** conexões OAuth com status/saúde/sincronização.
10. **Configurações:** workspace, preferências do NOUS, plano (→ tela **Planos**) e **Memória viva (RAG)**.
11. **Login + Onboarding:** Login com painel de marca. Onboarding começa com o fork **"Você já anuncia
    hoje?"** → *Já anuncio* (fast-lane: nome+nicho → conectar → auditoria automática) ou *Ainda não
    anuncio* (wizard guiado de 7 passos, modo iniciante).
12. **Planos:** jornada Diagnóstico → Acompanhamento → Operação + 4 planos (Diagnóstico Grátis,
    Plataforma R$297, Agency R$997 destacado, Enterprise R$2.997). Acessível por Configurações.

## Padrões transversais (aplicar em todas as telas)
- **Badges de origem do dado** em cards/KPIs: "Dados reais" (verde), "Estimativa/Benchmark" (âmbar),
  "Fallback IA" (slate). Componente `SourceBadge` no protótipo.
- **Multi-cliente**: todo dado é do cliente ativo; troca pelo seletor no topo.
- **Modos Simplificada × Avançada**: muda densidade, linguagem e layout (não só esconde coisas).
- **Chips de delta** ↑/↓ coloridos por sentido. **Snapshot diário** alimenta "vs. ontem/semana".
- **Créditos de IA**: cada operação de IA consome créditos; mostrar saldo no topo.
- Conecte o chat/insights do **NOUS** ao endpoint do Claude (no protótipo as respostas são mock).
- **Morning briefing por e-mail** (Resend) espelhando o card de briefing.

## Dados
`prototype/data.js` (`window.DATA`) é **mock** e serve como **contrato de dados sugerido** para os
componentes (formato de kpis, health, channelMix, funnel, actions, audiences, allocator, audit, strategy,
campaignDetail, market, memory, portal, clients, credits, plans). Substitua pelos dados reais das contas
conectadas mantendo o shape.

## Rotas (App Router)
`/hoje` `/desempenho` `/diagnostico` `/mercado` `/plano` `/relatorios` `/integracoes` `/config` `/planos`
(+ `/login`, `/onboarding`). Persista `modo` e `cliente ativo` no perfil do usuário.

## Definição de pronto
- Tema light aplicado em todo o app, sem nenhum vestígio de roxo.
- As 6 áreas + sistema navegáveis, com as sub-abas e drill-downs descritos.
- NOUS presente em todas as telas. Badges de origem, multi-cliente, créditos e os dois modos funcionando.
- Gráficos com a lib do projeto, no estilo do protótipo.
- Responsivo (sidebar colapsa; rail vira drawer <1280px; grids colapsam <920px).
- `prefers-reduced-motion` respeitado.

Leia o `README.md` deste pacote para os specs detalhados de cada tela, todos os tokens e o mapa de
componentes. Comece pelos tokens e pelo shell, depois Hoje, e siga a ordem acima.
