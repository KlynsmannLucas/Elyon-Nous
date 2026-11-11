# Reportei como fonte complementar

O Nous mantém os dados diretos do Meta e Google Ads e acrescenta observações do
Reportei. As observações não entram novamente no investimento ou nas conversões
da conexão direta. A tela **Desempenho → Contatos e vendas** mostra as duas leituras
por conta, com definições, período, atualização e divergências.

## Significado das métricas

- Conversas iniciadas incluem retornos após 7 dias de inatividade; novos contatos
  por mensagem são outra métrica. Não somar as duas como pessoas únicas.
- Eventos Lead, Contact, formulários e cadastros concluídos podem se sobrepor.
- Conversões principais do Google dependem das ações configuradas e podem ser
  fracionadas. Todas as conversões já incluem as principais.
- Negócios no Kommo não são automaticamente contatos únicos nem originados dos
  anúncios. Ganhos do CRM não comprovam recebimento financeiro ou atribuição.
- Sem vínculo e coorte verificados, não há taxa anúncio → CRM ou ROAS comercial.
- Uma fonte indisponível ou uma métrica ausente é **não informado**, nunca zero.

A seleção inicial lê métricas numéricas de mídia, conversas, contatos, cadastros,
conversões e negócios disponíveis no catálogo. Os widgets dimensionais e valores
acumulados de todo o histórico do CRM são excluídos da comparação por período.
Métricas de campanha da conexão direta continuam na aba Campanhas. O vínculo
entre fornecedores é por ID de conta: nomes de campanha não identificam uma
mesma campanha com segurança. Não existe junção automática por nome.

## Conexão e isolamento

A conexão MCP deste chat não transfere credenciais ao site. No Nous, cada usuário
informa seu token da **API Reportei V2** em Integrações, escolhe o projeto e confirma
as integrações para seu cliente. O servidor valida o token e todos os IDs com essa
credencial. Nenhuma empresa, projeto ou conta real é fixada no código.

- Base oficial: https://app.reportei.com/api/v2
- Documentação: https://developers.reportei.com/
- Tokens criptografados com AES-256-GCM; `REPORTEI_ENCRYPTION_KEY` é obrigatória,
  hexadecimal de 32 bytes, somente no servidor. Não altera a chave dos tokens Meta/Google.
- Os dois projetos Vercel que servem os domínios do Nous usam a mesma chave Reportei.
- Tabelas novas com RLS e sem acesso de `anon`/`authenticated`. As rotas verificam
  Clerk e filtram `user_id`; a chave estrangeira `(client_id, user_id)` também
  impede vínculos entre usuários diferentes no banco.
- Um projeto Reportei é vinculado a um cliente do mesmo usuário.
- O cache inclui usuário, cliente, datas, projeto, integrações e versão da conexão.
  Validade de 15 minutos; Atualizar dados consulta novamente. Desconectar remove
  apenas vínculos e snapshots Reportei do usuário.
- A atualização ocorre na consulta, sem agendamento automático novo.

## Correções de dados

Google: paginação completa, remoção do limite de 25 campanhas, conversão numérica
antes de somar e preservação de conversões fracionadas. Meta e Google recebem as
mesmas datas inclusivas; últimos 7/14/30/90 dias terminam ontem. Hoje e mês atual
são parciais. As contas ainda precisam ter fusos e atribuição compatíveis; a tela
não trata igualdade numérica como prova de equivalência desses critérios.

Auditorias: totais de conta ou campanhas são usados uma vez, sem duplicar cliques,
impressões e receita. Custos mantêm centavos. Resultados de objetivos diferentes
não têm custo médio global comparável. A IA recebe o Reportei como contexto
complementar, incluindo ausência de dados e restrições de atribuição.

Relatórios anteriores continuam arquivados. Métricas anteriores à versão 2 ficam
marcadas para atualização e deixam de alimentar os indicadores atuais no cache.
Snapshots diários são filtrados pelo período escolhido, sem recuperar dados de
meses antigos como se fossem recentes. A série não estima receita multiplicando
investimento por ROAS de um período ou de outras contas.

## Implantação e validação

1. Aplicar `20261110185737_reportei_complementary_data.sql` antes de publicar.
2. Configurar `REPORTEI_ENCRYPTION_KEY` nos projetos que compartilham o banco.
3. Publicar, conectar o token pela tela e vincular projeto/integrações ao cliente.
4. Atualizar dados e gerar uma nova Análise Profunda para substituir os indicadores
   antigos. Consultas de dados não consomem créditos de IA; a análise segue seu custo.

Verificações: `npm run test:security`, `npm run test:marketing`, TypeScript,
build Next.js e testes PostgreSQL com `PGLITE_MODULE` para `test:credits-db` e
`test:reportei-db`. A validação de navegador com respostas isoladas cobre conexão,
vínculo, comparação, zero real, falha do CRM, ausência de token no armazenamento,
layout móvel e resposta tardia após troca de cliente.

O build desativa envio de sourcemaps, releases e telemetria ao Sentry. O SDK de
monitoramento de erros em runtime permanece habilitado.

A consulta real da API V2 dentro do Nous depende do token informado pelo usuário;
a validação por MCP no chat e os testes isolados não substituem essa etapa.
