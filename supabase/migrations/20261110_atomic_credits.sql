-- Apply BEFORE deploying the matching application changes.
BEGIN;
CREATE TABLE IF NOT EXISTS public.ai_credits (
  user_id text PRIMARY KEY, used integer NOT NULL DEFAULT 0 CHECK (used >= 0),
  "limit" integer NOT NULL DEFAULT 15, reset_at timestamptz NOT NULL
);
CREATE TABLE IF NOT EXISTS public.ai_credit_charges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id text NOT NULL,
  operation text NOT NULL, cost integer NOT NULL CHECK (cost > 0),
  period_end timestamptz NOT NULL, refunded boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ai_credit_charges_user_idx ON public.ai_credit_charges(user_id);
ALTER TABLE public.ai_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_credit_charges ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.ai_credits, public.ai_credit_charges FROM anon, authenticated;
GRANT ALL ON public.ai_credits, public.ai_credit_charges TO service_role;

CREATE OR REPLACE FUNCTION public.elyon_charge_credits(p_user_id text, p_limit integer, p_cost integer, p_operation text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r public.ai_credits%ROWTYPE; charge_id uuid;
  next_reset timestamptz := (date_trunc('month', now() AT TIME ZONE 'UTC') + interval '1 month') AT TIME ZONE 'UTC';
BEGIN
  IF p_limit < 0 OR p_cost <= 0 OR p_user_id IS NULL THEN RAISE EXCEPTION 'Invalid charge'; END IF;
  INSERT INTO public.ai_credits(user_id, used, "limit", reset_at)
    VALUES(p_user_id, 0, p_limit, next_reset) ON CONFLICT(user_id) DO NOTHING;
  SELECT * INTO r FROM public.ai_credits WHERE user_id = p_user_id FOR UPDATE;
  IF r.reset_at <= now() THEN r.used := 0; r.reset_at := next_reset; END IF;
  UPDATE public.ai_credits SET used=r.used, reset_at=r.reset_at, "limit"=p_limit WHERE user_id=p_user_id;
  IF r.used + p_cost > p_limit THEN
    RETURN jsonb_build_object('allowed',false,'used',r.used,'limit',p_limit,'remaining',greatest(0,p_limit-r.used));
  END IF;
  UPDATE public.ai_credits SET used = r.used + p_cost WHERE user_id = p_user_id;
  INSERT INTO public.ai_credit_charges(user_id,operation,cost,period_end)
    VALUES(p_user_id,p_operation,p_cost,r.reset_at) RETURNING id INTO charge_id;
  RETURN jsonb_build_object('allowed',true,'used',r.used+p_cost,'limit',p_limit,
    'remaining',p_limit-r.used-p_cost,'chargeId',charge_id);
END $$;

CREATE OR REPLACE FUNCTION public.elyon_refund_credits(p_user_id text, p_charge_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE c public.ai_credit_charges%ROWTYPE;
BEGIN
  -- Match lock order with charging: balance first, then charge.
  PERFORM 1 FROM public.ai_credits WHERE user_id=p_user_id FOR UPDATE;
  SELECT * INTO c FROM public.ai_credit_charges WHERE id=p_charge_id AND user_id=p_user_id FOR UPDATE;
  IF NOT FOUND OR c.refunded THEN RETURN; END IF;
  UPDATE public.ai_credit_charges SET refunded=true WHERE id=c.id;
  UPDATE public.ai_credits SET used=greatest(0,used-c.cost)
    WHERE user_id=p_user_id AND reset_at=c.period_end AND reset_at>now();
END $$;
REVOKE ALL ON FUNCTION public.elyon_charge_credits(text,integer,integer,text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.elyon_refund_credits(text,uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.elyon_charge_credits(text,integer,integer,text) TO service_role;
GRANT EXECUTE ON FUNCTION public.elyon_refund_credits(text,uuid) TO service_role;
COMMIT;
