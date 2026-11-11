# Reportei interno e Estúdio de criação

A operação configura o Reportei uma única vez em `/config/integracoes`, acessível exclusivamente a administradores com `privateMetadata.role=admin` no Clerk. O usuário comum não informa credenciais do Reportei. A credencial fica cifrada no servidor com `REPORTEI_ENCRYPTION_KEY`; mantenha a chave compartilhada entre os dois projetos Vercel. Não rotacione a chave sem recifrar os registros. `REPORTEI_API_TOKEN`, se utilizado, é uma alternativa exclusiva do servidor.

Um vínculo administrativo concede acesso somente ao cliente e às integrações selecionadas. A associação automática compara os IDs das contas Meta/Google e verifica o acesso nativo. Nome de cliente não concede acesso e CRM exige autorização administrativa explícita. Fontes diretas e Reportei são preservados separadamente, no mesmo período e com o significado de cada evento. Contatos, conversas, cadastros e conversões não são somados como pessoas únicas. Uma cópia importada sem credencial de serviço mostra a última sincronização e a indisponibilidade da atualização; não equivale a uma sincronização contínua.

## Criação

`/criar` reúne três modos: campanha completa, criativo com referência e públicos. `/biblioteca` guarda referências e artes por UUID do cliente, em bucket privado. As imagens antigas continuam disponíveis apenas quando o nome antigo identifica exatamente um cliente daquele usuário. Não há reutilização por nome entre usuários. O servidor valida a propriedade de cada referência, decodifica a imagem e limita tamanho e pixels. Não recebe URLs arbitrárias para buscar imagens.

O agente usa GPT para planejamento estruturado e visão; o gerador OpenAI recebe efetivamente as imagens de referência. Os modelos estão em `services/studio/ai.ts`. O Gateway usa credenciais do servidor/OIDC; a edição com referências usa o adaptador OpenAI que declara suporte a imagens. Uma falha ambígua não troca automaticamente de provedor para evitar duplicação de execução. São necessárias credenciais de IA válidas e acesso aos modelos na conta da operação. O navegador nunca recebe chaves.

O plano distingue fatos, hipóteses e pendências. As sugestões de segmentação podem ser verificadas pelas conexões nativas do próprio cliente; sem acesso ou localização inequívoca, permanecem hipóteses. O orçamento informado é o total diário e a divisão entre canais preserva os centavos. Feed, Stories, quadrado e horizontal são salvos com as dimensões exibidas, sem cortar o produto no processamento final. Fidelidade e textos da arte precisam de revisão humana.

## Créditos e retomada

O planejamento custa 4 créditos; o modo criativo custa 2. Cada arte custa 5. Um pacote com duas artes custa até 14 créditos (12 no modo criativo); públicos custam 4. Cada etapa possui débito e recibo na mesma transação. Retomar usa os resultados e recibos existentes, sem cobrar novamente uma etapa concluída. Falhas sem resultado são estornadas pelo ID exato do débito. Uma execução interrompida abruptamente pode ser retomada após expirar a concessão de execução de oito minutos. A confirmação pendente de uma arte salva é reconciliada antes de gerar novamente.

## Envio às plataformas

O usuário revisa conta, localização real, verba, destino e conteúdo antes de solicitar o envio. O código de publicação é determinístico e recebe o plano persistido; a IA não executa ferramentas de escrita nem decide ativar anúncios. Campanha, conjunto/grupo e anúncios são criados PAUSADOS. O Nous não tem ação de ativação neste fluxo.

Meta: conta ativa em BRL, página elegível, arte pertencente ao trabalho, local verificado e, para site com leads/vendas, pixel da conta. WhatsApp exige número conectado à página e destino `wa.me` correspondente. Interesses selecionados são pesquisados novamente; remarketing exige uma base já existente na conta. Não há envio automático de listas de contatos. O formato selecionado determina Feed ou Stories. Formulários instantâneos e categorias especiais permanecem para configuração no gerenciador com o pacote exportável.

Google: Pesquisa, moeda BRL, localização confirmada e português. O usuário escolhe o CPC manual inicial. A operação é validada com `validateOnly=true` e então enviada atomicamente com `partialFailure=false`, sem repetição automática de mutações. As metas de conversão precisam ser revisadas na conta antes da ativação.

Um registro único por trabalho/canal impede envios duplicados. Falha antes de qualquer escrita permite corrigir a configuração; confirmação ambígua ou envio parcial exige conferir os IDs no gerenciador. Os objetos já criados permanecem pausados. Não existe reenvio automático de uma publicação com confirmação pendente.

## Verificação

`npx tsc --noEmit` e `npm run build` verificam o aplicativo. Os testes de segurança, marketing e Studio validam isolamento, credenciais, datas, referências, divisão de orçamento, autenticação e operações pausadas. Os testes `*-db.test.cjs` usam PostgreSQL local via PGlite, fornecido externamente por `PGLITE_MODULE`; não executam em produção. O teste visual com respostas simuladas cobre computador/celular, anexos, histórico, exportação e troca de cliente. Ele não comprova geração real pela IA ou aceitação final das contas Meta/Google.
