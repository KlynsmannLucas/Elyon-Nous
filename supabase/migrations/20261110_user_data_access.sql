-- Clerk identities are verified by Next.js; private tables are accessed only by
-- server routes with explicit user_id filters, never through the public anon key.
BEGIN;
DO $$
DECLARE table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'clients','ads_connections','audit_reports','priority_actions','client_health_scores',
    'campaign_metrics','daily_metrics','executed_actions','campaign_memory','quick_learnings',
    'activity_logs','client_assets','client_conversations','market_intelligence',
    'competitor_analysis','report_schedules','report_shares','strategy_history',
    'strategies','metrics','user_preferences'
  ] LOOP
    IF to_regclass('public.' || table_name) IS NOT NULL THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',table_name);
      EXECUTE format('REVOKE ALL ON TABLE public.%I FROM anon, authenticated',table_name);
      EXECUTE format('GRANT ALL ON TABLE public.%I TO service_role',table_name);
    END IF;
  END LOOP;
END $$;
COMMIT;
