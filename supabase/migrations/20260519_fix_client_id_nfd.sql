-- Migration: fix client_id para nomes de clientes com acentos (normalizeClientId NFD)
-- ==================================================================================
-- CONTEXTO:
--   Antes do fix NFD, "Clínica ABC" gerava client_id = "cl_nica_abc" (í virava _)
--   Depois do fix NFD,  "Clínica ABC" gera  client_id = "clinica_abc"  (correto)
--
-- NOTA: priority_actions e client_health_scores NÃO têm coluna client_name.
--   O client_name só existe em audit_reports. Por isso as queries fazem JOIN.
--   Ordem obrigatória: priority_actions → client_health_scores → audit_reports
--   (audit_reports é atualizado por último para o JOIN ainda funcionar)
--
-- COMO EXECUTAR:
--   1. Abra o Supabase Dashboard → SQL Editor
--   2. Cole TODO o script de uma vez e clique em Run
--   3. Leia os resultados do STEP 1 (PREVIEW) antes de confirmar que está ok
--   4. Se quiser reverter: execute só os blocos UPDATE com os valores invertidos
-- ==================================================================================

-- Requer extensão unaccent (já disponível no Supabase)
CREATE EXTENSION IF NOT EXISTS unaccent;

-- Função auxiliar que simula o novo normalizeClientId
CREATE OR REPLACE FUNCTION _elyon_normalize_client_id(name text) RETURNS text AS $$
DECLARE
  result text;
BEGIN
  IF name IS NULL OR trim(name) = '' THEN RETURN ''; END IF;
  result := trim(lower(unaccent(name)));
  result := regexp_replace(result, '[^a-z0-9[:space:]]', ' ', 'g');
  result := trim(result);
  result := regexp_replace(result, '\s+', '_', 'g');
  result := regexp_replace(result, '^_+|_+$', '', 'g');
  RETURN result;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ──────────────────────────────────────────────────────────────────────────────
-- STEP 1: PREVIEW — quais clientes e quantos registros serão afetados
-- ──────────────────────────────────────────────────────────────────────────────

-- Clientes afetados em audit_reports (fonte primária de client_name)
SELECT
  ar.client_name,
  ar.client_id                                    AS client_id_legado,
  _elyon_normalize_client_id(ar.client_name)      AS client_id_novo,
  count(DISTINCT ar.id)                           AS audit_reports,
  count(DISTINCT pa.id)                           AS priority_actions,
  count(DISTINCT chs.id)                          AS health_scores
FROM audit_reports ar
LEFT JOIN priority_actions pa
       ON pa.user_id   = ar.user_id
      AND pa.client_id = ar.client_id
LEFT JOIN client_health_scores chs
       ON chs.user_id   = ar.user_id
      AND chs.client_id = ar.client_id
WHERE ar.client_id != _elyon_normalize_client_id(ar.client_name)
GROUP BY ar.client_name, ar.client_id
ORDER BY ar.client_name;

-- ──────────────────────────────────────────────────────────────────────────────
-- STEP 2: UPDATE priority_actions
--   (priority_actions não tem client_name → JOIN com audit_reports pelo client_id antigo)
-- ──────────────────────────────────────────────────────────────────────────────

UPDATE priority_actions pa
SET    client_id   = _elyon_normalize_client_id(ar.client_name),
       updated_at  = now()
FROM  (
  SELECT DISTINCT user_id, client_id, client_name
  FROM   audit_reports
  WHERE  client_id != _elyon_normalize_client_id(client_name)
) ar
WHERE  pa.user_id   = ar.user_id
  AND  pa.client_id = ar.client_id;

-- ──────────────────────────────────────────────────────────────────────────────
-- STEP 3: UPDATE client_health_scores
--   (client_health_scores também não tem client_name → mesmo JOIN)
--   Se já existir linha com o novo client_id, deleta a antiga antes de atualizar
-- ──────────────────────────────────────────────────────────────────────────────

-- Remove duplicata antiga quando já existe linha com novo client_id
DELETE FROM client_health_scores chs
USING (
  SELECT DISTINCT user_id, client_id, client_name
  FROM   audit_reports
  WHERE  client_id != _elyon_normalize_client_id(client_name)
) ar
WHERE chs.user_id   = ar.user_id
  AND chs.client_id = ar.client_id
  AND EXISTS (
    SELECT 1 FROM client_health_scores newer
    WHERE  newer.user_id   = chs.user_id
      AND  newer.client_id = _elyon_normalize_client_id(ar.client_name)
      AND  newer.id       != chs.id
  );

-- Atualiza as que sobraram
UPDATE client_health_scores chs
SET    client_id   = _elyon_normalize_client_id(ar.client_name),
       updated_at  = now()
FROM  (
  SELECT DISTINCT user_id, client_id, client_name
  FROM   audit_reports
  WHERE  client_id != _elyon_normalize_client_id(client_name)
) ar
WHERE  chs.user_id   = ar.user_id
  AND  chs.client_id = ar.client_id;

-- ──────────────────────────────────────────────────────────────────────────────
-- STEP 4: UPDATE audit_reports (por último — tem client_name, não precisa de JOIN)
-- ──────────────────────────────────────────────────────────────────────────────

UPDATE audit_reports
SET    client_id = _elyon_normalize_client_id(client_name)
WHERE  client_id != _elyon_normalize_client_id(client_name);

-- ──────────────────────────────────────────────────────────────────────────────
-- STEP 5: VERIFICAÇÃO FINAL — deve retornar 0 linhas em todas as tabelas
-- ──────────────────────────────────────────────────────────────────────────────

SELECT 'priority_actions'    AS tabela, count(*) AS registros_com_id_legado
FROM   priority_actions
WHERE  client_id != (
  SELECT _elyon_normalize_client_id(ar2.client_name)
  FROM   audit_reports ar2
  WHERE  ar2.user_id = priority_actions.user_id
    AND  ar2.client_id = priority_actions.client_id  -- já atualizado
  LIMIT  1
)
UNION ALL
SELECT 'audit_reports',        count(*)
FROM   audit_reports
WHERE  client_id != _elyon_normalize_client_id(client_name)
UNION ALL
SELECT 'client_health_scores', count(*)
FROM   client_health_scores chs
WHERE  EXISTS (
  SELECT 1 FROM audit_reports ar
  WHERE  ar.user_id   = chs.user_id
    AND  ar.client_id = chs.client_id
    AND  chs.client_id != _elyon_normalize_client_id(ar.client_name)
);

-- Cleanup
DROP FUNCTION IF EXISTS _elyon_normalize_client_id(text);
