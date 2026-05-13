-- Sistema de Memória/RAG — AGENT.md: Memory Agent
-- Execute no Supabase SQL Editor (dashboard.supabase.com)
-- Requer extensão pgvector — já disponível no Supabase

-- Habilita pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- Tabela principal de memória de campanhas (padrões aprendidos)
CREATE TABLE IF NOT EXISTS campaign_memory (
  id           UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      TEXT        NOT NULL,
  client_name  TEXT        NOT NULL,
  niche        TEXT        NOT NULL,

  -- Tipo de memória: winning_creative, losing_pattern, benchmark, audience_insight, copy_angle
  memory_type  TEXT        NOT NULL CHECK (memory_type IN (
    'winning_creative', 'losing_pattern', 'benchmark',
    'audience_insight', 'copy_angle', 'funnel_insight', 'general'
  )),

  -- Dados estruturados do padrão
  title        TEXT        NOT NULL,
  description  TEXT        NOT NULL,
  metrics      JSONB,        -- { cpl, roas, ctr, spend, leads, frequency }
  tags         TEXT[],       -- ['video', 'beneficio', 'prova_social']
  platform     TEXT,         -- 'meta', 'google', 'both'
  confidence   NUMERIC(3,2), -- 0.0 a 1.0

  -- Embedding para busca semântica
  embedding    vector(1536), -- OpenAI text-embedding-3-small

  -- Metadata
  source       TEXT,         -- 'audit', 'manual', 'pipeline'
  period       TEXT,         -- 'Jan 2025', 'Q1 2025'
  created_at   TIMESTAMPTZ  DEFAULT NOW(),
  updated_at   TIMESTAMPTZ  DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_memory_user_client ON campaign_memory (user_id, client_name);
CREATE INDEX IF NOT EXISTS idx_memory_niche ON campaign_memory (niche);
CREATE INDEX IF NOT EXISTS idx_memory_type ON campaign_memory (memory_type);

-- Índice vetorial para busca semântica (IVFFlat — rápido para até 1M rows)
CREATE INDEX IF NOT EXISTS idx_memory_embedding ON campaign_memory
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Função para busca semântica (retorna memórias similares)
CREATE OR REPLACE FUNCTION search_campaign_memory(
  query_embedding vector(1536),
  target_user_id  TEXT,
  target_niche    TEXT DEFAULT NULL,
  match_threshold FLOAT DEFAULT 0.75,
  match_count     INT   DEFAULT 10
)
RETURNS TABLE (
  id          UUID,
  memory_type TEXT,
  title       TEXT,
  description TEXT,
  metrics     JSONB,
  tags        TEXT[],
  platform    TEXT,
  confidence  NUMERIC,
  similarity  FLOAT,
  created_at  TIMESTAMPTZ
)
LANGUAGE sql STABLE
AS $$
  SELECT
    m.id, m.memory_type, m.title, m.description,
    m.metrics, m.tags, m.platform, m.confidence,
    1 - (m.embedding <=> query_embedding) AS similarity,
    m.created_at
  FROM campaign_memory m
  WHERE
    m.user_id = target_user_id
    AND (target_niche IS NULL OR m.niche = target_niche OR m.niche = 'geral')
    AND 1 - (m.embedding <=> query_embedding) > match_threshold
  ORDER BY m.embedding <=> query_embedding
  LIMIT match_count;
$$;

-- Tabela de aprendizados rápidos (sem embedding — para consulta direta)
CREATE TABLE IF NOT EXISTS quick_learnings (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     TEXT        NOT NULL,
  client_name TEXT        NOT NULL,
  niche       TEXT        NOT NULL,
  category    TEXT        NOT NULL, -- 'cpl_improvement', 'scale_success', 'creative_win', 'audience_win'
  learning    TEXT        NOT NULL,
  before_cpl  NUMERIC,
  after_cpl   NUMERIC,
  improvement NUMERIC,    -- % de melhoria
  period      TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_learnings_user ON quick_learnings (user_id, client_name);
