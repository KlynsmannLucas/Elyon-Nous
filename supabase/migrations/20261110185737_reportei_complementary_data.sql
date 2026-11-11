BEGIN;

-- Clerk authenticates server routes. These tables are never directly available
-- to browser roles. A company token always belongs to one authenticated user.
CREATE TABLE public.reportei_connections (
  user_id text PRIMARY KEY,
  token_ciphertext text NOT NULL,
  company_id bigint NOT NULL,
  company_name text NOT NULL,
  connected_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS clients_id_user_id_unique ON public.clients(id, user_id);
CREATE TABLE public.reportei_client_links (
  user_id text NOT NULL REFERENCES public.reportei_connections(user_id) ON DELETE CASCADE,
  client_id uuid NOT NULL,
  project_id bigint NOT NULL,
  project_name text NOT NULL,
  timezone text NOT NULL,
  integration_ids bigint[] NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, client_id),
  UNIQUE (user_id, project_id),
  FOREIGN KEY (client_id, user_id) REFERENCES public.clients(id, user_id) ON DELETE CASCADE
);

CREATE TABLE public.reportei_snapshots (
  user_id text NOT NULL,
  client_id uuid NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  config_version text NOT NULL,
  payload jsonb NOT NULL,
  fetched_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, client_id, start_date, end_date, config_version),
  FOREIGN KEY (user_id, client_id) REFERENCES public.reportei_client_links(user_id, client_id) ON DELETE CASCADE,
  CHECK (end_date >= start_date)
);

ALTER TABLE public.reportei_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reportei_client_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reportei_snapshots ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.reportei_connections, public.reportei_client_links, public.reportei_snapshots FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reportei_connections, public.reportei_client_links, public.reportei_snapshots TO service_role;

COMMIT;
