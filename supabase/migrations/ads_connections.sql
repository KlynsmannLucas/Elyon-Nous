-- Tabela para persistir conexões OAuth vinculadas ao usuário Clerk
-- Execute este SQL no Supabase SQL Editor (dashboard.supabase.com)

CREATE TABLE IF NOT EXISTS ads_connections (
  id           UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      TEXT        NOT NULL,
  platform     TEXT        NOT NULL CHECK (platform IN ('meta', 'google')),
  account_id   TEXT,
  account_name TEXT,
  access_token TEXT        NOT NULL,
  connected_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, platform)
);

-- Índice para busca por user_id
CREATE INDEX IF NOT EXISTS idx_ads_connections_user_id ON ads_connections (user_id);
