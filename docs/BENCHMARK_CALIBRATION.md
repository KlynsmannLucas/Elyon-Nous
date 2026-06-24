# Estudo de Calibração dos Benchmarks de Nicho

Objetivo: deixar os benchmarks (`lib/niche_benchmarks.ts`, 166 nichos) mais
precisos e realistas — base do diagnóstico, estratégia, Radar e break-even.

## 1. Referência de mercado (BR, 2025–2026)

- **Meta Ads** CPL médio ~R$140 (alta ~21% YoY); **Google Ads** CPL médio ~R$350
  (alta ~5% YoY). Google quase sempre > Meta para o mesmo nicho. CPLs estão SUBINDO.
- Faixas BR por setor (Google Ads): Jurídico R$80–350 · Saúde R$15–80 · Serviços
  profissionais R$40–180 · Contabilidade/Financeiro R$50–200 · Tecnologia R$60–280 ·
  Educação R$20–100.
- **Regra de ouro:** CPL deve ser **< ~10% do ticket** (venda única) — ou comparado
  ao **LTV** quando recorrente. O CPL dos primeiros 30 dias é mais alto (aprendizado);
  estabiliza em 45–90 dias; cai 30–50% após ~6 meses de otimização.

Fontes: ALM Corp (Google Ads Benchmarks 2026), Agência Mestre, Safira Design, M Cabral.

## 2. Auditoria de consistência (CPL × break-even)

Para cada nicho calculei o **CPL máximo lucrativo** ≈ `ticket × margem(0.4) × cvr × ltv`
e comparei com o `cpl_max` do benchmark (`ratio = cpl_max / cpl_lucrativo`).

### 🔴 ratio > 1 — o topo da faixa de CPL fica no PREJUÍZO (e-commerce/moda)
`moda` (4.3), `ecommerce_moda` (3.9), `ecommerce_cosmeticos` (2.8), `ecommerce` (2.7), `educacao` (1.16).

**Causa:** e-commerce/varejo é avaliado por **ROAS/CPA**, não por `CPL × cvr`. O modelo
de break-even (lead→venda) penaliza esses nichos: o `cpl_max` (ex.: R$50 em moda) só
faz sentido como **custo por COMPRA**, não por lead — e aí o `cvr` não deveria entrar.
**Recomendação:** tratar e-commerce/varejo como ROAS-first (não exibir "prejuízo" de
CPL) e ancorar o `cpl_max` ao CPA realista do ticket (moda R$180 → CPA ~R$15–35, não 50).

### 🟢 ratio < 0.25 — faixa CONSERVADORA, muita folga para escalar (alto ticket/LTV)
`energia_solar` (0.12), `rh_empresa` (0.12), `auditoria` (0.17), `consultoria` (0.18),
`odontologia` (0.18), `juridico` (0.20), `tecnologia` (0.19), `oftalmologia` (0.22)…

**Leitura:** NÃO são erros — são nichos de alto ticket/LTV onde dá pra pagar bem mais
por lead e ainda lucrar. A faixa atual é "segura" (não superestima custo). Útil
sinalizar no produto: "você pode escalar agressivo — CPL ainda muito abaixo do teto".

## 3. Recomendações priorizadas

1. **Corrigir o cluster e-commerce/varejo** (moda, ecommerce*, cosméticos): ancorar
   `cpl_max` ao CPA do ticket e/ou marcar como ROAS-based. (Alto impacto, baixo risco.)
2. **Reajuste de inflação 2025/26**: CPLs subiram; nichos com faixas antigas/baixas em
   serviços competitivos podem subir ~10–20% no `cpl_max`. (Médio — exige cuidado.)
3. **Calibração pela CONTA REAL (o padrão-ouro):** já temos `daily_metrics` + auditorias.
   Em vez de adivinhar por web, calibrar o benchmark de cada nicho pela performance
   AGREGADA das contas reais que a agência gerencia (CPL/ticket/cvr observados). Mostrar
   "seu real vs. benchmark do nicho" e, com volume, auto-tunar. (Maior valor a longo prazo.)

## 4. Como adicionar/editar um nicho
Ver `reference_add_niche` (memória): benchmark + KEY_MAP + NICHE_GROUPS + NICHE_KEYWORD_MAP.
