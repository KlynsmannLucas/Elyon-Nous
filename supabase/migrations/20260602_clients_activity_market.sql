-- ─────────────────────────────────────────────────────────────────────────────
-- ELYON — Fase 1 & 2: clients + activity_logs + market_intelligence + competitors
-- Execute no Supabase SQL Editor: dashboard.supabase.com → SQL Editor
-- Projeto usa Clerk (não Supabase Auth) → user_id é Clerk userId (text)
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. clients ────────────────────────────────────────────────────────────────
-- Tabela principal: armazena ClientData, StrategyData, AuditData e extra_data
-- (personas, competitors, conversations, fees, workflow states, market research)
CREATE TABLE IF NOT EXISTS public.clients (
  id            TEXT        PRIMARY KEY,
  user_id       TEXT        NOT NULL,
  client_data   JSONB       NOT NULL,
  strategy_data JSONB,
  audit_data    JSONB,
  extra_data    JSONB,
  saved_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS clients_user_id_idx ON public.clients (user_id);
CREATE INDEX IF NOT EXISTS clients_updated_idx ON public.clients (user_id, updated_at DESC);

-- Adiciona coluna extra_data se ainda não existir (migration segura)
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS extra_data JSONB;

-- ── 2. activity_logs ──────────────────────────────────────────────────────────
-- Rastreabilidade de todas as ações do usuário no dashboard
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     TEXT        NOT NULL,
  client_id   TEXT,                   -- clientName normalizado (opcional, para ações de cliente)
  client_name TEXT,
  module      TEXT        NOT NULL,   -- 'assets' | 'clients' | 'audit' | 'persona' | 'campaign' | ...
  action      TEXT        NOT NULL,   -- 'upload' | 'delete' | 'generate' | 'save' | 'connect' | ...
  detail      TEXT,                   -- descrição legível da ação
  metadata    JSONB,                  -- dados extras (nome do arquivo, tipo, etc.)
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id   ON public.activity_logs (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_module    ON public.activity_logs (user_id, module, created_at DESC);

-- ── 3. market_intelligence ────────────────────────────────────────────────────
-- Armazena pesquisas de mercado geradas por IA por cliente
CREATE TABLE IF NOT EXISTS public.market_intelligence (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       TEXT        NOT NULL,
  client_id     TEXT        NOT NULL,
  client_name   TEXT        NOT NULL,
  niche         TEXT,
  competitors   JSONB       DEFAULT '[]',   -- análise de competidores
  opportunities JSONB       DEFAULT '[]',   -- oportunidades identificadas
  mistakes      JSONB       DEFAULT '[]',   -- erros comuns do nicho
  raw_data      JSONB,                      -- resposta completa da IA/Manus
  source        TEXT        DEFAULT 'ai',   -- 'ai' | 'manus'
  fetched_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_market_intelligence_user_client
  ON public.market_intelligence (user_id, client_id, fetched_at DESC);

-- Upsert por usuário+cliente (apenas 1 registro de inteligência por cliente)
CREATE UNIQUE INDEX IF NOT EXISTS idx_market_intelligence_unique
  ON public.market_intelligence (user_id, client_id);

-- ── 4. competitor_analysis ────────────────────────────────────────────────────
-- Análise individual de competidores por cliente
CREATE TABLE IF NOT EXISTS public.competitor_analysis (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         TEXT        NOT NULL,
  client_id       TEXT        NOT NULL,
  client_name     TEXT        NOT NULL,
  competitor_name TEXT        NOT NULL,
  notes           TEXT,
  ads             JSONB       DEFAULT '[]',    -- anúncios coletados
  analysis        JSONB,                       -- análise IA (positioning, weaknesses, etc.)
  analyzed_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_competitor_analysis_user_client
  ON public.competitor_analysis (user_id, client_id, analyzed_at DESC);

-- ── 5. client_conversations ───────────────────────────────────────────────────
-- Histórico de conversas do chat NOUS por cliente
CREATE TABLE IF NOT EXISTS public.client_conversations (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     TEXT        NOT NULL,
  client_id   TEXT        NOT NULL,
  client_name TEXT        NOT NULL,
  messages    JSONB       DEFAULT '[]',   -- array de {role, content, ts, dataSource}
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_conversations_user_client
  ON public.client_conversations (user_id, client_id);

CREATE INDEX IF NOT EXISTS idx_conversations_updated
  ON public.client_conversations (user_id, updated_at DESC);
