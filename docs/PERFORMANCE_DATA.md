# Desempenho com observações das contas

As sete abas usam o mesmo período inclusivo: visão geral, campanhas, contatos e
vendas, audiência, canais, criativos e funil. Não dependem de uma auditoria gerada
anteriormente. O Alocador IA foi removido da navegação; sua API autenticada responde
410, preservando apenas registros históricos de créditos.

## Escopo e fontes

O cliente é resolvido por nome único entre os clientes do usuário. Ambiguidade
impede a consulta. As contas selecionadas são lidas dos dados persistidos desse
cliente. `/api/performance/study` valida Clerk, UUID e propriedade antes de ler
tokens; ignora substituições de conta vindas da requisição. Mudança de cliente,
conta ou período limpa os painéis e cancela respostas pendentes.

Meta e Google falham independentemente. Totais parciais são identificados. Ausência
é `null`, exibida como travessão; um zero retornado continua zero. O período
anterior tem a mesma duração. CTR e CPC usam totais ponderados. Meta pagina com
Bearer em cabeçalho, cursores limitados e host fixo; não segue URLs de paginação
arbitrárias. Google preserva conversões fracionadas, centavos e campanhas removidas
que tiveram entrega no intervalo.

## Significado dos resultados

Campanhas são agrupadas por canal e evento principal. Conversas, formulários,
cadastros, compras, cliques e alcance mantêm unidades separadas. Alcance não é
somado entre campanhas. Novos contatos por mensagem não substituem conversas.
Aliases de compra e agregados de mensagens não são somados entre si. Campanha
sem conversão continua sem conversão; cliques não viram leads por fallback.

Meta lê os eventos de contato em insights da conta, evitando somar estimativas
por campanha. Google separa as categorias CONTACT, SUBMIT_LEAD_FORM, SIGNUP,
QUALIFIED_LEAD, REQUEST_QUOTE e PURCHASE das conversões principais gerais. O
valor de compras vem da categoria PURCHASE, quando disponível.

Reportei conserva fonte, conta, definição, horário e período. Negócios do Kommo
no período não são rotulados como novos contatos. `crm_created_leads`, se fornecido
explicitamente, pode aparecer como negócios criados; caso contrário a tela usa
`crm_total_leads` com o rótulo negócios no CRM (período). Integrações repetidas não
são somadas. Sem associação de uma mesma coorte, não há taxa anúncio → venda,
CAC comercial ou ROAS comercial calculado com totais independentes.

## Estudos e criativos

`/api/performance/study?view=daily|audience|creative` retorna conjuntos independentes.
Audiência permite escolher canal, recorte e evento: idade/gênero, regiões,
posicionamentos, dispositivos e horários; Google inclui dias da semana e redes.
Recortes com falha preservam os demais. Limites de cobertura são indicados.
Participações usam os registros retornados; recortes diferentes não são somados.

Criativos usam metadados reais para distinguir vídeo, imagem, carrossel, texto,
múltiplos formatos ou desconhecido. Miniatura sozinha não prova que seja imagem.
Vídeos mostram contagens de avanço quando disponíveis, sem tratar reproduções
como pessoas únicas. A análise opcional de texto e métricas informa o custo de
1 crédito; não afirma assistir ao vídeo. Nenhuma consulta de desempenho consome
créditos de IA ou altera campanhas. Ações manuais existentes exigem prévia de
impacto e confirmação explícita na tela.

## Validação

`npm run test:performance` cobre significados, ausências, formatos, datas,
paginação e isolamento. A suíte completa usa `node --test tests/*.test.cjs`;
testes SQL exigem PostgreSQL local via `PGLITE_MODULE`. TypeScript e build Next.js
verificam integração. A interface foi conferida com respostas simuladas em desktop
e viewport móvel de 390 px, incluindo falha Google, histórico, detalhe, confirmação
sem execução e resposta tardia na troca de cliente. Isso não comprova consultas
reais autenticadas, geração paga de IA ou mutações de anúncios.

A atualização contínua do CRM depende da credencial de serviço Reportei. Sem ela,
a tela mostra a pendência e oferece o período exato da última cópia disponível;
não apresenta essa cópia como atualização atual.
