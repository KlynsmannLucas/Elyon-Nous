-- ─────────────────────────────────────────────────────────────────────────────
-- ELYON — Assets da Empresa: Bucket de Storage + Tabela de Metadados
-- Execute no Supabase SQL Editor: dashboard.supabase.com → SQL Editor → New query
-- Projeto usa Clerk (não Supabase Auth) → user_id é Clerk userId (text)
-- supabaseAdmin (service_role) contorna RLS no servidor
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. Bucket de Storage ──────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'client-assets',
  'client-assets',
  true,
  5242880,
  ARRAY['image/jpeg','image/jpg','image/png','image/gif','image/webp','image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

-- Qualquer pessoa pode ler (imagens públicas para exibição)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename  = 'objects'
      AND policyname = 'public_read_client_assets'
  ) THEN
    CREATE POLICY "public_read_client_assets"
      ON storage.objects FOR SELECT
      USING (bucket_id = 'client-assets');
  END IF;
END $$;

-- ── 2. Tabela de Metadados ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.client_assets (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       TEXT        NOT NULL,
  client_id     TEXT        NOT NULL,
  client_name   TEXT        NOT NULL,
  type          TEXT        NOT NULL
                  CHECK (type IN ('logo','product','lifestyle','banner','other')),
  name          TEXT        NOT NULL,
  storage_path  TEXT        NOT NULL,
  public_url    TEXT        NOT NULL,
  mime_type     TEXT        NOT NULL,
  size_kb       INTEGER     NOT NULL,
  uploaded_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_client_assets_user_client
  ON public.client_assets (user_id, client_id, uploaded_at DESC);
