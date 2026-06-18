# PROMPT DE FIDELIDADE — cole no Claude Code

> Use este prompt quando a implementação **não estiver fiel** ao protótipo. Ele é estrito:
> manda copiar valores exatos, proibir reinterpretação e comparar com screenshots.

---

Você está aplicando um redesign chamado "Clarity" neste repositório (Next.js + Tailwind + TS).
A implementação atual NÃO está fiel ao design de referência. Vamos corrigir com fidelidade total.

## PRIMEIRO: localize a pasta de handoff
O material de referência foi descompactado em uma pasta do projeto cujo nome pode variar
(ex: `elyon 7/design_handoff_elyon_redesign/`, `design_handoff_elyon_redesign/`, etc.).
Rode: `find . -name "MIGRATION.md" -path "*handoff*"` (ou procure por `PROMPT.md` + pasta `prototype/`).
Defina `HANDOFF=<caminho encontrado>` e use `$HANDOFF/...` em todas as referências abaixo.
Confirme comigo o caminho encontrado antes de prosseguir.

## Fontes de verdade (nesta ordem)
1. `$HANDOFF/prototype/` — protótipo HTML/React. É a referência VISUAL exata.
2. `$HANDOFF/prototype/app.css` — os tokens `:root`. Valores EXATOS abaixo.
3. `$HANDOFF/MIGRATION.md` — qual arquivo do protótipo → qual arquivo do repo.

## Regras de fidelidade (NÃO QUEBRE)
- NÃO reinterprete, NÃO "melhore", NÃO invente espaçamentos, cores ou tamanhos. Copie os valores.
- Use EXCLUSIVAMENTE os tokens abaixo. Proibido hex solto fora deles. Proibido cor do Tailwind padrão (blue-500, gray-800 etc.) — só os tokens Clarity.
- Replique as MEDIDAS do protótipo: raios, paddings, font-size, font-weight, letter-spacing, sombras, gaps.
- Fontes: títulos/corpo = **Schibsted Grotesk**; números/labels/mono = **JetBrains Mono** com `font-variant-numeric: tabular-nums`.
- Abra o arquivo de referência do protótipo ANTES de editar cada tela e replique a estrutura (ordem dos elementos, hierarquia, copy).
- Onde o protótipo usa superfície escura (`--ink-surface`), use superfície escura — não troque por card claro.
- Mantenha a stack, rotas, data-fetching, Clerk/Stripe/Supabase intactos. Só a camada de apresentação muda.

## TOKENS EXATOS (cole em tailwind.config.ts → theme.extend e/ou CSS :root)
```
/* superfícies */
--canvas:#F4F4F2; --canvas-2:#ECECE8; --paper:#FFFFFF; --paper-2:#FAFAF8;
/* superfície escura (hero/ação) */
--ink-surface:#181A20; --ink-surface-2:#20232B; --ink-line:#2C2F38;
--on-ink:#F4F5F7; --on-ink-2:#A6ABB8; --on-ink-3:#6E7480;
/* texto */
--ink:#18191D; --ink-2:#565862; --ink-3:#898C97; --ink-4:#B0B3BC;
/* linhas */
--line:#E6E5E0; --line-2:#EFEFEB; --line-strong:#D5D4CD;
/* azul (ação/dados) */
--blue:#2B5BE3; --blue-600:#1E47C4; --blue-500:#5485FF; --blue-soft:#EBF0FE; --blue-line:#CCDAFB;
/* verde (positivo) */
--green:#0E9E6E; --green-600:#0B855D; --green-500:#16B981; --green-soft:#E3F6EE; --green-line:#B7E6D1;
/* status */
--red:#E1483F; --red-soft:#FCEBE9; --amber:#D9870B; --amber-soft:#FBF0D9; --teal:#0E9CB0; --slate:#64748B;
/* raios */
--r-sm:8px; --r-md:12px; --r-lg:16px; --r-xl:22px; --r-pill:999px;
/* sombras */
--sh-1:0 1px 2px rgba(24,25,29,.04),0 1px 2px rgba(24,25,29,.04);
--sh-2:0 1px 3px rgba(24,25,29,.05),0 8px 20px -8px rgba(24,25,29,.10);
--sh-3:0 6px 20px -8px rgba(24,25,29,.14),0 24px 56px -20px rgba(24,25,29,.16);
--sh-ink:0 8px 28px -10px rgba(24,26,32,.45),0 2px 8px rgba(24,26,32,.20);
/* fontes */
--sans:"Schibsted Grotesk",system-ui,sans-serif;
--mono:"JetBrains Mono",ui-monospace,monospace;
```
Importe as fontes (Google Fonts): Schibsted Grotesk 400;500;600;700;800 e JetBrains Mono 400;500;600;700.

## Como trabalhar (loop de fidelidade, uma tela por vez)
1. Abra a tela no protótipo (ex: `$HANDOFF/prototype/screens-hoje.jsx`) e a tela correspondente no repo (MIGRATION.md diz qual).
2. Abra `$HANDOFF/prototype/index.html` no navegador, navegue até a tela, tire um screenshot.
3. Implemente a versão React/Tailwind replicando 1:1: estrutura, tokens, medidas, copy.
4. Rode o app, tire screenshot da SUA tela e compare lado a lado com o protótipo.
5. Ajuste até ficar visualmente idêntico (cores, espaçamento, tipografia, sombras).
6. `npm run build` + `npm run lint` antes do commit. Uma PR por tela/PR do MIGRATION.

## Ordem (siga o MIGRATION.md, PR 0 → 6)
- PR 0 — Tokens (faça primeiro; valida com 1 tela qualquer).
- PR 1 — Shell (Sidebar/Topbar: toggle de modo com "?", selo AO VIVO).
- PR 2 — Charts & StatCard.
- PR 3 — Telas existentes (Hoje com briefing ESCURO, etc.).
- PR 4 — Estúdio de Criação (4a: hub + StudioTabs), Persona (4b), módulos A/B·CRO·Conteúdo·Financeiro (4c).
- PR 5 — Loading/empty/erro + acessibilidade.
- PR 6 — Landing (`$HANDOFF/landing/ELYON LP Clarity.html`).

## Antes de começar
Confirme em `app/(elyon)/layout.tsx` qual shell está montado (DashboardSidebar/Topbar vs `components/dashboard/v2/`) e aplique NESSE. Me diga qual encontrou antes de prosseguir.

Comece pelo PR 0. Não avance de PR sem o build passar.
