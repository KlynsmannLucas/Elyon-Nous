BEGIN;
CREATE TABLE public.reportei_service_config (
  singleton boolean PRIMARY KEY DEFAULT true CHECK(singleton),
  company_id bigint NOT NULL UNIQUE,
  company_name text NOT NULL,
  token_ciphertext text,
  updated_by text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.reportei_service_links (
  user_id text NOT NULL,
  client_id uuid NOT NULL,
  company_id bigint NOT NULL REFERENCES public.reportei_service_config(company_id),
  project_id bigint NOT NULL,
  project_name text NOT NULL,
  timezone text NOT NULL,
  integration_ids bigint[] NOT NULL,
  native_bindings jsonb NOT NULL DEFAULT '{}',
  grant_type text NOT NULL CHECK(grant_type IN ('administrator','verified_native_accounts')),
  granted_by text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(user_id,client_id),
  FOREIGN KEY(client_id,user_id) REFERENCES public.clients(id,user_id) ON DELETE CASCADE
);
CREATE TABLE public.reportei_service_snapshots (
  user_id text NOT NULL,
  client_id uuid NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  config_version text NOT NULL,
  payload jsonb NOT NULL,
  fetched_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(user_id,client_id,start_date,end_date,config_version),
  FOREIGN KEY(user_id,client_id) REFERENCES public.reportei_service_links(user_id,client_id) ON DELETE CASCADE,
  CHECK(end_date>=start_date)
);

CREATE TABLE public.studio_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  client_id uuid NOT NULL,
  request_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'queued' CHECK(status IN ('queued','planning','rendering','ready','partial','error')),
  brief jsonb NOT NULL,
  plan jsonb,
  stage text NOT NULL DEFAULT 'Pronto para começar',
  error text,
  charges jsonb NOT NULL DEFAULT '[]',
  lease_until timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id,request_id),
  UNIQUE(id,user_id,client_id),
  FOREIGN KEY(client_id,user_id) REFERENCES public.clients(id,user_id) ON DELETE CASCADE
);
CREATE INDEX studio_jobs_client_created ON public.studio_jobs(user_id,client_id,created_at DESC);
CREATE TABLE public.studio_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  client_id uuid NOT NULL,
  job_id uuid,
  name text NOT NULL,
  kind text NOT NULL CHECK(kind IN ('reference','product','logo','generated')),
  format text CHECK(format IN ('square','feed','story','landscape')),
  storage_path text NOT NULL UNIQUE,
  mime_type text NOT NULL,
  width integer NOT NULL,
  height integer NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY(client_id,user_id) REFERENCES public.clients(id,user_id) ON DELETE CASCADE,
  FOREIGN KEY(job_id,user_id,client_id) REFERENCES public.studio_jobs(id,user_id,client_id) ON DELETE CASCADE
);
CREATE INDEX studio_assets_client_created ON public.studio_assets(user_id,client_id,created_at DESC);
CREATE UNIQUE INDEX studio_assets_job_format ON public.studio_assets(job_id,format) WHERE kind='generated';
CREATE TABLE public.studio_steps (
  job_id uuid NOT NULL,
  user_id text NOT NULL,
  client_id uuid NOT NULL,
  step text NOT NULL,
  status text NOT NULL CHECK(status IN ('charged','completed','failed')),
  charge_id uuid REFERENCES public.ai_credit_charges(id),
  operation text NOT NULL,
  cost integer NOT NULL,
  attempts integer NOT NULL DEFAULT 1,
  output jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(job_id,step),
  FOREIGN KEY(job_id,user_id,client_id) REFERENCES public.studio_jobs(id,user_id,client_id) ON DELETE CASCADE
);
CREATE TABLE public.studio_publications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  client_id uuid NOT NULL,
  job_id uuid NOT NULL,
  platform text NOT NULL CHECK(platform IN ('meta','google')),
  status text NOT NULL CHECK(status IN ('creating','paused','partial','failed')),
  fingerprint text NOT NULL,
  receipts jsonb NOT NULL DEFAULT '[]',
  error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(job_id,platform),
  FOREIGN KEY(job_id,user_id,client_id) REFERENCES public.studio_jobs(id,user_id,client_id) ON DELETE CASCADE
);
DO $$ DECLARE t text; BEGIN
  FOREACH t IN ARRAY ARRAY['reportei_service_config','reportei_service_links','reportei_service_snapshots','studio_jobs','studio_assets','studio_steps','studio_publications'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',t);
    EXECUTE format('REVOKE ALL ON public.%I FROM PUBLIC, anon, authenticated',t);
    EXECUTE format('GRANT SELECT,INSERT,UPDATE,DELETE ON public.%I TO service_role',t);
  END LOOP;
END $$;

-- Step receipts and the credit debit are committed in the same transaction.
CREATE FUNCTION public.elyon_studio_charge_step(p_user_id text,p_job_id uuid,p_step text,p_limit integer,p_cost integer,p_operation text)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path=public,pg_temp AS $$
DECLARE j public.studio_jobs; s public.studio_steps; receipt jsonb;
BEGIN
  SELECT * INTO j FROM public.studio_jobs WHERE id=p_job_id AND user_id=p_user_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Job not found'; END IF;
  IF p_step<>'plan' AND p_step NOT IN ('image:feed','image:story','image:square','image:landscape') THEN RAISE EXCEPTION 'Invalid step'; END IF;
  IF p_step='plan' THEN
    IF (j.brief->>'mode'='creative' AND (p_operation<>'assets_copy' OR p_cost<>2)) OR (j.brief->>'mode'<>'creative' AND (p_operation<>'campaign_generate' OR p_cost<>4)) THEN RAISE EXCEPTION 'Invalid planning charge'; END IF;
  ELSIF p_operation<>'assets_generate' OR p_cost<>5 OR j.brief->>'mode'='audience' OR NOT (j.brief->'formats' ? split_part(p_step,':',2)) THEN RAISE EXCEPTION 'Invalid image charge'; END IF;
  SELECT * INTO s FROM public.studio_steps WHERE job_id=p_job_id AND step=p_step FOR UPDATE;
  IF FOUND AND s.status IN ('charged','completed') THEN RETURN jsonb_build_object('allowed',true,'chargeId',s.charge_id,'reused',true,'completed',s.status='completed'); END IF;
  IF s.attempts>=4 THEN RETURN jsonb_build_object('allowed',false,'error','Limite de tentativas desta etapa atingido.'); END IF;
  receipt:=public.elyon_charge_credits(p_user_id,p_limit,p_cost,p_operation);
  IF NOT coalesce((receipt->>'allowed')::boolean,false) THEN RETURN receipt; END IF;
  INSERT INTO public.studio_steps(job_id,user_id,client_id,step,status,charge_id,operation,cost)
  VALUES(p_job_id,p_user_id,j.client_id,p_step,'charged',(receipt->>'chargeId')::uuid,p_operation,p_cost)
  ON CONFLICT(job_id,step) DO UPDATE SET status='charged',charge_id=excluded.charge_id,operation=excluded.operation,cost=excluded.cost,attempts=studio_steps.attempts+1,updated_at=now();
  RETURN receipt;
END $$;
CREATE FUNCTION public.elyon_studio_complete_step(p_user_id text,p_job_id uuid,p_step text,p_output jsonb)
RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path=public,pg_temp AS $$
BEGIN
  PERFORM 1 FROM public.studio_jobs WHERE id=p_job_id AND user_id=p_user_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Job not found'; END IF;
  PERFORM 1 FROM public.studio_steps WHERE job_id=p_job_id AND user_id=p_user_id AND step=p_step AND status='completed';
  IF FOUND THEN RETURN; END IF;
  IF p_step='plan' THEN UPDATE public.studio_jobs SET plan=p_output,updated_at=now() WHERE id=p_job_id AND user_id=p_user_id;
  ELSIF NOT EXISTS(SELECT 1 FROM public.studio_assets WHERE id=(p_output->>'assetId')::uuid AND user_id=p_user_id AND job_id=p_job_id) THEN RAISE EXCEPTION 'Asset not found'; END IF;
  UPDATE public.studio_steps SET status='completed',output=p_output,updated_at=now() WHERE job_id=p_job_id AND user_id=p_user_id AND step=p_step AND status='charged';
  IF NOT FOUND AND NOT EXISTS(SELECT 1 FROM public.studio_steps WHERE job_id=p_job_id AND user_id=p_user_id AND step=p_step AND status='completed') THEN RAISE EXCEPTION 'Step not charged'; END IF;
END $$;
CREATE FUNCTION public.elyon_studio_fail_step(p_user_id text,p_job_id uuid,p_step text)
RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path=public,pg_temp AS $$
DECLARE s public.studio_steps;
BEGIN
  SELECT * INTO s FROM public.studio_steps WHERE job_id=p_job_id AND user_id=p_user_id AND step=p_step FOR UPDATE;
  IF NOT FOUND OR s.status<>'charged' THEN RETURN; END IF;
  PERFORM public.elyon_refund_credits(p_user_id,s.charge_id);
  UPDATE public.studio_steps SET status='failed',updated_at=now() WHERE job_id=p_job_id AND step=p_step;
END $$;
REVOKE ALL ON FUNCTION public.elyon_studio_charge_step(text,uuid,text,integer,integer,text),public.elyon_studio_complete_step(text,uuid,text,jsonb),public.elyon_studio_fail_step(text,uuid,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.elyon_studio_charge_step(text,uuid,text,integer,integer,text),public.elyon_studio_complete_step(text,uuid,text,jsonb),public.elyon_studio_fail_step(text,uuid,text) TO service_role;
COMMIT;
