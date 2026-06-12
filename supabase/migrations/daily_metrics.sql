-- Snapshots diários de métricas por conta de anúncio (Meta).
-- Alimenta o "pulse vs ontem" e deltas day-over-day reais.
-- Execute este SQL no Supabase SQL Editor (dashboard.supabase.com).

CREATE TABLE IF NOT EXISTS daily_metrics (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     TEXT        NOT NULL,
  account_id  TEXT        NOT NULL,
  platform    TEXT        NOT NULL DEFAULT 'meta',
  date        DATE        NOT NULL,
  spend       NUMERIC     DEFAULT 0,
  leads       INTEGER     DEFAULT 0,
  impressions BIGINT      DEFAULT 0,
  clicks      BIGINT      DEFAULT 0,
  cpl         NUMERIC,
  ctr         NUMERIC,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, account_id, platform, date)
);

CREATE INDEX IF NOT EXISTS idx_daily_metrics_lookup
  ON daily_metrics (user_id, account_id, date DESC);
