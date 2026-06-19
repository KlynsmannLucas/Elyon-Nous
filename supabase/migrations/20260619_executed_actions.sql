-- Ações executadas pelo NOUS (fecha o loop: recomendação -> ação -> medição).
-- Guarda o CPL/spend da conta no momento da execução para comparar com o "depois"
-- (lido de daily_metrics).
create table if not exists executed_actions (
  id           uuid primary key default gen_random_uuid(),
  user_id      text not null,
  account_id   text,
  client_name  text,
  campaign_id  text,
  campaign_name text,
  action       text not null,           -- pause | resume | scale
  cpl_before   integer,                 -- CPL da conta no dia da execução (centavos? não: reais inteiros)
  spend_before integer,
  executed_at  timestamptz not null default now()
);

create index if not exists executed_actions_user_client_idx
  on executed_actions (user_id, client_name, executed_at desc);
