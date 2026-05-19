-- ─────────────────────────────────────────────────────────────────────────────
-- ELYON — Persistência de Auditoria, Ações Prioritárias e Score de Saúde
-- Execute no Supabase SQL Editor: dashboard.supabase.com → SQL Editor
-- Projeto usa Clerk (não Supabase Auth) → user_id é o Clerk userId (text)
-- supabaseAdmin (service role) contorna RLS no servidor → segurança por app layer
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. audit_reports ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.audit_reports (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          TEXT        NOT NULL,
  client_id        TEXT        NOT NULL,   -- clientName normalizado (lowercase, trim)
  client_name      TEXT        NOT NULL,
  data_sources     TEXT[]      DEFAULT '{}',  -- ['meta','google','upload']
  score            INTEGER,
  grade            TEXT,
  summary          TEXT,
  gargalos         JSONB       DEFAULT '[]',
  oportunidades    JSONB       DEFAULT '[]',
  plano_acao       JSONB,
  metrics_snapshot JSONB,      -- _realMetrics: totalSpend, totalLeads, avgCPL, avgROAS…
  raw_response     JSONB,      -- resposta completa da IA (para debug / reprocessamento)
  source           TEXT        DEFAULT 'ai',   -- 'ai' | 'benchmark'
  status           TEXT        DEFAULT 'completed',
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_reports_user_client
  ON public.audit_reports (user_id, client_id, created_at DESC);

-- ── 2. priority_actions ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.priority_actions (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           TEXT        NOT NULL,
  client_id         TEXT        NOT NULL,
  title             TEXT        NOT NULL,
  description       TEXT,
  platform          TEXT        NOT NULL DEFAULT 'ambos', -- 'meta'|'google'|'ambos'
  source            TEXT        NOT NULL DEFAULT 'auditoria',
  priority          INTEGER     DEFAULT 1,
  urgency           TEXT        NOT NULL DEFAULT 'media', -- 'critica'|'alta'|'media'|'baixa'
  status            TEXT        NOT NULL DEFAULT 'pendente', -- 'pendente'|'em_andamento'|'concluida'|'ignorada'
  metric            TEXT,       -- 'CPL'|'ROAS'|'CTR'|'Frequência'|'Tracking'|'Criativo'…
  evidence          TEXT,
  impact            TEXT,
  origin            TEXT,       -- audit_YYYY-MM-DD_clientname
  related_campaign  TEXT,
  related_adset     TEXT,
  related_ad        TEXT,
  audit_report_id   UUID        REFERENCES public.audit_reports(id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_priority_actions_user_client
  ON public.priority_actions (user_id, client_id, status, urgency);

CREATE INDEX IF NOT EXISTS idx_priority_actions_audit
  ON public.priority_actions (audit_report_id);

-- ── 3. client_health_scores ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.client_health_scores (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         TEXT        NOT NULL,
  client_id       TEXT        NOT NULL,
  score           INTEGER     NOT NULL,
  grade           TEXT        NOT NULL,
  source          TEXT        NOT NULL DEFAULT 'ai',  -- 'ai'|'benchmark'
  audit_report_id UUID        REFERENCES public.audit_reports(id) ON DELETE SET NULL,
  calculated_at   TIMESTAMPTZ DEFAULT NOW(),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_client_health_scores_user_client
  ON public.client_health_scores (user_id, client_id, calculated_at DESC);

-- Cada cliente tem apenas 1 score por usuário (upsert por user_id + client_id)
CREATE UNIQUE INDEX IF NOT EXISTS idx_client_health_scores_unique
  ON public.client_health_scores (user_id, client_id);

-- ── 4. Row Level Security (segurança adicional para acesso anônimo) ────────────
-- O servidor usa service role (bypassa RLS), mas deixamos as policies como proteção
ALTER TABLE public.audit_reports         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.priority_actions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_health_scores  ENABLE ROW LEVEL SECURITY;

-- Sem auth.uid() (projeto usa Clerk) — bloqueamos acesso direto pelo cliente
-- Apenas service role (servidor) pode ler/escrever
CREATE POLICY "service_only_audit_reports"
  ON public.audit_reports FOR ALL
  USING (false)
  WITH CHECK (false);

CREATE POLICY "service_only_priority_actions"
  ON public.priority_actions FOR ALL
  USING (false)
  WITH CHECK (false);

CREATE POLICY "service_only_health_scores"
  ON public.client_health_scores FOR ALL
  USING (false)
  WITH CHECK (false);

-- ── 5. updated_at auto-trigger ────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_audit_reports_updated_at
  BEFORE UPDATE ON public.audit_reports
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE TRIGGER trg_priority_actions_updated_at
  BEFORE UPDATE ON public.priority_actions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE TRIGGER trg_health_scores_updated_at
  BEFORE UPDATE ON public.client_health_scores
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
